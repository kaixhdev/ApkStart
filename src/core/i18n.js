'use strict';
/**
 * UI localization (i18n) — zero Electron dependencies; usable in both main and preload.
 *
 * Design:
 * - English is the native source and default language throughout the codebase.
 * - Dictionaries in `src/i18n/<lang>.json` use English source strings as keys and
 *   translate only at the display boundary. Logic checks, regexes, adb/emulator
 *   commands, package names, paths, config keys, and IPC channels never pass through
 *   i18n, so localization never alters program behavior.
 * - Missing translations fall back to English (never Chinese).
 * - Interpolated strings (e.g. "Installed {n} apps") support both exact lookup
 *   and pattern matching so dynamically formatted strings also translate.
 *
 * Supported languages: en (English), zh (简体中文), ru (Русский), vi (Tiếng Việt),
 *   es (Español), pt (Português), ja (日本語), ko (한국어).
 *
 * Priority: APKSTART_LANG / --lang= override > settings.uiLanguage
 *   > system preferred languages (fallback to 'en').
 */
function loadDict(name) {
  try { return require('../i18n/' + name + '.json'); } catch (_) { return {}; }
}

const DICTS = {
  en: {}, // English is the source language
  zh: loadDict('zh'),
  ru: loadDict('ru'),
  vi: loadDict('vi'),
  es: loadDict('es'),
  pt: loadDict('pt'),
  ja: loadDict('ja'),
  ko: loadDict('ko'),
};

/** Supported languages list for the Settings dropdown and first-run language picker. */
const LANGUAGES = [
  { code: 'auto', label: 'Follow system' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '简体中文' },
  { code: 'ru', label: 'Русский' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

const LETTER_RE = /[A-Za-z]/;

let lang = 'en';
let dict = {};
let patterns = null;
let literalKeys = null;
const patternCache = new Map();

function normalizeLang(loc) {
  const s = String(loc || '').trim().toLowerCase().replace('_', '-');
  if (!s) return '';
  if (s === 'en' || s.startsWith('en-')) return 'en';
  if (s === 'zh' || s.startsWith('zh-')) return 'zh';
  if (s === 'ru' || s.startsWith('ru-')) return 'ru';
  if (s === 'vi' || s.startsWith('vi-')) return 'vi';
  if (s === 'es' || s.startsWith('es-')) return 'es';
  if (s === 'pt' || s.startsWith('pt-')) return 'pt';
  if (s === 'ja' || s.startsWith('ja-')) return 'ja';
  if (s === 'ko' || s.startsWith('ko-')) return 'ko';
  return '';
}

/** Pick the first supported language from systemLanguages; default to English. */
function pickSystemLang(list) {
  const arr = Array.isArray(list) ? list : [list];
  for (const item of arr) {
    const n = normalizeLang(item);
    if (n) return n;
  }
  return 'en';
}

/**
 * @param {string} setting 'auto' | 'en' | 'zh' | 'ru' | ...
 * @param {string[]|string} systemLanguages Result of Electron getPreferredSystemLanguages()
 */
function resolveLanguage(setting, systemLanguages) {
  const forced = normalizeLang(process.env.APKSTART_LANG);
  if (forced) return forced;
  const arg = (process.argv || []).find((a) => String(a).startsWith('--lang='));
  if (arg) {
    const n = normalizeLang(arg.slice('--lang='.length));
    if (n) return n;
  }
  const explicit = normalizeLang(setting);
  if (explicit) return explicit;
  return pickSystemLang(systemLanguages || []);
}

function setLanguage(next) {
  const n = normalizeLang(next);
  lang = n || 'en';
  dict = DICTS[lang] || {};
  patterns = null;
  literalKeys = null;
  patternCache.clear();
}

function getLanguage() { return lang; }

/** Shallow copy of the active dictionary, exposed to renderer via contextBridge. */
function dictionary() { return { ...dict }; }

/** Whether a dictionary is available for the given language code (en is always available). */
function hasDictionary(code) {
  const n = normalizeLang(code);
  if (n === 'en') return true;
  return !!(DICTS[n] && Object.keys(DICTS[n]).length);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^$()|[\]\\]/g, '\\$&');
}

function polish(text) {
  return String(text).trim();
}

/** Normalize whitespace before lookup so multiline HTML/template strings match cleanly. */
function normalizeKey(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

/**
 * Build regex patterns for dictionary keys containing `{name}` placeholders.
 * Keys with no English letters outside placeholders are skipped to avoid
 * matching arbitrary strings.
 */
function buildPatterns() {
  if (patterns) return patterns;
  patterns = [];
  for (const key of Object.keys(dict)) {
    const norm = normalizeKey(key);
    if (!/\{[^{}]+\}/.test(norm)) continue;
    if (!LETTER_RE.test(norm.replace(/\{[^{}]+\}/g, ''))) continue;
    const parts = [];
    const names = [];
    let last = 0;
    const tok = /\{[^{}]+\}/g;
    let m;
    while ((m = tok.exec(norm))) {
      parts.push(escapeRe(norm.slice(last, m.index)));
      names.push(m[0]);
      last = m.index + m[0].length;
    }
    parts.push(escapeRe(norm.slice(last)));
    let src = '';
    for (let i = 0; i < names.length; i++) src += parts[i] + '([\\s\\S]*?)';
    src += parts[names.length];
    let re;
    try { re = new RegExp('^' + src + '$'); } catch (_) { continue; }
    patterns.push({ re, text: dict[key], names });
  }
  return patterns;
}

function matchPattern(raw, depth) {
  for (const p of buildPatterns()) {
    const m = p.re.exec(raw);
    if (!m) continue;
    return p.text.replace(/\{[^{}]+\}/g, (token) => {
      const idx = p.names.indexOf(token);
      if (idx < 0) return token;
      const value = m[idx + 1];
      const translated = depth < 3 ? lookup(value, depth + 1) : undefined;
      return translated === undefined ? value : translated;
    });
  }
  return undefined;
}

/**
 * Look up a translation. Returns undefined if not found (or if active language is 'en').
 */
function lookup(text, depth = 0) {
  if (lang === 'en' || !dict || !Object.keys(dict).length) return undefined;
  const raw = String(text == null ? '' : text);
  if (!raw) return undefined;
  if (Object.prototype.hasOwnProperty.call(dict, raw)) return dict[raw];
  const norm = normalizeKey(raw);
  if (norm !== raw && Object.prototype.hasOwnProperty.call(dict, norm)) return dict[norm];
  if (patternCache.has(norm)) return patternCache.get(norm) || undefined;
  let hit = matchPattern(norm, depth);
  if (hit !== undefined) hit = polish(hit);
  patternCache.set(norm, hit || '');
  return hit;
}

/**
 * Translate a UI string with optional placeholder interpolation:
 * e.g. t('Installed {n} apps', { n: 3 }).
 * Falls back to the English source string if no translation is found.
 */
function t(text, vars) {
  const raw = String(text == null ? '' : text);
  if (!raw) return raw;
  let out = (lang !== 'en' && dict && Object.keys(dict).length) ? lookup(raw) : undefined;
  if (out === undefined) out = raw;
  if (vars && typeof vars === 'object') {
    out = out.replace(/\{([^{}]+)\}/g, (m, k) => {
      const key = String(k).trim();
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m;
    });
  }
  return out;
}

module.exports = {
  LANGUAGES,
  normalizeLang,
  pickSystemLang,
  resolveLanguage,
  setLanguage,
  getLanguage,
  dictionary,
  hasDictionary,
  normalizeKey,
  lookup,
  t,
  // For tests: clear cached pattern regexes
  _reset() { patterns = null; literalKeys = null; patternCache.clear(); },
};
