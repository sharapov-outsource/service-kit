/**
 * The family.
 *
 * Every service renders the same footer strip from this list, with its own entry
 * marked and not clickable. The names come from the shared dictionary, so the
 * links are translated in all twelve languages without any service knowing
 * anything about its siblings beyond what is written here.
 *
 * The list is static on purpose. Fetching it at runtime would make five
 * independent containers depend on each other being up, to render a footer.
 * The cost of that choice is stated plainly: a new service appears in the
 * others' footers only after they are rebuilt against a newer version of this
 * package. Redeploying four containers is cheaper than a runtime dependency.
 */

export const SERVICES = [
  { slug: 'myip', host: 'myip.sharapov.biz', key: 'svc_myip' },
  { slug: 'myssl', host: 'myssl.sharapov.biz', key: 'svc_myssl' },
  { slug: 'mydns', host: 'mydns.sharapov.biz', key: 'svc_mydns' },
  { slug: 'mymx', host: 'mymx.sharapov.biz', key: 'svc_mymx' },
  { slug: 'myheaders', host: 'myheaders.sharapov.biz', key: 'svc_myheaders' },
  { slug: 'myneighbors', host: 'myneighbors.sharapov.biz', key: 'svc_myneighbors' },
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * The footer strip, rendered on the server so it is in the markup a crawler
 * sees rather than assembled by a script after paint.
 *
 * @param {string} current  slug of the service doing the rendering
 * @param {(key: string) => string} translate
 */
export function renderServiceLinks(current, translate) {
  const items = SERVICES.map(service => {
    const name = escapeHtml(translate(service.key) || service.slug);
    if (service.slug === current) {
      return `<span class="svc current" aria-current="page">${name}</span>`;
    }
    return `<a class="svc" href="https://${service.host}/">${name}</a>`;
  });
  return `<nav class="services" aria-label="sharapov.biz tools">${items.join('')}</nav>`;
}

/** The same list as data, for `/healthz` and the console usage block. */
export function serviceIndex() {
  return SERVICES.map(({ slug, host }) => ({ slug, url: `https://${host}/` }));
}
