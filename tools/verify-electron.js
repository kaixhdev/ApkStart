'use strict';
/**
 * Pre-packaging check: verify that the real Electron binary (electron.exe on Windows)
 * is installed and runnable before running UI tests or packaging.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const electronDir = path.join(root, 'node_modules', 'electron');
const pathTxt = path.join(electronDir, 'path.txt');

if (!fs.existsSync(electronDir)) {
  console.error('[verify-electron] Missing node_modules/electron. Run `npm ci` first.');
  process.exit(1);
}

let relExe = '';
if (fs.existsSync(pathTxt)) {
  relExe = fs.readFileSync(pathTxt, 'utf8').trim();
}
const exePath = relExe
  ? path.join(electronDir, 'dist', relExe)
  : path.join(electronDir, 'dist', process.platform === 'win32' ? 'electron.exe' : 'electron');

if (!fs.existsSync(exePath)) {
  console.error(`[verify-electron] Electron binary not found at: ${exePath}`);
  console.error('[verify-electron] Ensure ELECTRON_SKIP_BINARY_DOWNLOAD is not set, and run `node node_modules/electron/install.js`.');
  process.exit(1);
}

try {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const ver = execFileSync(exePath, ['--version'], {
    encoding: 'utf8',
    windowsHide: true,
    env,
  }).trim();
  console.log(`[verify-electron] OK: ${exePath} (${ver})`);
} catch (e) {
  console.error(`[verify-electron] Failed to execute Electron binary (${exePath}): ${e.message}`);
  process.exit(1);
}
