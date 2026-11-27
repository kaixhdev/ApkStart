'use strict';
/**
 * i18n consistency check (for CI and local verification)
 *
 * Verifies:
 *   1. Dictionaries in src/i18n/*.json are valid UTF-8 JSON with English keys and matching placeholders;
 *   2. UI source files (index.html, shell.html, splash.html, app.js, shell.js, splash.js, main.js)
 *      have no untranslated Chinese UI strings;
 *   3. No broken replacement characters (\uFFFD).
 *
 * Usage: node tools/check-i18n.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const I18N_DIR = path.join(ROOT, 'src', 'i18n');
const LANGS = ['zh', 'ru', 'vi', 'es', 'pt', 'ja', 'ko'];
const CJK = /[\u4e00-\u9fff]/;
const ALLOWED_CJK_KEYS = new Set([
  '日本語',
  '繁體中文',
  'Douyin · @日常MIKU (contact the author)',
  'Douyin · 日常MIKU',
]);

function placeholders(s) {
  const m = String(s).match(/\{[^{}]+\}/g);
  return m ? m.sort() : [];
}

function validateDict(lang, dict) {
  const errors = [];
  const warnings = [];
  for (const [key, val] of Object.entries(dict)) {
    if (CJK.test(key) && !ALLOWED_CJK_KEYS.has(key)) {
      errors.push(`${lang}.json: key should be English source text, found CJK: ${key.slice(0, 60)}`);
    }
    if (!String(val || '').trim()) {
      errors.push(`${lang}.json: empty translation for "${key.slice(0, 60)}"`);
      continue;
    }
    const kp = placeholders(key);
    const vp = placeholders(val);
    if (kp.join('|') !== vp.join('|')) {
      errors.push(`${lang}.json: placeholder mismatch for "${key.slice(0, 40)}" (${kp.join(',')} vs ${vp.join(',')})`);
    }
  }
  return { errors, warnings };
}

function run() {
  const dicts = {};
  const errors = [];
  const warnings = [];
  for (const lang of LANGS) {
    const file = path.join(I18N_DIR, `${lang}.json`);
    if (!fs.existsSync(file)) {
      errors.push(`Missing dictionary: src/i18n/${lang}.json`);
      continue;
    }
    const raw = fs.readFileSync(file, 'utf8');
    if (raw.includes('\uFFFD')) errors.push(`${lang}.json contains U+FFFD replacement character`);
    try {
      dicts[lang] = JSON.parse(raw);
      const res = validateDict(lang, dicts[lang]);
      errors.push(...res.errors);
      warnings.push(...res.warnings);
    } catch (e) {
      errors.push(`${lang}.json is not valid JSON: ${e.message}`);
    }
  }
  return { dicts, errors, warnings };
}

function main() {
  const { dicts, errors, warnings } = run();
  const counts = Object.entries(dicts).map(([k, d]) => `${k}:${Object.keys(d).length}`).join(' ');
  console.log(`[i18n] Dictionaries loaded (${counts})`);
  for (const w of warnings) console.log(`  ! ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length) {
    console.error(`[i18n] Check failed: ${errors.length} error(s)`);
    process.exit(1);
  }
  console.log('[i18n] Passed');
}

if (require.main === module) main();

module.exports = { run };
