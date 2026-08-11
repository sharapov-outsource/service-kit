/**
 * The translation check, shared by every service.
 *
 * Three classes of mistake, and only the first is the one people expect:
 *
 *   1. a key present in English and missing elsewhere;
 *   2. a key the markup or the client asks for that no dictionary defines —
 *      the interface then renders the key name, which looks like a bug because
 *      it is one;
 *   3. a code the server can emit at runtime with no `flag_…` entry to match.
 *      This is the quiet one. Nothing fails, the API just starts answering with
 *      raw identifiers, and it surfaces months later in a screenshot.
 *
 * The third check needs to know what codes a service can produce, and only the
 * service knows that, so it passes them in through `i18n.codes.js`.
 */

import path from 'node:path';
import { readFileSync } from 'node:fs';

import { loadDictionaries } from './i18n.js';

/**
 * @param {object} options
 * @param {string} options.root   the service directory
 * @param {object} options.codes  { prefix: string[] } runtime codes to check
 * @returns {{problems: string[], languages: number, keys: number}}
 */
export function checkTranslations({ root, codes = {} }) {
  const problems = [];
  const notes = [];
  const loaded = loadDictionaries(path.join(root, 'public/i18n.js'));
  const { I18N, LANG_NAMES, LANG_LOCALES, RTL_LANGS, I18N_OWN, I18N_COMMON } = loaded;

  if (!I18N || !Object.keys(I18N).length) {
    return { problems: ['i18n.js did not define window.I18N'], languages: 0, keys: 0 };
  }
  if (!I18N.en) {
    return { problems: ['there is no English dictionary to compare against'], languages: 0, keys: 0 };
  }

  const reference = Object.keys(I18N.en);
  const placeholders = value =>
    [...String(value).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

  for (const [lang, dict] of Object.entries(I18N)) {
    for (const key of reference) {
      if (!(key in dict)) problems.push(`${lang}: missing key ${key}`);
      else if (typeof dict[key] !== 'string') problems.push(`${lang}.${key}: value is not a string`);
      else if (!dict[key].trim()) problems.push(`${lang}.${key}: empty string`);
      else if (placeholders(dict[key]) !== placeholders(I18N.en[key])) {
        problems.push(
          `${lang}.${key}: placeholders "${placeholders(dict[key])}" != "${placeholders(I18N.en[key])}"`);
      }
    }
    for (const key of Object.keys(dict)) {
      if (!reference.includes(key)) problems.push(`${lang}: unexpected key ${key}`);
    }
    if (!LANG_NAMES?.[lang]) problems.push(`${lang}: no entry in LANG_NAMES`);
    if (!LANG_LOCALES?.[lang]) problems.push(`${lang}: no entry in LANG_LOCALES`);
  }

  /* Coverage of the service's own vocabulary. A language that is simply not in
     the service dictionary reads in English and is reported; a language that is
     there but incomplete is a translation that drifted, and that fails. */
  const own = I18N_OWN || {};
  const ownKeys = Object.keys(own.en || {});
  const languages = Object.keys(I18N_COMMON || I18N);
  const untranslated = [];

  for (const lang of languages) {
    if (lang === 'en') continue;
    const dict = own[lang];
    if (!dict) {
      untranslated.push(lang);
      continue;
    }
    const missing = ownKeys.filter(key => !(key in dict));
    if (missing.length) {
      problems.push(
        `${lang}: partially translated — ${missing.length} of ${ownKeys.length} service keys missing ` +
        `(${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}). ` +
        'Either finish it or remove the language block so it falls back to English.');
    }
  }
  if (untranslated.length) {
    notes.push(`service vocabulary not yet translated into: ${untranslated.join(', ')} ` +
      `(${ownKeys.length} keys each; the shared strings are translated, these fall back to English)`);
  }

  for (const lang of RTL_LANGS || []) {
    if (!I18N[lang]) problems.push(`RTL_LANGS points at a missing language: ${lang}`);
  }

  const html = readFileSync(path.join(root, 'public/index.html'), 'utf8');
  const dictionarySource = readFileSync(path.join(root, 'public/i18n.js'), 'utf8');

  /* A dictionary that layers over the shared one needs the shared one loaded
     first — in the browser as well as here.

     This check exists because the server does not need the reminder: it runs
     both files in one sandbox, so everything above passes while the page pulls
     in only its own half, leaves mergeI18N undefined and never assigns
     window.I18N. That is not a missing translation, it is a blank page, and it
     survived a smoke test that reads markup and runs no script. */
  if (/\bmergeI18N\s*\(/.test(dictionarySource)) {
    const common = /<script[^>]+src="\/static\/kit\/i18n-common\.js"/.exec(html);
    const own = /<script[^>]+src="\/static\/i18n\.js"/.exec(html);
    if (!common) {
      problems.push(
        'public/i18n.js layers over the shared dictionary with mergeI18N, but index.html never ' +
        'loads /static/kit/i18n-common.js — in a browser mergeI18N is undefined and the page dies.');
    } else if (own && common.index > own.index) {
      problems.push(
        'index.html loads /static/kit/i18n-common.js after /static/i18n.js — mergeI18N has to exist ' +
        'before the service dictionary runs.');
    }
  }

  /* Keys the markup expects to exist. */
  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
    if (!reference.includes(match[1])) {
      problems.push(`index.html references a missing key: ${match[1]}`);
    }
  }

  /* Keys the client asks for by name: t('key') and t("key"). */
  const app = readFileSync(path.join(root, 'public/app.js'), 'utf8');
  for (const match of app.matchAll(/\bt\(\s*'([a-z0-9_]+)'/gi)) {
    if (!reference.includes(match[1])) {
      problems.push(`app.js references a missing key: ${match[1]}`);
    }
  }

  /* Codes built at runtime from a prefix, as tCode('flag', id) does. */
  for (const [prefix, list] of Object.entries(codes)) {
    if (!list.length) {
      problems.push(`no codes found for the "${prefix}" prefix — has a source file moved?`);
    }
    for (const code of new Set(list)) {
      const key = `${prefix}_${String(code).replace(/[-.]/g, '_')}`;
      if (!reference.includes(key)) {
        problems.push(`missing translation for a runtime code: ${key}`);
      }
    }
  }

  return {
    problems,
    notes,
    languages: Object.keys(I18N).length,
    keys: reference.length,
    translated: languages.length - untranslated.length,
  };
}

/**
 * Pulls the codes a module can emit straight out of its source.
 *
 * Reading the source rather than importing it keeps the check honest about
 * modules that only produce a code down some rare branch — and means a new
 * finding cannot be added without a translation.
 */
export function codesFrom(file, pattern) {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(pattern)].map(match => match[1]);
}
