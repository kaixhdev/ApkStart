'use strict';
/* App window title bar: Rotate / Minimize / Maximize / Close; all other settings are in the main ApkStart window */
const api = window.apkstart;
const $ = (id) => document.getElementById(id);

const btn = {
  rotate: $('btnRotate'),
  min: $('btnMin'),
  max: $('btnMax'),
  close: $('btnClose'),
};

btn.rotate.addEventListener('click', () => api.shell.rotate());
btn.min.addEventListener('click', () => api.shell.minimize());
btn.max.addEventListener('click', () => api.shell.maximize());
btn.close.addEventListener('click', () => api.shell.close());

// Suppress Chromium's default context menu on the title bar;
// right-click in the viewport is intercepted by the main process and mapped to Android Back.
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Ctrl+R to rotate, F11 to maximize (standard Windows shortcuts)
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); api.shell.rotate(); }
  else if (e.key === 'F11') { e.preventDefault(); api.shell.maximize(); }
  else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); api.shell.back(); }
  else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); api.shell.forward(); }
  else {
    // Forward remaining keys to the main-process keymap engine (keyboard -> touch)
    api.shell.keyEvent(e.key).catch(() => {});
  }
});

function applyState(s) {
  if (!s) return;
  $('appName').textContent = s.label || 'App';
  $('bootName').textContent = s.label || '';
  const icon = s.iconUrl || '';
  // Fallback brand icon when app icon fails to decode or is blocked by CSP,
  // so the boot animation never shows a broken/missing icon.
  const FALLBACK = 'assets/logo-128.png';
  const bootIcon = $('bootIcon');
  const appIcon = $('appIcon');
  if (bootIcon) {
    bootIcon.onerror = () => { if (bootIcon.src.indexOf('logo-128') < 0) bootIcon.src = FALLBACK; };
    bootIcon.src = icon || FALLBACK;
  }
  if (appIcon) {
    appIcon.onerror = () => { if (appIcon.src.indexOf('logo-128') < 0) appIcon.src = FALLBACK; };
    appIcon.src = icon || FALLBACK;
  }
  $('bootTip').textContent = s.tip || '';
  if (s.ready) {
    const boot = $('boot');
    if (boot) {
      boot.classList.add('out');
      setTimeout(() => { boot.style.display = 'none'; }, 420);
    }
    document.body.style.background = '#0b0c0e';
  }
}

api.shell.onState(applyState);
api.shell.state().then(applyState).catch(() => {});
