/**
 * The kit's own behaviour, tested where it is easy to get wrong.
 *
 * Most of what is in here is exercised end to end by the smoke test of every
 * service that uses it. What is worth pinning down separately is the reasoning
 * that has no obvious failure mode: content negotiation, the policy builder,
 * the cache's request sharing, and the private-address guard.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createService } from '../lib/service.js';
import { wantedFormat, clean } from '../lib/format.js';
import { buildCsp, inlineScriptHashes, metrikaSnippet } from '../lib/security.js';
import { createCache } from '../lib/cache.js';
import { parseDomain, parseTarget, isPrivateAddress, portSet } from '../lib/target.js';
import { letterFor, worstGrade, weighted, sortFlags, incomplete } from '../lib/report.js';
import { renderServiceLinks, SERVICES } from '../lib/services.js';

const req = (headers = {}, query = {}) => ({ headers, query });

/* ------------------------------------------------------------------ *
 * Content negotiation
 * ------------------------------------------------------------------ */

test('a browser gets the page and curl gets data, without either asking', () => {
  assert.equal(wantedFormat(req({ 'user-agent': 'Mozilla/5.0', accept: 'text/html' })), 'html');
  assert.equal(wantedFormat(req({ 'user-agent': 'curl/8.7.1' })), 'json');
  assert.equal(wantedFormat(req({ 'user-agent': 'Wget/1.21' })), 'json');
  // No User-Agent at all is a script, not a browser.
  assert.equal(wantedFormat(req({})), 'json');
});

test('an explicit output parameter always wins', () => {
  const browser = { 'user-agent': 'Mozilla/5.0', accept: 'text/html' };
  assert.equal(wantedFormat(req(browser, { output: 'json' })), 'json');
  assert.equal(wantedFormat(req(browser, { output: 'yaml' })), 'yaml');
  assert.equal(wantedFormat(req({ 'user-agent': 'curl/8' }, { output: 'html' })), 'html');
  // An unknown format is refused rather than quietly defaulted.
  assert.equal(wantedFormat(req(browser, { output: 'xml' })), 'invalid');
});

test('an Accept header asking for JSON is honoured over the User-Agent', () => {
  assert.equal(wantedFormat(req({ 'user-agent': 'Mozilla/5.0', accept: 'application/json' })), 'json');
  // …but a browser sending */* alongside text/html still wants the page.
  assert.equal(wantedFormat(req({
    'user-agent': 'Mozilla/5.0', accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  })), 'html');
});

test('undefined is stripped so YAML does not emit empty keys', () => {
  assert.deepEqual(clean({ a: 1, b: undefined, c: { d: undefined, e: 2 }, f: [undefined] }),
    { a: 1, c: { e: 2 }, f: [undefined] });
});

/* ------------------------------------------------------------------ *
 * The content security policy
 * ------------------------------------------------------------------ */

test('an inline script is admitted by hash, never by unsafe-inline', () => {
  const html = '<html><script>console.log(1)</script></html>';
  const csp = buildCsp(html);
  assert.ok(/script-src[^;]*'sha256-/.test(csp), csp);
  assert.ok(!csp.includes('unsafe-inline'), csp);
});

test('a JSON-LD block is data and is not hashed', () => {
  const html = '<script type="application/ld+json">{"@type":"WebSite"}</script>';
  assert.deepEqual(inlineScriptHashes(html), []);
});

test('a script with a src needs no hash', () => {
  assert.deepEqual(inlineScriptHashes('<script src="/static/app.js"></script>'), []);
});

test('the hash changes when the script does, so it cannot silently drift', () => {
  const first = inlineScriptHashes('<script>a()</script>')[0];
  const second = inlineScriptHashes('<script>b()</script>')[0];
  assert.notEqual(first, second);
});

test('the policy closes everything that is not needed', () => {
  const csp = buildCsp('<html></html>');
  for (const directive of ["base-uri 'none'", "form-action 'none'", "frame-ancestors 'none'",
    "frame-src 'none'", 'upgrade-insecure-requests']) {
    assert.ok(csp.includes(directive), `${directive} missing from ${csp}`);
  }
});

test('analytics is off unless an id is configured, and then it is hashable', () => {
  assert.equal(metrikaSnippet(''), '');
  assert.equal(metrikaSnippet(undefined), '');
  const snippet = metrikaSnippet('12345678');
  assert.ok(snippet.includes('12345678'));
  // Whatever it contains, it must be a plain inline script so the hash covers it.
  assert.equal(inlineScriptHashes(snippet).length, 1);
});

test('a non-numeric analytics id is refused rather than interpolated', () => {
  assert.equal(metrikaSnippet('abc'), '');
});

/* ------------------------------------------------------------------ *
 * The cache
 * ------------------------------------------------------------------ */

test('two callers arriving together share one run', async () => {
  const cache = createCache();
  let runs = 0;
  const work = async () => {
    runs++;
    await new Promise(resolve => setTimeout(resolve, 20));
    return { value: runs, meta: {} };
  };

  const [first, second] = await Promise.all([
    cache.run('example.com', work),
    cache.run('example.com', work),
  ]);

  assert.equal(runs, 1);
  assert.equal(first.value, second.value);
});

test('a stored answer is served again and marked as cached', async () => {
  const cache = createCache();
  let runs = 0;
  const work = async () => ({ value: ++runs, meta: {} });

  await cache.run('example.com', work);
  const second = await cache.run('example.com', work);

  assert.equal(runs, 1);
  assert.equal(second.meta.cached, true);
});

test('refresh skips the stored copy', async () => {
  const cache = createCache();
  let runs = 0;
  const work = async () => ({ value: ++runs, meta: {} });

  await cache.run('example.com', work);
  await cache.run('example.com', work, { refresh: true });
  assert.equal(runs, 2);
});

test('an expired entry is not served', async () => {
  const cache = createCache({ ttlMs: 5 });
  let runs = 0;
  const work = async () => ({ value: ++runs, meta: {} });

  await cache.run('example.com', work);
  await new Promise(resolve => setTimeout(resolve, 15));
  await cache.run('example.com', work);
  assert.equal(runs, 2);
});

test('a failed run is not stored', async () => {
  const cache = createCache();
  await assert.rejects(cache.run('example.com', async () => { throw new Error('no'); }));
  const value = await cache.run('example.com', async () => ({ ok: true, meta: {} }));
  assert.equal(value.ok, true);
});

/* ------------------------------------------------------------------ *
 * Targets
 * ------------------------------------------------------------------ */

test('a domain is accepted and an address literal is not', () => {
  assert.equal(parseDomain('Example.COM').host, 'example.com');
  assert.equal(parseDomain('https://example.com/path?q=1').host, 'example.com');
  assert.equal(parseDomain('example.com.').host, 'example.com');
  assert.equal(parseDomain('93.184.216.34').error, 'domain-expected');
  assert.equal(parseDomain('not a host').error, 'invalid-host');
  assert.equal(parseDomain('').error, 'invalid-host');
});

test('names with underscores are accepted, because DNS is full of them', () => {
  assert.equal(parseDomain('_dmarc.example.com').host, '_dmarc.example.com');
  assert.equal(parseDomain('_25._tcp.mail.example.com').host, '_25._tcp.mail.example.com');
});

test('a port is parsed and checked against the allowed set', () => {
  const ports = portSet('NOT_SET', '443,8443');
  assert.equal(parseTarget('example.com:8443', { ports }).port, 8443);
  assert.equal(parseTarget('example.com:22', { ports }).error, 'port-not-allowed');
  assert.equal(parseTarget('example.com:70000', { ports }).error, 'invalid-port');
  assert.equal(parseTarget('[2001:db8::1]:8443', { ports }).host, '2001:db8::1');
});

test('every range that belongs to somebody else is refused', () => {
  for (const address of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1',
    '::1', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1']) {
    assert.equal(isPrivateAddress(address), true, address);
  }
  for (const address of ['93.184.216.34', '1.1.1.1', '2001:db8::1']) {
    assert.equal(isPrivateAddress(address), false, address);
  }
});

test('something that is not an address at all is treated as private', () => {
  // Fail closed: an unparsable value must never be treated as safe to probe.
  assert.equal(isPrivateAddress('not-an-address'), true);
  assert.equal(isPrivateAddress(''), true);
});

/* ------------------------------------------------------------------ *
 * Report primitives
 * ------------------------------------------------------------------ */

test('the letter scale runs the way the thresholds say', () => {
  assert.equal(letterFor(100), 'A');
  assert.equal(letterFor(90), 'A');
  assert.equal(letterFor(89), 'B');
  assert.equal(letterFor(0), 'F');
});

test('a cap only ever pulls a grade down', () => {
  assert.equal(worstGrade('A', 'C'), 'C');
  assert.equal(worstGrade('C', 'A'), 'C');
  assert.equal(worstGrade('A+', 'A'), 'A');
  // "?" is below every letter: it means there is nothing to stand on.
  assert.equal(worstGrade('F', '?'), '?');
});

test('a weighted score ignores components that have no number', () => {
  assert.equal(weighted([
    { score: 100, weight: 0.5 },
    { score: 0, weight: 0.5 },
  ]), 50);
  assert.equal(weighted([
    { score: 100, weight: 0.5 },
    { score: undefined, weight: 0.5 },
  ]), 100);
  assert.equal(weighted([]), 0);
});

test('findings are ordered worst first', () => {
  const sorted = sortFlags([
    { id: 'b', severity: 'low' }, { id: 'a', severity: 'critical' }, { id: 'c', severity: 'medium' },
  ]);
  assert.deepEqual(sorted.map(entry => entry.id), ['a', 'c', 'b']);
});

test('an empty incomplete list is undefined, so it never renders as an empty banner', () => {
  assert.equal(incomplete([]), undefined);
  assert.equal(incomplete([null, undefined, false]), undefined);
  assert.deepEqual(incomplete(['a', 'a', 'b']), ['a', 'b']);
});

/* ------------------------------------------------------------------ *
 * The family footer
 * ------------------------------------------------------------------ */

test('the footer links the siblings and marks the current service', () => {
  const html = renderServiceLinks('mydns', key => key.replace('svc_', ''));
  assert.ok(html.includes('href="https://myssl.sharapov.biz/"'));
  assert.ok(html.includes('<span class="svc current" aria-current="page">mydns</span>'));
  // The current service must not also be a link to itself.
  assert.ok(!html.includes('href="https://mydns.sharapov.biz/"'));
});

test('every service in the manifest has a translation key', () => {
  for (const service of SERVICES) {
    assert.match(service.key, /^svc_[a-z]+$/);
    assert.equal(service.key, `svc_${service.slug}`);
  }
});

test('a name from the dictionary is escaped before it reaches the markup', () => {
  const html = renderServiceLinks('mydns', () => '<script>alert(1)</script>');
  assert.ok(!html.includes('<script>'), html);
  assert.ok(html.includes('&lt;script&gt;'));
});

/* ------------------------------------------------------------------ *
 * The shell
 *
 * These build a real service against a fixture directory and inject
 * requests into it, so the routes are exercised without a socket.
 * ------------------------------------------------------------------ */

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixture');

/** A service with just enough wired up to answer. */
function fixtureService(overrides = {}) {
  return createService({
    slug: 'mydns',
    name: 'Fixture',
    domain: 'fixture.example',
    port: 0,
    root: FIXTURE,
    stages: ['one'],
    parse: raw => (raw === 'bad' ? { error: 'invalid-host' } : { host: String(raw) }),
    run: async target => ({ host: target.host, ok: true }),
    ...overrides,
  });
}

const asConsole = { method: 'GET', url: '/', headers: { 'user-agent': 'curl/8.7.1' } };

test('a service adds usage lines without replacing the ones it did not write', async () => {
  const service = await fixtureService({
    usage: {
      usage: { port: 'GET /api/<host>:8443' },
      allowedPorts: [443, 8443],
    },
  });
  const body = JSON.parse((await service.app.inject(asConsole)).body);

  // The line the service added is there...
  assert.equal(body.usage.port, 'GET /api/<host>:8443');
  // ...and so is every line it did not, which a plain spread would have eaten.
  assert.equal(typeof body.usage.scan, 'string');
  assert.equal(typeof body.usage.stream, 'string');
  assert.equal(typeof body.usage.lang, 'string');
  // Fields beside `usage` still land at the top level.
  assert.deepEqual(body.allowedPorts, [443, 8443]);

  await service.app.close();
});

test('without a home target the root tells a console client how to use the service', async () => {
  const service = await fixtureService();
  const body = JSON.parse((await service.app.inject(asConsole)).body);

  assert.equal(body.service, 'mydns');
  assert.ok(body.usage.scan);
  assert.equal(body.ok, undefined);

  await service.app.close();
});

test('a home target makes the root a report about the caller', async () => {
  const service = await fixtureService({ homeTarget: () => 'self.example' });
  const body = JSON.parse((await service.app.inject(asConsole)).body);

  // The scan ran, and the usage block did not take its place.
  assert.equal(body.host, 'self.example');
  assert.equal(body.ok, true);
  assert.equal(body.usage, undefined);

  // `/api` answers the same way. Telling a caller to name a target is not
  // useful advice from a service that has already answered about them.
  const api = JSON.parse((await service.app.inject({ ...asConsole, url: '/api' })).body);
  assert.equal(api.host, 'self.example');
  assert.equal(api.usage, undefined);

  await service.app.close();
});

test('a home target leaves the page alone: still canonical, still indexable', async () => {
  const service = await fixtureService({ homeTarget: () => 'self.example' });
  const page = await service.app.inject({
    method: 'GET', url: '/', headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
  });

  assert.match(page.body, /<meta name="robots" content="index, follow">/);
  // Canonical stays the root — the report is about the caller, not a page of
  // its own, and every caller would otherwise claim a different canonical URL.
  assert.match(page.body, /<link rel="canonical" href="[^"]*\/">/);
  assert.doesNotMatch(page.body, /self\.example/);

  await service.app.close();
});

test('the language reaches the scan and the cache key that stores it', async () => {
  const seen = [];
  const service = await fixtureService({
    run: async (target, options) => {
      seen.push(options.lang);
      return { host: target.host, lang: options.lang };
    },
    cacheSuffix: (query, lang) => lang,
  });

  const ask = lang => service.app.inject({
    method: 'GET', url: '/self', headers: { 'user-agent': 'curl/8.7.1', 'accept-language': lang },
  });

  assert.equal(JSON.parse((await ask('en')).body).lang, 'en');
  assert.equal(JSON.parse((await ask('ru')).body).lang, 'ru');
  // Two languages, two entries — not one cached report handed to both.
  assert.deepEqual(seen, ['en', 'ru']);
  // ...and asking again in a language already seen is served from the cache.
  assert.equal(JSON.parse((await ask('ru')).body).lang, 'ru');
  assert.deepEqual(seen, ['en', 'ru']);

  await service.app.close();
});

test('a report title falls back to the full title when there is no short one', async () => {
  const service = await fixtureService();
  const page = await service.app.inject({
    method: 'GET', url: '/host.example', headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
  });

  assert.match(page.body, /<title>host\.example — Fixture<\/title>/);
  assert.doesNotMatch(page.body, /undefined/);

  await service.app.close();
});

test('robots.txt lets a crawler fetch the scripts that draw the page', async () => {
  const service = await fixtureService();
  const robots = (await service.app.inject({ method: 'GET', url: '/robots.txt' })).body;

  assert.match(robots, /^Allow: \/static\/$/m);
  assert.match(robots, /^Disallow: \/$/m);
  assert.match(robots, /^Disallow: \/api$/m);
  assert.match(robots, /Sitemap: /);

  await service.app.close();
});

test('the raw template is not reachable through the static mount', async () => {
  const service = await fixtureService();

  // The rendered page has its placeholders filled in...
  const page = await service.app.inject({
    method: 'GET', url: '/', headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' },
  });
  assert.doesNotMatch(page.body, /%[A-Z_]+%/);

  // ...and the file it was rendered from is not served beside it.
  const raw = await service.app.inject({ method: 'GET', url: '/static/index.html' });
  assert.equal(raw.statusCode, 404);

  await service.app.close();
});

test('a report page tells crawlers to keep it out of the index', async () => {
  const service = await fixtureService();
  const browser = { 'user-agent': 'Mozilla/5.0', accept: 'text/html' };

  const home = await service.app.inject({ method: 'GET', url: '/', headers: browser });
  assert.equal(home.headers['x-robots-tag'], 'index, follow');

  const report = await service.app.inject({ method: 'GET', url: '/host.example', headers: browser });
  assert.equal(report.headers['x-robots-tag'], 'noindex, follow');
  assert.match(report.body, /<meta name="robots" content="noindex, follow">/);

  await service.app.close();
});

test('/api refuses an output format it does not know', async () => {
  for (const overrides of [{}, { homeTarget: () => 'self.example' }]) {
    const service = await fixtureService(overrides);
    const res = await service.app.inject({
      method: 'GET', url: '/api?output=xml', headers: { 'user-agent': 'curl/8.7.1' },
    });
    assert.equal(res.statusCode, 400);
    await service.app.close();
  }
});

test('a dictionary that layers over the shared one must load it on the page too', async () => {
  const { checkTranslations } = await import('../lib/check-i18n.js');
  const { writeFileSync, readFileSync, mkdtempSync, cpSync } = await import('node:fs');
  const os = await import('node:os');

  const root = mkdtempSync(path.join(os.tmpdir(), 'kit-i18n-'));
  cpSync(FIXTURE, root, { recursive: true });
  const page = path.join(root, 'public/index.html');
  const html = readFileSync(page, 'utf8');
  writeFileSync(path.join(root, 'public/app.js'), '');

  // The fixture dictionary calls mergeI18N; its page loads no scripts at all.
  const missing = checkTranslations({ root });
  assert.ok(missing.problems.some(p => p.includes('i18n-common.js')), missing.problems.join(' | '));

  // Loading it after the service dictionary is just as broken as not at all.
  writeFileSync(page, html.replace('</body>',
    '<script src="/static/i18n.js"></script><script src="/static/kit/i18n-common.js"></script></body>'));
  const wrongOrder = checkTranslations({ root });
  assert.ok(wrongOrder.problems.some(p => p.includes('before the service dictionary')),
    wrongOrder.problems.join(' | '));

  // In the right order there is nothing to say.
  writeFileSync(page, html.replace('</body>',
    '<script src="/static/kit/i18n-common.js"></script><script src="/static/i18n.js"></script></body>'));
  const ordered = checkTranslations({ root });
  assert.deepEqual(ordered.problems.filter(p => p.includes('i18n-common')), []);
});
