'use strict';
/**
 * i18n unit tests: dictionary integrity, language resolution, lookup, interpolation, and English fallback.
 */
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

const ROOT = path.join(__dirname, '..');
const i18n = require('../src/core/i18n');
const { run } = require('../tools/check-i18n');

console.log('\n[i18n · Language Resolution]');
test('Chinese system selects zh when set to auto', () => {
  assert(i18n.resolveLanguage('auto', ['zh-CN']) === 'zh', 'zh-CN should resolve to zh');
  assert(i18n.resolveLanguage('auto', ['zh-TW', 'en-US']) === 'zh', 'zh-TW should resolve to zh');
});
test('Non-Chinese system matches supported language, unknown falls back to en', () => {
  assert(i18n.resolveLanguage('auto', ['en-US']) === 'en', 'en-US should resolve to en');
  assert(i18n.resolveLanguage('auto', ['ru-RU']) === 'ru', 'ru-RU should resolve to ru');
  assert(i18n.resolveLanguage('auto', ['ja-JP']) === 'ja', 'ja-JP should resolve to ja');
  assert(i18n.resolveLanguage('auto', ['fr-FR']) === 'en', 'unsupported language should fall back to en');
  assert(i18n.resolveLanguage('auto', []) === 'en', 'empty list should fall back to en');
});
test('Explicit setting overrides system language', () => {
  assert(i18n.resolveLanguage('zh', ['en-US']) === 'zh', 'explicit zh');
  assert(i18n.resolveLanguage('en', ['zh-CN']) === 'en', 'explicit en');
  assert(i18n.resolveLanguage('ko', ['en-US']) === 'ko', 'explicit ko');
});
test('Language code normalization', () => {
  assert(i18n.normalizeLang('zh_CN') === 'zh', 'zh_CN');
  assert(i18n.normalizeLang('en-GB') === 'en', 'en-GB');
  assert(i18n.normalizeLang('ja-JP') === 'ja', 'ja-JP');
  assert(i18n.normalizeLang('pt_BR') === 'pt', 'pt_BR');
  assert(i18n.normalizeLang('xx-YY') === '', 'unsupported language');
});

console.log('\n[i18n · Lookup & Fallback]');
i18n.setLanguage('en');
test('English mode returns source text unchanged', () => {
  assert(i18n.t('Install APK') === 'Install APK', 'English mode should not translate');
  assert(i18n.t('Installed {n} apps', { n: 3 }) === 'Installed 3 apps', 'interpolation in English mode');
});

i18n.setLanguage('zh');
test('Exact lookup in zh', () => {
  assert(i18n.t('Install APK') === '安装 APK', 'Install APK');
  assert(i18n.t('Settings') === '设置', 'Settings');
});
test('Whitespace normalization hits multiline keys', () => {
  assert(i18n.t('  Install\n  APK  ') === '安装 APK', 'whitespace normalized');
});
test('Missing translation falls back to English', () => {
  assert(i18n.t('This string has no translation yet') === 'This string has no translation yet', 'fallback to English');
});
test('Technical strings remain untouched', () => {
  assert(i18n.t('adb devices') === 'adb devices', 'adb command must not change');
  assert(i18n.t('emulator-5554') === 'emulator-5554', 'device serial must not change');
  assert(i18n.t('/sdcard/ApkStartShared') === '/sdcard/ApkStartShared', 'path must not change');
});
test('Explicit placeholder interpolation', () => {
  assert(
    i18n.t('Close current app ({name})', { name: 'Douyin' }) === '关闭当前应用（Douyin）',
    'should replace {name}',
  );
});
test('Pattern matching on formatted strings', () => {
  assert(i18n.t('Clean 7 items') === '清理 7 项', 'numeric placeholder');
});

console.log('\n[i18n · Multilingual]');
for (const lang of ['zh', 'ru', 'vi', 'es', 'pt', 'ja', 'ko']) {
  test(`${lang} dictionary is available and translates core labels`, () => {
    assert(i18n.hasDictionary(lang), `${lang} should have a dictionary`);
    i18n.setLanguage(lang);
    assert(i18n.getLanguage() === lang, `language should switch to ${lang}`);
    const s = i18n.t('Settings');
    assert(s !== 'Settings', `${lang} should translate "Settings"`);
  });
}
test('Missing translation in non-English falls back to English', () => {
  i18n.setLanguage('es');
  assert(i18n.t('Untranslated English string') === 'Untranslated English string', 'falls back to English');
});
test('LANGUAGES list covers all supported languages', () => {
  const codes = i18n.LANGUAGES.map((l) => l.code);
  for (const c of ['auto', 'en', 'zh', 'ru', 'vi', 'es', 'pt', 'ja', 'ko']) {
    assert(codes.includes(c), `missing ${c}`);
  }
});
i18n.setLanguage('en');

console.log('\n[i18n · Dictionary Integrity]');
const report = run();
test('zh dictionary is populated', () => {
  assert(Object.keys(report.dicts.zh || {}).length > 900, `zh dict has ${Object.keys(report.dicts.zh || {}).length} entries`);
});
test('All dictionaries pass validation without errors', () => {
  assert(report.errors.length === 0, report.errors.slice(0, 5).join('; '));
});
test('zh.json is valid UTF-8 JSON without replacement characters', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/i18n/zh.json'), 'utf8');
  assert(raw.trim().startsWith('{'), 'should start with {');
  assert(!raw.includes('\uFFFD'), 'should not contain U+FFFD');
});

console.log(`\n[i18n] ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
