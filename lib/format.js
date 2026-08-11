/**
 * Content negotiation and the two data formats.
 *
 * The rule the whole family follows: a browser gets the page, everything else
 * gets data, and nobody has to pass a parameter to make that happen. `curl
 * mydns.sharapov.biz/example.com` prints JSON; the same URL in a browser opens
 * the report. An explicit `?output=` always wins.
 */

import YAML from 'yaml';

/** Console clients that should get data even though they sent no Accept header. */
const CONSOLE_UA = /^(curl|wget|httpie|python-requests|go-http-client|postmanruntime|okhttp|libwww-perl|node-fetch|got|axios|powershell|ruby)/i;

/** @returns {'html'|'json'|'yaml'|'invalid'} */
export function wantedFormat(req) {
  const raw = String(req.query?.output ?? req.query?.format ?? '').toLowerCase().trim();
  if (raw) {
    if (raw === 'json') return 'json';
    if (raw === 'yaml' || raw === 'yml') return 'yaml';
    if (raw === 'html') return 'html';
    return 'invalid';
  }

  const accept = String(req.headers.accept || '');
  if (accept.includes('yaml')) return 'yaml';
  if (/application\/(json|[\w.+-]+\+json)/.test(accept) && !accept.includes('text/html')) return 'json';

  const ua = String(req.headers['user-agent'] || '');
  if (!ua || CONSOLE_UA.test(ua)) return 'json';
  return 'html';
}

/** Strips undefined so YAML does not emit empty keys. */
export function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      out[key] = clean(item);
    }
    return out;
  }
  return value;
}

/** Values from the dictionary end up inside attributes, so they are escaped. */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function sendData(reply, format, payload, { filename, status = 200 } = {}) {
  const body = clean(payload);
  reply.code(status);
  if (format === 'yaml') {
    if (filename) reply.header('content-disposition', `attachment; filename="${filename}.yaml"`);
    return reply
      .type('application/yaml; charset=utf-8')
      .header('cache-control', 'no-store')
      .send(YAML.stringify(body, { lineWidth: 0 }));
  }
  if (filename) reply.header('content-disposition', `attachment; filename="${filename}.json"`);
  return reply
    .type('application/json; charset=utf-8')
    .header('cache-control', 'no-store')
    .send(JSON.stringify(body, null, 2));
}

/**
 * Where this instance answers from, for the absolute URLs crawlers and social
 * previews need. It comes from the request, so the same image works on any
 * domain the service is put behind — but the Host header is whatever the client
 * typed, so it is checked before being written into a page.
 */
export function originOf(req) {
  if (process.env.PUBLIC_ORIGIN) return process.env.PUBLIC_ORIGIN.replace(/\/+$/, '');
  const host = String(req.headers.host || '');
  if (!host || host.length > 253 || !/^[a-z0-9.\-:[\]]+$/i.test(host)) return '';
  return `${req.protocol}://${host}`;
}

/** The client address, honouring the proxy headers only when we trust them. */
export function clientIp(req, trustProxy) {
  if (trustProxy) {
    for (const header of ['cf-connecting-ip', 'x-real-ip']) {
      const value = req.headers[header];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}
