#!/usr/bin/env node
/**
 * `kit-check-i18n` — run from a service directory.
 *
 * Picks up `i18n.codes.js` next to package.json for the list of runtime codes
 * that service can emit, and checks the dictionaries against it. A service with
 * no such file still gets the structural checks.
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { checkTranslations } from '../lib/check-i18n.js';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

let codes = {};
try {
  const module = await import(pathToFileURL(path.join(root, 'i18n.codes.js')).href);
  const exported = module.default ?? module.CODES ?? {};
  codes = typeof exported === 'function' ? await exported(root) : exported;
} catch (err) {
  if (err.code !== 'ERR_MODULE_NOT_FOUND') throw err;
  console.warn('no i18n.codes.js — checking structure only');
}

const { problems, notes, languages, keys, translated } = checkTranslations({ root, codes });

if (problems.length) {
  console.error('Translation problems found:');
  problems.forEach(problem => console.error('  · ' + problem));
  process.exit(1);
}

notes.forEach(note => console.log('  note: ' + note));
console.log(`Translations are consistent: ${languages} languages x ${keys} keys ` +
  `(service vocabulary translated in ${translated}).`);
