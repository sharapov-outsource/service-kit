/**
 * The HTTP shell every my* service is wrapped in.
 *
 * What a service still owns after this: its probes, its dictionary, its report
 * renderer and its grade. What it stops owning — and stops maintaining three
 * copies of — is everything below: content negotiation, the policy, the rate
 * limits, the cache, the event stream, the head of the page and the family
 * footer.
 *
 * The shape of a service is deliberately narrow. It hands over a `parse` that
 * turns a path segment into a target, a `run` that turns a target into a
 * report, and a list of stage names. Everything else has a default.
 */

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';

import { createI18n } from './i18n.js';
import { renderServiceLinks, serviceIndex } from './services.js';
import { createCache } from './cache.js';
import {
  wantedFormat, sendData, escapeHtml, originOf, clientIp,
} from './format.js';
import {
  buildCsp, securityHeaders, metrikaSnippet, METRIKA_HTTP, METRIKA_WS,
} from './security.js';

const KIT_PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** Error codes with a message of their own; anything else is a scan failure. */
const BASE_ERRORS = [
  'invalid-host', 'domain-expected', 'invalid-port', 'port-not-allowed',
  'dns-failed', 'private-address', 'unreachable', 'scan-timeout', 'busy', 'bad-output',
];

/**
 * @param {object} config
 * @param {string} config.slug        'mydns' — also the cache and storage prefix
 * @param {string} config.name        display name, used in the usage block
 * @param {string} config.domain      public domain, for the usage examples
 * @param {number} config.port        default listen port
 * @param {string} config.root        the service directory (the one with public/)
 * @param {string[]} config.stages    stage names, in order, for the progress bar
 * @param {(raw: string, req: object) => object} config.parse
 * @param {(target: object, ctx: object) => Promise<object>} config.run
 * @param {(target: object) => string} [config.cacheKey]
 * @param {(req: object) => string} [config.homeTarget]
 *   what `/` is about when nobody named a target — for a service that answers
 *   about the caller. Console clients get that scan instead of the usage block.
 * @param {(report: object, lang: string) => object} [config.localize]
 * @param {() => object} [config.health]
 * @param {object} [config.usage]     extra fields for the console usage block
 * @param {string[]} [config.errors]  extra error codes with their own message
 * @param {object} [config.csp]       extra policy sources
 * @returns {Promise<object>} the wired application, ready for `start()`
 */
export async function createService(config) {
  const {
    slug, name, domain, port: defaultPort, root, stages,
    parse, run, cacheKey = target => target.host,
    homeTarget,
    localize = report => report,
    health = () => ({}),
    usage: extraUsage = {},
    errors: extraErrors = [],
    csp: extraCsp = {},
    examples = [],
  } = config;

  const PUBLIC_DIR = path.join(root, 'public');
  const PORT = Number(process.env.PORT || defaultPort);
  const HOST = process.env.HOSTNAME || process.env.HOST || '0.0.0.0';

  /* Behind a reverse proxy the client address arrives in a header. Turn this
     off when the server faces the internet directly, otherwise a client can
     spoof its IP and walk past the limits. */
  const TRUST_PROXY = process.env.TRUST_PROXY !== 'false';

  /* A scan opens a burst of outbound connections, so the number running at once
     is capped hard: beyond it callers get a 503 rather than a slow queue. */
  const MAX_INFLIGHT = Number(process.env.MAX_INFLIGHT || config.maxInflight || 6);
  let inflight = 0;

  const KNOWN_ERRORS = new Set([...BASE_ERRORS, ...extraErrors]);
  const i18n = createI18n(path.join(PUBLIC_DIR, 'i18n.js'));
  const { t, tCode, pickLang, LANG_NAMES, LANG_LOCALES, SUPPORTED_LANGS } = i18n;
  const cache = createCache();

  /* ---------------------------------------------------------------- *
   * The page
   * ---------------------------------------------------------------- */

  const METRIKA_ID = process.env.METRIKA_ID || '';
  const analytics = metrikaSnippet(METRIKA_ID);

  /* Analytics is substituted once, at startup, because the policy hashes are
     computed from the finished markup — a snippet injected per request could
     not be covered by a hash. */
  const INDEX_HTML = readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8')
    .replace('%ANALYTICS%', analytics);
  const FAVICON = readFileSync(path.join(PUBLIC_DIR, 'favicon.ico'));

  const CSP = buildCsp(INDEX_HTML, {
    scriptSrc: [...(extraCsp.scriptSrc || []), ...(analytics ? METRIKA_HTTP : [])],
    connectSrc: [...(extraCsp.connectSrc || []), ...(analytics ? [...METRIKA_HTTP, ...METRIKA_WS] : [])],
    imgSrc: [...(extraCsp.imgSrc || []), ...(analytics ? METRIKA_HTTP : [])],
    frameSrc: [...(extraCsp.frameSrc || []), ...(analytics ? METRIKA_HTTP : [])],
  });

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      // Visitor IP addresses are kept out of the logs — only route and status.
      serializers: {
        req: req => ({ method: req.method, url: req.url }),
        res: res => ({ statusCode: res.statusCode }),
      },
    },
    trustProxy: TRUST_PROXY,
    maxParamLength: 300,
    bodyLimit: 8 * 1024,
    disableRequestLogging: process.env.LOG_REQUESTS !== 'true',
  });

  const HEADERS = securityHeaders();
  app.addHook('onSend', async (req, reply) => {
    reply.header('content-security-policy', CSP);
    for (const [header, value] of Object.entries(HEADERS)) reply.header(header, value);
  });

  await app.register(rateLimit, {
    global: true,
    max: Number(process.env.RATE_MAX || 120),
    timeWindow: process.env.RATE_WINDOW || '1 minute',
    ban: Number(process.env.RATE_BAN || 8),
    cache: 20000,
    keyGenerator: req => clientIp(req, TRUST_PROXY),
    addHeadersOnExceeding: { 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true },
    addHeaders: {
      'x-ratelimit-limit': true, 'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true, 'retry-after': true,
    },
    errorResponseBuilder: (req, ctx) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit of ${ctx.max} requests exceeded. Retry in ${Math.ceil(ctx.ttl / 1000)}s.`,
      retryAfterSeconds: Math.ceil(ctx.ttl / 1000),
    }),
  });

  /** A scan is expensive for us and noticeable for the target, so it is metered. */
  const scanLimit = {
    rateLimit: {
      max: Number(process.env.RATE_SCAN_MAX || 12),
      timeWindow: process.env.RATE_SCAN_WINDOW || '1 minute',
    },
  };

  await app.register(fastifyStatic, {
    root: PUBLIC_DIR,
    prefix: '/static/',
    index: false,
    maxAge: '1h',
    immutable: false,
    dotfiles: 'deny',
  });

  /* The design system — fonts, base stylesheet, shared dictionary, wordmark —
     is served from the package, so a service ships only what is its own. */
  await app.register(fastifyStatic, {
    root: KIT_PUBLIC,
    prefix: '/static/kit/',
    index: false,
    maxAge: '30d',
    immutable: true,
    decorateReply: false,
    dotfiles: 'deny',
  });

  /* ---------------------------------------------------------------- *
   * Errors
   * ---------------------------------------------------------------- */

  function errorPayload(err, lang) {
    const code = err.code && KNOWN_ERRORS.has(err.code) ? err.code : 'scan-failed';
    const payload = {
      statusCode: err.status || 502,
      error: code,
      message: t(lang, `err_${code.replace(/-/g, '_')}`),
      detail: err.detail || undefined,
    };
    if (code === 'port-not-allowed' && config.allowedPorts) {
      payload.allowedPorts = [...config.allowedPorts()].sort((a, b) => a - b);
    }
    return payload;
  }

  const badOutput = (reply, lang) => sendData(reply, 'json',
    errorPayload({ code: 'bad-output', status: 400 }, lang), { status: 400 });

  /* ---------------------------------------------------------------- *
   * Rendering the page
   * ---------------------------------------------------------------- */

  /**
   * The page, with the placeholders in its head filled in.
   *
   * A report page is a scan result, not a document worth indexing — robots.txt
   * already keeps crawlers off it, and `noindex` covers the case where somebody
   * links to one directly.
   */
  function sendHtml(reply, req, { target } = {}) {
    const origin = originOf(req);
    const label = target ? (config.pathFor ? config.pathFor(target) : target.host) : null;
    const pathname = label ? `/${encodeURIComponent(label)}` : '/';

    const lang = pickLang(req);
    /* `title_short` is the service's name at the width a report title can
       spare. A service that never defined one would otherwise put the word
       "undefined" in every report's <title>, which is the sort of thing that
       shows up in search results long before anyone notices it locally. */
    const title = label
      ? `${label} — ${t(lang, 'title_short') || t(lang, 'title')}`
      : t(lang, 'title');

    const html = INDEX_HTML
      .replaceAll('%ORIGIN%', origin)
      .replaceAll('%URL%', origin + pathname)
      .replaceAll('%ROBOTS%', label ? 'noindex, follow' : 'index, follow')
      .replaceAll('%LANG%', lang)
      .replaceAll('%DIR%', i18n.isRtl(lang) ? 'rtl' : 'ltr')
      .replaceAll('%LOCALE%', (LANG_LOCALES[lang] || lang).replace('-', '_'))
      .replaceAll('%TITLE%', escapeHtml(title))
      .replaceAll('%DESCRIPTION%', escapeHtml(t(lang, 'subtitle')))
      .replaceAll('%SERVICES%', renderServiceLinks(slug, key => t(lang, key)));

    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'public, max-age=300')
      .header('vary', 'accept, user-agent, accept-language')
      .send(html);
  }

  /* ---------------------------------------------------------------- *
   * Running a scan
   * ---------------------------------------------------------------- */

  function scanOptions(req) {
    return {
      refresh: req.query?.refresh === '1' || req.query?.refresh === 'true',
      query: req.query || {},
      /* Most services produce a report of machine codes and translate it on the
         way out, so the language never reaches `run`. It has to for a service
         whose upstream answers in a language — myip asks a geocoder for a
         street address — and such a service must fold it into `cacheSuffix`
         too, or the first caller's language is what everyone else gets. */
      lang: pickLang(req),
    };
  }

  async function scanCached(target, options = {}) {
    const suffix = config.cacheSuffix ? config.cacheSuffix(options.query || {}, options.lang) : '';
    const key = `${cacheKey(target)}|${suffix}`;
    return cache.run(key, () => run(target, options), { refresh: options.refresh });
  }

  /** Shared entry point for the data routes. */
  async function serveScan(req, reply, raw, format) {
    const lang = pickLang(req);
    const target = parse(raw, req);
    if (target.error) {
      const payload = errorPayload({ code: target.error, status: 400 }, lang);
      return sendData(reply, format, payload, { status: 400 });
    }

    if (inflight >= MAX_INFLIGHT) {
      return sendData(reply, format,
        errorPayload({ code: 'busy', status: 503 }, lang), { status: 503 });
    }

    inflight++;
    try {
      const report = await scanCached(target, scanOptions(req));
      const download = req.query?.download === '1' || req.query?.download === 'true';
      return sendData(reply, format, localize(report, lang), {
        filename: download ? `${slug}-${cacheKey(target)}` : undefined,
      });
    } catch (err) {
      const payload = errorPayload(err, lang);
      if (payload.statusCode >= 500) req.log.error({ err: err.message, target: raw }, 'scan failed');
      return sendData(reply, format, payload, { status: payload.statusCode });
    } finally {
      inflight--;
    }
  }

  /* ---------------------------------------------------------------- *
   * Routes
   * ---------------------------------------------------------------- */

  app.get('/healthz', { config: { rateLimit: false } }, async () => ({
    status: 'ok',
    service: slug,
    uptime: Math.round(process.uptime()),
    cache: cache.stats(),
    languages: SUPPORTED_LANGS,
    inflight,
    // Awaited: a service whose health needs to read a file or open a socket
    // returns a promise, and spreading one silently yields nothing at all.
    ...(await health()),
  }));

  app.get('/robots.txt', { config: { rateLimit: false } }, async (req, reply) =>
    reply.type('text/plain; charset=utf-8').send(
      [
        // Crawlers are welcome on the home page only: walking arbitrary names
        // would turn every crawl into a burst of outbound probes.
        'User-agent: *',
        'Allow: /$',
        // The assets stay allowed on purpose. Every page in the family is drawn
        // by its own script, so a crawler that cannot fetch /static/ runs
        // nothing, renders nothing, and indexes an empty body.
        'Allow: /static/',
        'Allow: /favicon.ico',
        'Allow: /site.webmanifest',
        'Disallow: /api',
        'Disallow: /',
        '',
        `Sitemap: ${originOf(req)}/sitemap.xml`,
        '',
      ].join('\n')
    )
  );

  app.get('/sitemap.xml', { config: { rateLimit: false } }, async (req, reply) =>
    reply.type('application/xml; charset=utf-8').send(
      // One page is all there is to index: everything else is a scan result.
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      `  <url><loc>${originOf(req)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n` +
      '</urlset>\n'
    )
  );

  /* The icon browsers ask for by default, before they have seen the page. */
  app.get('/favicon.ico', { config: { rateLimit: false } }, async (req, reply) =>
    reply
      .type('image/x-icon')
      .header('cache-control', 'public, max-age=86400')
      .send(FAVICON)
  );

  /**
   * What a console client sees at the root: how to use the thing.
   *
   * The service's own usage lines are pulled out of the rest before it is
   * spread, because spreading a whole `extraUsage` over this object would put
   * its `usage` on top of the merged one below — replacing every default line
   * with the one or two a service wanted to add.
   */
  const { usage: extraUsageLines, ...extraUsageFields } = extraUsage;
  const USAGE = {
    service: slug,
    name,
    home: `https://${domain}/`,
    usage: {
      scan: `GET /<target>              — full report (JSON for console clients)`,
      api: 'GET /api/<target>          — always data',
      yaml: 'GET /api/<target>?output=yaml',
      stream: 'GET /api/stream/<target>   — server-sent events with live progress',
      refresh: 'add ?refresh=1 to bypass the cache',
      lang: 'add ?lang=ru for labels in another language (Accept-Language is honoured too)',
      ...(extraUsageLines || {}),
    },
    examples,
    languages: LANG_NAMES,
    stages,
    family: serviceIndex(),
    ...extraUsageFields,
  };

  /**
   * The root.
   *
   * For most of the family there is nothing to report until a visitor names a
   * target, so a console client gets the usage block. A service that already
   * knows what the caller is asking about — myip answers about the caller
   * itself — hands back a target from `homeTarget` and gets scanned instead.
   *
   * The page is unaffected either way: `/` stays canonical and indexable, and
   * it fetches its own data as it does everywhere else. Only what a terminal
   * sees changes, which is the whole point of the hook.
   *
   * `/api` follows the same rule, and for the same reason: a usage block exists
   * to tell a console user to name a target, which is not advice a service that
   * has already answered can sensibly give. `curl myip.sharapov.biz/api`
   * printing your address is the whole product.
   */
  app.get('/', { config: scanLimit }, async (req, reply) => {
    const format = wantedFormat(req);
    if (format === 'invalid') return badOutput(reply, pickLang(req));
    if (format === 'html') return sendHtml(reply, req);
    if (homeTarget) return serveScan(req, reply, homeTarget(req), format);
    return sendData(reply, format, USAGE);
  });

  app.get('/api', { config: scanLimit }, async (req, reply) => {
    const format = wantedFormat(req) === 'yaml' ? 'yaml' : 'json';
    if (homeTarget) return serveScan(req, reply, homeTarget(req), format);
    return sendData(reply, format, USAGE);
  });

  app.get('/api/:target', { config: scanLimit }, async (req, reply) => {
    const wanted = wantedFormat(req);
    if (wanted === 'invalid') return badOutput(reply, pickLang(req));
    return serveScan(req, reply, req.params.target, wanted === 'yaml' ? 'yaml' : 'json');
  });

  /**
   * The same scan, streamed. A full report takes seconds, and watching the
   * stages go by is much better than staring at a spinner.
   */
  app.get('/api/stream/:target', { config: scanLimit }, (req, reply) => {
    const lang = pickLang(req);
    const target = parse(req.params.target, req);
    if (target.error) {
      return sendData(reply, 'json',
        errorPayload({ code: target.error, status: 400 }, lang), { status: 400 });
    }
    if (inflight >= MAX_INFLIGHT) {
      return sendData(reply, 'json', errorPayload({ code: 'busy', status: 503 }, lang), { status: 503 });
    }

    reply.hijack();
    const raw = reply.raw;
    raw.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
      'content-security-policy': CSP,
      'x-content-type-options': 'nosniff',
    });

    let closed = false;
    const send = (event, data) => {
      if (closed || raw.writableEnded) return;
      raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    req.raw.on('close', () => { closed = true; });

    // A comment every 15 seconds keeps proxies from closing an idle stream.
    const keepAlive = setInterval(() => { if (!closed) raw.write(': ping\n\n'); }, 15000);

    inflight++;
    send('start', { target: cacheKey(target), stages });

    scanCached(target, { ...scanOptions(req), onProgress: event => send('progress', event) })
      .then(report => send('report', localize(report, lang)))
      .catch(err => send('failed', errorPayload(err, lang)))
      .finally(() => {
        inflight--;
        clearInterval(keepAlive);
        if (!closed && !raw.writableEnded) raw.end();
      });
  });

  const NOT_FOUND_HTML = `<!doctype html><meta charset="utf-8">
<title>404</title>
<style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
background:#14110c;color:#f6f1e6;display:grid;place-items:center;height:100vh;margin:0;text-align:center}
a{color:#9d9dfb}code{background:#1b1710;padding:2px 6px;border-radius:6px}</style>
<div><h1>404</h1><p>Expected the site root or a name in the path:<br>
<code>/example.com</code></p>
<p><a href="/">Go home</a></p></div>`;

  /** The pretty route: /example.com — a page for browsers, data for everyone else. */
  app.get('/:target', { config: scanLimit }, async (req, reply) => {
    const format = wantedFormat(req);
    if (format === 'invalid') return badOutput(reply, pickLang(req));
    if (format === 'html') {
      // The page fetches its own data, so an unknown target still renders and
      // shows the error itself — except for outright junk, which gets a 404.
      const target = parse(req.params.target, req);
      if (target.error === 'invalid-host') {
        return reply.code(404).type('text/html; charset=utf-8').send(NOT_FOUND_HTML);
      }
      return sendHtml(reply, req, { target: target.error ? undefined : target });
    }
    return serveScan(req, reply, req.params.target, format);
  });

  app.setNotFoundHandler({ config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, (req, reply) => {
    if (wantedFormat(req) === 'html') {
      return reply.code(404).type('text/html; charset=utf-8').send(NOT_FOUND_HTML);
    }
    return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Route not found.' });
  });

  /* ---------------------------------------------------------------- *
   * Startup
   * ---------------------------------------------------------------- */

  async function start() {
    for (const signal of ['SIGTERM', 'SIGINT']) {
      process.on(signal, async () => {
        app.log.info(`${signal} received, shutting down`);
        await app.close();
        process.exit(0);
      });
    }
    try {
      await app.listen({ port: PORT, host: HOST });
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
    return app;
  }

  return { app, start, i18n, cache, t, tCode, pickLang, CSP };
}
