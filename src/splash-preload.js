'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const appI18n = require('./core/i18n');

try {
  const boot = ipcRenderer.sendSync('i18n:bootstrap');
  appI18n.setLanguage((boot && boot.lang) || 'en');
} catch (_) { /* Fallback to English */ }
const langListeners = new Set();
ipcRenderer.on('i18n:lang', (_e, next) => {
  appI18n.setLanguage(next);
  for (const cb of [...langListeners]) {
    try { cb(next); } catch (_) { /* ignore */ }
  }
});

contextBridge.exposeInMainWorld('apkstartSplash', {
  i18n: {
    getLanguage: () => appI18n.getLanguage(),
    t: (text, vars) => appI18n.t(text, vars),
    lookup: (text) => appI18n.lookup(text),
    onLanguageChange: (cb) => {
      if (typeof cb === 'function') langListeners.add(cb);
    },
  },
  version: () => ipcRenderer.invoke('splash:version'),
  isFirstRun: () => ipcRenderer.invoke('splash:isFirstRun'),
  // Whether runtime components are bundled (Full / Microsoft Store MSIX) or require downloading (Portable).
  // The splash screen switches wording accordingly so users don't think it's re-downloading bundled files.
  bundled: () => ipcRenderer.invoke('splash:bundled'),
  onProgress: (cb) => { ipcRenderer.on('splash:progress', (_e, p) => cb(p)); },
  onDone: (cb) => { ipcRenderer.on('splash:done', () => cb()); },
  close: () => ipcRenderer.send('splash:close'),
});
