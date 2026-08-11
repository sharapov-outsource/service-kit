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
