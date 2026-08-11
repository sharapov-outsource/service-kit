/**
 * Translations, loaded once and shared by the page and the API.
 *
 * The report a scanner produces is all machine codes — `lame-delegation`,
 * `spf-too-many-lookups`, `csp-unsafe-inline`. That is right for a data format
 * and unreadable in a terminal, so the JSON and YAML output carries a readable
 * label beside every code.
 *
 * Those labels come from the very same dictionary the page uses. `public/i18n.js`
 * is a plain browser script; here it is evaluated in a `vm` sandbox rather than
 * duplicated, so a translation can never be right in the browser and missing in
 * the API. The kit's own shared strings — buttons, errors, the names of the
 * sibling services — are loaded into the same sandbox first, which is what lets
 * a service dictionary carry only the words that are actually its own.
 */

import path from 'node:path';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KIT_PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

/** The shared dictionary, as a browser script. Services serve this file too. */
export const COMMON_FILE = path.join(KIT_PUBLIC, 'i18n-common.js');

/**
 * Runs the shared dictionary and then a service dictionary in one sandbox and
 * returns what they left on `window`.
 *
 * @param {string} serviceFile absolute path to the service's public/i18n.js
 */
export function loadDictionaries(serviceFile) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of [COMMON_FILE, serviceFile]) {
    vm.runInContext(readFileSync(file, 'utf8'), sandbox, {
      timeout: 5000,
      filename: path.basename(file),
    });
  }
  return sandbox.window;
}

/**
 * @param {string} serviceFile absolute path to the service's public/i18n.js
 */
export function createI18n(serviceFile) {
  const loaded = loadDictionaries(serviceFile);

  const I18N = loaded.I18N || { en: {} };
  const LANG_NAMES = loaded.LANG_NAMES || {};
  const LANG_LOCALES = loaded.LANG_LOCALES || {};
  const RTL_LANGS = loaded.RTL_LANGS || [];
  const SUPPORTED_LANGS = Object.keys(I18N);
  const DEFAULT_LANG = I18N.en ? 'en' : SUPPORTED_LANGS[0];

  /** Interface strings may carry markup; API labels must not. */
  const plain = value => String(value).replace(/<[^>]+>/g, '');

  function t(lang, key, vars) {
    const dict = I18N[lang] || I18N[DEFAULT_LANG];
    let value = dict?.[key] ?? I18N[DEFAULT_LANG]?.[key];
    if (value === undefined) return undefined;
    if (vars) {
      for (const [name, replacement] of Object.entries(vars)) {
        value = String(value).split('{' + name + '}').join(replacement);
      }
    }
    return plain(value);
  }

  /** Label for a dashed code, as `tCode(lang, 'flag', 'lame-delegation')`. */
  function tCode(lang, prefix, code) {
    if (code === undefined || code === null || code === '') return undefined;
    return t(lang, `${prefix}_${String(code).replace(/[-.]/g, '_')}`) ||
      String(code).replace(/-/g, ' ');
  }

  /**
   * The language to answer in: an explicit `?lang=`, otherwise the best match
   * from Accept-Language, otherwise English.
   */
  function pickLang(req) {
    const wanted = String(req?.query?.lang || '').toLowerCase().trim();
    if (SUPPORTED_LANGS.includes(wanted)) return wanted;

    const header = String(req?.headers?.['accept-language'] || '');
    for (const part of header.split(',')) {
      const tag = part.split(';')[0].trim().toLowerCase();
      if (!tag) continue;
      if (SUPPORTED_LANGS.includes(tag)) return tag;
      const base = tag.split('-')[0];
      if (SUPPORTED_LANGS.includes(base)) return base;
    }
    return DEFAULT_LANG;
  }

  const isRtl = lang => RTL_LANGS.includes(lang);

  return {
    I18N, LANG_NAMES, LANG_LOCALES, RTL_LANGS, SUPPORTED_LANGS, DEFAULT_LANG,
    t, tCode, pickLang, isRtl,
  };
}

/**
 * Adds readable labels to the `flags` array every service produces.
 *
 * The shape is deliberately the same in all of them: a flag is `{ id, severity,
 * status }` and nothing else, so one function can label them all. The codes are
 * never replaced or removed — a script reading `.flags[].id` keeps working, and
 * a human reading the same output gets `name` and `description` for free.
 */
export function labelFlags(flags, { tCode }, lang) {
  if (!Array.isArray(flags)) return flags;
  return flags.map(flag => ({
    ...flag,
    name: tCode(lang, 'flag', flag.id),
    description: tCode(lang, 'fd', flag.id),
    severityLabel: tCode(lang, 'sev', flag.severity),
    statusLabel: tCode(lang, 'st', flag.status),
  }));
}

/**
 * The common half of localising a report: flags, the grade block and the meta
 * language stamp. A service passes its own function for everything else.
 */
export function localizeReport(report, i18n, lang, extend) {
  if (!report || typeof report !== 'object') return report;
  const out = structuredClone(report);

  if (Array.isArray(out.flags)) out.flags = labelFlags(out.flags, i18n, lang);

  if (out.grade) {
    if (Array.isArray(out.grade.caps)) {
      out.grade.caps = out.grade.caps.map(cap => ({
        ...cap,
        label: i18n.tCode(lang, 'cap', cap.reason),
      }));
    }
    if (Array.isArray(out.grade.warnings)) {
      /* A warning is usually one of the findings the report already listed, so
         it borrows that finding's words rather than needing a second set. A
         service with warnings of its own defines `warn_…` keys and those win. */
      out.grade.warningLabels = out.grade.warnings.map(code =>
        i18n.t(lang, `warn_${String(code).replace(/[-.]/g, '_')}`) ||
        i18n.tCode(lang, 'flag', code));
    }
    if (out.grade.reason) out.grade.reasonLabel = i18n.tCode(lang, 'cap', out.grade.reason);
    for (const component of Object.values(out.grade.components || {})) {
      if (component && typeof component === 'object' && component.key) {
        component.label = i18n.tCode(lang, 'comp', component.key);
      }
    }
  }

  if (typeof extend === 'function') extend(out, lang);

  out.meta = { ...out.meta, language: lang };
  return out;
}
