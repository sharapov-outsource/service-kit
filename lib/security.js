/**
 * The response headers, and the policy that is the point of them.
 *
 * A service that grades other people's security headers has no business being
 * sloppy about its own, so the content security policy here is closed: no
 * `'unsafe-inline'`, ever. The page does carry inline script when analytics is
 * switched on, and rather than opening the policy for it, its sha256 is computed
 * from the finished markup at startup. Editing that script cannot silently
 * break the policy or widen it for anything else — the hash simply changes with
 * the file.
 *
 * `application/ld+json` blocks are excluded from the hashing: they are data, the
 * browser never executes them, and a policy source for them would be noise.
 */

import { createHash } from 'node:crypto';

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
const LD_JSON = /type=["']application\/ld\+json["']/i;

/** sha256 sources for every executable inline script in a page. */
export function inlineScriptHashes(html) {
  return [...String(html).matchAll(INLINE_SCRIPT)]
    .filter(match => !LD_JSON.test(match[0]))
    .map(match => `'sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}'`);
}

/**
 * Builds the policy for a page.
 *
 * @param {string} html      the finished markup, placeholders and all
 * @param {object} options
 * @param {string[]} options.scriptSrc  extra sources for script-src
 * @param {string[]} options.connectSrc extra sources for connect-src
 * @param {string[]} options.imgSrc     extra sources for img-src
 * @param {string[]} options.frameSrc   extra sources for frame-src
 */
export function buildCsp(html, { scriptSrc = [], connectSrc = [], imgSrc = [], frameSrc = [] } = {}) {
  const hashes = inlineScriptHashes(html);
  const directives = [
    "default-src 'self'",
    ['script-src', "'self'", ...hashes, ...scriptSrc].join(' '),
    "style-src 'self'",
    ['img-src', "'self'", 'data:', ...imgSrc].join(' '),
    "font-src 'self'",
    ['connect-src', "'self'", ...connectSrc].join(' '),
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];
  if (frameSrc.length) directives.splice(6, 0, ['frame-src', ...frameSrc].join(' '));
  else directives.splice(6, 0, "frame-src 'none'");
  return directives.join('; ');
}

/** The rest of the set, identical everywhere and worth keeping that way. */
export function securityHeaders() {
  const headers = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
  };
  if (process.env.HSTS === 'true') {
    headers['strict-transport-security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

/**
 * The Yandex.Metrika bootstrap, injected only when an id is configured.
 *
 * The socket is listed separately in the policy because a source carries its
 * scheme: `https://mc.yandex.com` does not authorise `wss://mc.yandex.com`,
 * which is what the session recorder opens.
 */
export const METRIKA_HTTP = ['https://mc.yandex.ru', 'https://mc.yandex.com'];
export const METRIKA_WS = ['wss://mc.yandex.ru', 'wss://mc.yandex.com'];

export function metrikaSnippet(id) {
  if (!id) return '';
  const counter = String(id).replace(/\D/g, '');
  if (!counter) return '';
  return `  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counter}', 'ym');

    ym(${counter}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  </script>
  <noscript><div><img src="https://mc.yandex.ru/watch/${counter}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <!-- /Yandex.Metrika counter -->`;
}
