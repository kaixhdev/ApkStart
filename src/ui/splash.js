'use strict';
/* ApkStart splash screen script: receives progress updates from main process and handles fade-out */

const api = window.apkstartSplash;
if (!api) { /* Silently exit if preload was not injected */ }

const $ = (id) => document.getElementById(id);

// Version number
api?.version?.().then((v) => { if ($('ver')) $('ver').textContent = v || ''; }).catch(() => {});

// First-run flag + whether runtime components are bundled
Promise.all([
  api?.isFirstRun?.().catch(() => false),
  api?.bundled?.().catch(() => false),
]).then(([first, bundled]) => {
  if (!first || !$('firstRun')) return;
  $('firstRun').hidden = false;
  // Bundled runtime (Full installer / Microsoft Store MSIX): do not mention downloading,
  // since the compressed system image is extracted locally without network access.
  if (bundled) {
    if ($('firstRunTitle')) $('firstRunTitle').textContent = 'First launch · Preparing locally (no internet required)';
    if ($('firstRunList')) {
      $('firstRunList').innerHTML = [
        '<li>Runtime components are bundled with the installer — nothing extra to download</li>',
        '<li>Extracting the system image to your user directory (~1 minute, one-time)</li>',
        '<li>Configuring hardware acceleration and input method</li>',
        '<li>Once complete, double-click any APK or desktop shortcut to launch instantly</li>',
      ].join('');
    }
  }
}).catch(() => {});

// Progress updates
api?.onProgress?.((p) => {
  if (!p) return;
  if (p.percent != null && $('progressBar')) {
    $('progressBar').style.width = Math.min(100, Math.max(0, p.percent)) + '%';
  }
  if (p.message && $('status')) {
    $('status').textContent = p.message;
  }
});

// Done -> fade out
api?.onDone?.(() => {
  const splash = $('splash');
  if (splash) {
    splash.classList.add('out');
    setTimeout(() => { api?.close?.(); }, 520);
  }
});
