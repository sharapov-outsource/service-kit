/**
 * @sharapov/service-kit — the plumbing behind myip, myssl, mydns, mymx and
 * myheaders.
 *
 * Three copies of five hundred lines is two copies too many. Everything here
 * was extracted from a service that already worked, not designed up front, and
 * every export earns its place by having been duplicated at least twice.
 */

export { createService } from './lib/service.js';
export { createI18n, loadDictionaries, localizeReport, labelFlags, COMMON_FILE } from './lib/i18n.js';
export { createCache } from './lib/cache.js';
export { pace, paceInterval, resetPace } from './lib/pace.js';
export {
  parseDomain, parseTarget, normalizeHost, portSet,
  isPrivateAddress, allowPrivate, refusePrivate, targetError,
} from './lib/target.js';
export { SERVICES, renderServiceLinks, serviceIndex } from './lib/services.js';
export {
  wantedFormat, sendData, clean, escapeHtml, originOf, clientIp,
} from './lib/format.js';
export {
  buildCsp, inlineScriptHashes, securityHeaders, metrikaSnippet,
} from './lib/security.js';
export {
  flag, sortFlags, SEVERITY_ORDER, letterFor, worstGrade, weighted,
  withDeadline, timed, incomplete, daysUntil,
} from './lib/report.js';
export { checkTranslations, codesFrom } from './lib/check-i18n.js';
