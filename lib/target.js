/**
 * Turning whatever arrived in the path into something safe to connect to.
 *
 * Two jobs, and they are separate on purpose:
 *   · syntax — is this a host name at all, and is the port one we are willing
 *     to speak to;
 *   · reachability — does it resolve to an address that belongs to somebody
 *     else's network rather than to ours.
 *
 * The second one is the important one. A public scanner that can be pointed at
 * 10.0.0.0/8 is a port scanner for whatever network it happens to run in, and
 * 169.254.169.254 is a cloud metadata endpoint. Both are refused before a single
 * packet leaves the box.
 */

import net from 'node:net';

/** Tests scan a server they started themselves, so they turn the guard off. */
export const allowPrivate = () => process.env.ALLOW_PRIVATE_TARGETS === 'true';

/**
 * A syntactically valid host name. Underscores are allowed because DNS is full
 * of them — `_dmarc`, `_25._tcp`, `_mta-sts` — and this validator is used for
 * lookup names as well as for connection targets.
 */
const HOSTNAME = /^(?=.{1,253}$)([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z]{2,63}$/;

/**
 * Strips a pasted URL, a trailing path and a trailing dot down to a bare name.
 * Returns null when nothing usable is left.
 */
export function normalizeHost(raw) {
  if (typeof raw !== 'string') return null;
  let value = raw.trim().toLowerCase();
  if (!value) return null;

  // Pasting a URL into the box is a perfectly reasonable thing to do.
  if (/^[a-z][a-z0-9+.-]*:\/\//.test(value)) {
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  }
  value = value.replace(/\/.*$/, '').replace(/^\[|\]$/g, '').replace(/\.$/, '');
  return value || null;
}

/**
 * A domain to look up: no port, no address literal. This is what mydns and
 * mymx take — you cannot ask an IP address about its SPF record.
 *
 * @returns {{host: string, isIp?: false}|{error: string}}
 */
export function parseDomain(raw) {
  const value = normalizeHost(raw);
  if (!value) return { error: 'invalid-host' };
  if (net.isIP(value)) return { error: 'domain-expected' };
  if (value.length > 253 || !HOSTNAME.test(value)) return { error: 'invalid-host' };
  return { host: value, isIp: false };
}

/**
 * A host and a port to connect to.
 *
 * @param {string} raw          host, host:port, or a pasted URL
 * @param {object} options      { defaultPort, ports, allowIp }
 * @param {Set<number>} options.ports  ports this service will connect to
 */
export function parseTarget(raw, { defaultPort = 443, ports = null, allowIp = true } = {}) {
  if (typeof raw !== 'string') return { error: 'invalid-host' };
  let value = raw.trim().toLowerCase();
  if (!value) return { error: 'invalid-host' };

  if (/^[a-z][a-z0-9+.-]*:\/\//.test(value)) {
    try {
      const url = new URL(value);
      value = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    } catch {
      return { error: 'invalid-host' };
    }
  }
  value = value.replace(/\/.*$/, '');

  let host = value;
  let port = defaultPort;

  const bracketed = /^\[([^\]]+)\](?::(\d+))?$/.exec(value);
  if (bracketed) {
    host = bracketed[1];
    if (bracketed[2]) port = Number(bracketed[2]);
  } else {
    const parts = value.split(':');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      host = parts[0];
      port = Number(parts[1]);
    } else if (parts.length > 2) {
      host = value;                                   // bare IPv6 literal
    }
  }

  host = host.replace(/\.$/, '');
  if (host.length > 253) return { error: 'invalid-host' };

  const isIp = Boolean(net.isIP(host));
  if (isIp && !allowIp) return { error: 'domain-expected' };
  if (!isIp && !HOSTNAME.test(host)) return { error: 'invalid-host' };
  if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: 'invalid-port' };
  if (ports && !ports.has(port)) return { error: 'port-not-allowed' };

  return { host, port, isIp };
}

/** Reads a comma-separated port list from the environment, with a default. */
export function portSet(envName, fallback) {
  const raw = process.env[envName] || fallback;
  return new Set(String(raw).split(',').map(p => Number(p.trim())).filter(Boolean));
}

/** Addresses that must never be probed: they are somebody's internal network. */
export function isPrivateAddress(ip) {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    return lower === '::' || lower === '::1' ||
      lower.startsWith('fe80:') || /^f[cd][0-9a-f]{2}:/.test(lower) ||
      lower.startsWith('ff') ||
      // IPv4-mapped addresses inherit the IPv4 rules.
      (lower.startsWith('::ffff:') && isPrivateAddress(lower.slice(7)));
  }
  return true;
}

/** The error a probe throws when it is pointed somewhere it must not go. */
export function refusePrivate() {
  return Object.assign(new Error('private-address'), { code: 'private-address', status: 403 });
}

/** Turns a target error code into the shape the routes throw. */
export function targetError(code) {
  return Object.assign(new Error(code), { code, status: 400 });
}
