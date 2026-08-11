# @sharapov/service-kit

The plumbing behind [myip](https://myip.sharapov.biz),
[myssl](https://myssl.sharapov.biz), [mydns](https://mydns.sharapov.biz),
[mymx](https://mymx.sharapov.biz) and [myheaders](https://myheaders.sharapov.biz).

Three copies of five hundred lines is two copies too many. Everything here was
extracted from a service that already worked rather than designed up front, and
every export earns its place by having been duplicated at least twice.

```json
"@sharapov/service-kit": "git+https://github.com/sharapov-outsource/service-kit.git#v1.4.1"
```

npm resolves git dependencies natively; no registry is involved. The tag is
deliberate — a service moves to a new version when somebody decides to, not on
the next `npm i`.

Write the URL out rather than using the `github:` shorthand: the shorthand
resolves to `git+ssh://`, and a build machine has no SSH key. npm records that
form in `package-lock.json` regardless, so after every version change rewrite it
and check the result the way CI will see it:

```bash
sed -i '' 's|git+ssh://git@github.com/|git+https://github.com/|g' package-lock.json
GIT_SSH_COMMAND=/usr/bin/false npm ci   # fails here if any ssh URL is left
```

## What a service looks like after this

```js
import { createService, parseDomain, localizeReport } from '@sharapov/service-kit';

const service = await createService({
  slug: 'mydns',
  name: 'DNS Check',
  domain: 'mydns.sharapov.biz',
  port: 3026,
  root: ROOT,
  stages: ['resolve', 'delegation', 'soa', 'records', 'dnssec', 'caa', 'propagation', 'grade'],

  parse: raw => parseDomain(raw),
  run: (target, options) => scan(target, options),
  localize: (report, lang) => localizeReport(report, service.i18n, lang),
});

await service.start();
```

That is the whole HTTP layer. What the kit provides in return:

**Content negotiation.** `curl mydns.sharapov.biz/example.com` prints JSON;
the same URL in a browser opens the report. Console clients are recognised by
User-Agent and Accept, and `?output=json|yaml|html` always wins.

**A closed content security policy.** No `'unsafe-inline'`, ever. The page may
carry inline script — the analytics bootstrap, when one is configured — and its
sha256 is computed from the finished markup at startup, so editing that script
cannot silently widen the policy. `application/ld+json` blocks are excluded from
hashing: they are data, and the browser never executes them.

**Translations.** `public/i18n.js` is a plain browser script, evaluated here in
a `vm` sandbox rather than duplicated, so a translation can never be right in
the browser and missing in the API. The kit ships the shared half — buttons,
errors, severities, the names of the sibling tools — in all twelve languages, so
a service dictionary carries only its own vocabulary. A language a service has
not translated yet falls back to English; `kit-check-i18n` reports which, and
fails on a language that is only half done, because that is drift rather than a
decision.

**A cache that shares work.** Two people asking for the same target at the same
moment get one run, not two — otherwise a link doing the rounds turns into a
burst of identical probes aimed at somebody else's server.

**A paced outbound scheduler.** Probes reserve a slot before opening a socket,
in lanes, so a burst of DNS queries does not wait behind an SMTP connection and
neither of them looks like an attack to the target.

**Report primitives** that encode one rule: a stage that could not run records
`status: 'unknown'`, never a verdict; whatever could not be established goes in
`incomplete`; and when `incomplete` is non-empty the grade is `?`, not a letter.
That rule was bought at the price of one very wrong E that myssl once handed a
bank whose rate limiter refused forty connections in a row.

**The design system.** Tokens, type, subset woff2 fonts with `unicode-range`,
cards, tables, findings, the family footer — served from the package at
`/static/kit/`, so a service ships only what is its own.

**Templates** for the Dockerfile, the deploy workflow and `.dockerignore`.

## Layout

```
index.js            everything, re-exported
lib/service.js      createService — routes, negotiation, limits, SSE, the page
lib/i18n.js         dictionary loading and report labelling
lib/security.js     the policy builder and the header set
lib/format.js       negotiation, JSON and YAML, escaping
lib/cache.js        TTL cache with request sharing
lib/target.js       host parsing and the private-address guard
lib/pace.js         the outbound scheduler
lib/report.js       flags, grades, deadlines, the incompleteness rule
lib/services.js     the family manifest and footer
lib/check-i18n.js   the translation checker
public/             base.css, i18n-common.js, fonts, wordmark
templates/          Dockerfile, deploy.yml, dockerignore
scripts/make-icons  the icon generator; a service supplies only its glyph
```

## The family manifest

`lib/services.js` holds the list every footer is rendered from. It is static on
purpose: fetching it at runtime would make five independent containers depend on
each other being up, to draw a footer.

The cost of that choice is stated plainly — a new service appears in the others'
footers only after they are rebuilt against a newer version of this package.
Redeploying four containers is cheaper than a runtime dependency between them.

## Development

```bash
npm test        # syntax and unit tests
```

The kit has no smoke test of its own; it is exercised end to end by the smoke
test of every service that uses it.

## Licence

MIT. See [LICENSE](LICENSE).
