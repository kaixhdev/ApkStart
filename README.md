# ApkStart

<p align="center"><img src="docs/images/logo.png" alt="ApkStart Logo" width="160" /></p>

[![CI](https://github.com/RoutineMiku/apkstart/actions/workflows/ci.yml/badge.svg)](https://github.com/RoutineMiku/apkstart/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/RoutineMiku/apkstart?include_prereleases&sort=semver)](https://github.com/RoutineMiku/apkstart/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-0078D6.svg)](#)

**An Android app runner for Windows — install and run Android apps just like native Windows software.**

> Note: ApkStart is an early-stage, free, open-source, ad-free project maintained in the author's spare time.

- 🖱️ **Double-click `.apk` to install**: Register the `.apk` file association, then double-click any APK in File Explorer to automatically parse, install, and create a desktop shortcut—no emulator UI required.
- 🧩 **One desktop icon per app**: Icons are extracted offline from the APK and converted to multi-size `.ico` files. Double-clicking the shortcut launches the app directly, just like a native Windows app.
- 🪟 **Every app is a window**: Runs in windowed mode with native 60fps rendering and mouse/keyboard input; fullscreen scales to fill screen height while preserving aspect ratio, and windowed mode resizes freely with per-app bounds memory.
- 🔍 **Searchable in Windows**: Creates both Desktop and Start Menu (`Programs\ApkStart\`) shortcuts so Windows Search finds apps by name and the taskbar groups by app.
- 📁 **File Sharing**: Bidirectional sync between `%USERPROFILE%\ApkStartShared` and `/sdcard/ApkStartShared` inside Android.
- 🪶 **Lightweight & self-contained**: Zero third-party runtime dependencies in the Electron shell (ZIP / PNG / ICO / AXML / ARSC parsers are all hand-written), with on-demand runtime startup and idle resource reclamation.

![Main Window](docs/images/app.png)

```
┌────────────────────────────────────────────────────────────┐
│  Desktop Shortcut (.lnk with real app icon)                │
│      │  double-click                                       │
│      ▼                                                     │
│  ApkStart.exe --launch <package>                           │
│      │  Runtime not running? → Auto-start (Android 14)     │
│      ▼                                                     │
│  Launch via system-resolved LAUNCHER entry                 │
│      │  Watch 18s; auto-retry / reset / grant permissions  │
│      ▼                                                     │
│  Emulator Window = App Window (title, icon, aspect ratio)  │
└────────────────────────────────────────────────────────────┘
```

## System Requirements

- **OS**: Windows 10 (version 2004 / build 19041 or later) or Windows 11 — **x64** architecture (`win32-x64`)
- **CPU**: x86_64 processor with hardware virtualization (Intel VT-x or AMD SVM) recommended; falls back to software emulation if unavailable
- **RAM**: 4 GB minimum (8 GB+ recommended)
- **Disk Space**: ~3–5 GB free for the Android 14 system image, data partition, and Quick Boot snapshots

## Download & Installation

Releases are published automatically via GitHub Actions with `SHA256SUMS.txt` checksums:

- GitHub Releases: [github.com/RoutineMiku/apkstart/releases](https://github.com/RoutineMiku/apkstart/releases)

Available packages:

| Edition | Filename | When to Choose |
|---|---|---|
| Microsoft Store | `ApkStart_<4-part-version>_x64.msix` | Install from Microsoft Store. Full runtime bundled; updates via Store |
| Installer | `ApkStart-<version>-Setup.exe` (~1.3 GB) | Traditional Windows installer with bundled runtime, Desktop/Start Menu shortcuts, and uninstaller |
| Lite Portable | `ApkStart-v<version>-win64-portable.zip` (~96 MiB) | Lightweight portable ZIP; downloads the runtime on first launch |

## First-Time Setup

1. Launch **ApkStart** (via the Start Menu, Desktop shortcut, or `ApkStart.exe`).
2. On first run, choose your preferred UI language (defaults to **English**; 8 languages supported).
3. **Installer / Store**: Extracts the bundled Android 14 image locally (~1 minute, no internet required). **Lite Portable**: Downloads `adb`, Android Emulator, and the Android 14 image once.
4. Click **Install APK** (or drag and drop any `.apk` / `.xapk` onto the window) to install an app and generate its desktop shortcut.

## Documentation

- [User Manual & Troubleshooting Guide](docs/USER-MANUAL.md)
- [Host Check & Auto-Configure (Preflight)](docs/preflight.md)
- [Compatibility Drivers](docs/drivers.md)
- [Privacy Policy](docs/privacy.md)
- [Changelog](CHANGELOG.md)
- [Security Policy](SECURITY.md)

> Every `ApkStart.exe` build embeds the brand icon and version resources (`CompanyName = RoutineMiku`, version synced with `package.json`).
> Build from source: `npm run pack` (Lite) / `npm run pack:full` (Full) / `npm run build:msix` (Store).

### How Full-Screen Aspect-Ratio Filling Works

The emulator's **physical panel orientation** (`hw.lcd.width/height`) determines the true framebuffer shape. When the panel orientation mismatches an app's declared `screenOrientation`, Android letterboxes the app into a narrow strip.

ApkStart **parses `AndroidManifest.xml` offline during APK installation** to determine the app's natural orientation and stores it in `apps.json`. When launching, ApkStart selects the matching panel (`720x1280` portrait at `190dpi` = `606dp` for tablet layout, or `1280x720` landscape). Only when switching between portrait and landscape apps does the runtime restart (~40s); subsequent apps with the same orientation launch immediately.

### Online Updates (Automatic Fastest-Source Selection)

Go to **Settings → Software Updates → Check for updates**, or right-click the system tray icon → **Check for updates**.

1. Queries both GitHub and Gitee for the latest release;
2. Benchmarks candidate URLs (direct, Gitee, mirrors) with a 256 KB throughput test;
3. Downloads in parallel chunks from the fastest source and falls back automatically on failure.

Portable builds also support incremental app-layer updates when the Electron version is unchanged. Runtime data (`%APPDATA%\apkstart\runtime`), installed apps, and snapshots are never touched during updates.

## Out-of-the-Box Defaults

- Launches at startup and stays in the system tray; double-click any app shortcut to open directly.
- Creates both Desktop and Start Menu shortcuts on install (and repairs missing ones on startup).
- Native rendering with aspect-ratio-preserving fullscreen (`F11`) or per-app remembered window bounds.
- Automatically grants runtime permissions on install and retries/recovers on launch crashes.
- **Uses host networking directly**: QEMU user-mode NAT reuses the host's network adapter without creating any virtual network adapters or switches on Windows.

## Settings Categories & Search

Settings are organized into categories with a cross-category search bar at the top:

| Category | Contents |
|---|---|
| General & Setup | Runtime & environment, one-click deploy, launch at startup, disk usage & cleanup |
| Display & Window | Display mode, auto-fullscreen, screen orientation, auto-rotate, tablet layout, window mode, Android settings |
| Controls & Input | Mouse bindings, keyboard mapping |
| Performance & Resources | Resource preset, GPU preference, microphone, render resolution, data partition, system locale, snapshots, prewarm, advanced options |
| Network & Downloads | Update & download sources, public mirrors, download connections |
| Diagnostics & Repair | Host check & auto-configure, compatibility drivers/patches, automatic diagnostics |
| Integration & Files | Desktop & apps, file sharing, system integration |
| Updates & About | Software updates, About |

## Automatic Diagnostics (Auto-Debug)

Under **Settings → Diagnostics & Repair → Automatic Diagnostics**, ApkStart periodically checks:

- **Runtime**: Last boot failure reason, stuck boot, stale lock files, orphan processes, corrupted snapshots, missing acceleration
- **Device Connection**: `adb` unauthorized, offline, or missing while runtime is running
- **Storage**: Disk space, data partition size mismatch, unwritable shared folder
- **Settings**: Orientation policy conflicts, auto-fullscreen in native window mode
- **Network / Logs**: Guest network offline, unreachable download sources, recent log errors

Each issue provides a one-click **Fix** button and a **Guide** link to the built-in manual.

## Building from Source

```powershell
# 1. Install dependencies (including Electron)
npm install

# 2. Start and complete runtime deployment (downloads adb / Android Emulator / system image once)
npm start

# 3. (Optional) Register .apk double-click file association
npm run assoc:on

# 4. Package Lite Portable edition
npm run pack
# Output: dist/ApkStart-win64-portable/ApkStart.exe

# 5. Zip for distribution (use build/zip.js for optimal deflate size)
node build/zip.js dist/ApkStart-win64-portable ApkStart-win64-portable.zip
```

### Full Installer EXE (Bundled Runtime)

```powershell
# Prepare compressed distributable runtime under build/runtime/
npm run runtime

# Build NSIS installer EXE
npm run build:exe
# Output: dist/release/ApkStart-<version>-Setup.exe
```

## Self-Contained Runtime

ApkStart downloads, verifies, and manages its own runtime components under `%APPDATA%\apkstart\runtime`—it never detects, hijacks, or depends on MuMu, LDPlayer, BlueStacks, or WSA.

| Component | Source | Size | Purpose |
|---|---|---|---|
| `adb` (platform-tools) | `dl.google.com` | ~8 MB | Install & launch Android apps |
| Android Emulator | `dl.google.com` (8-thread) | ~440 MB | Runtime engine (device model & GPU translation) |
| Android 14 System Image (Google Play x86_64) | `dl.google.com` | ~3.1 GB raw (~1.1 GB xz) | Unified base layer supporting x86, ARM (`ndk_translation`), and GMS |
| AEHD Driver (optional) | `dl.google.com` | ~0.2 MB | Hardware acceleration (or use Windows WHPX) |

See [docs/preflight.md](docs/preflight.md) and [docs/drivers.md](docs/drivers.md) for host diagnostics and compatibility driver patches.

## Project Structure

```
apkstart/
├─ src/
│  ├─ main.js              Main process: windows / tray / single-instance / CLI / IPC
│  ├─ preload.js           Secure contextBridge preload
│  ├─ ui/                  Renderer (vanilla HTML/CSS/JS, no frameworks)
│  ├─ i18n/                Localization dictionaries (en source + zh/ru/vi/es/pt/ja/ko)
│  └─ core/
│     ├─ zip.js            Minimal ZIP reader (on-demand extraction)
│     ├─ axml.js           Android binary XML parser
│     ├─ arsc.js           resources.arsc table parser
│     ├─ apk.js            APK metadata: package, version, launcher Activity, icon, ABI
│     ├─ png.js            Zero-dependency PNG encoder & fallback icon renderer
│     ├─ shortcut.js       Multi-size ICO generator & .lnk shortcuts
│     ├─ assoc.js          .apk file association (HKCU, no admin required)
│     ├─ adb.js            adb client (install, launch, sync, screencap, etc.)
│     ├─ engine.js         Runtime manager: probe, emulator lifecycle, idle parking
│     ├─ sharer.js         Host ↔ Android shared folder bidirectional sync
│     ├─ installer.js      APK installation & launch pipeline
│     └─ store.js          App list and settings persistence
├─ engine/                 Runtime component download cache
├─ tools/platform-tools/   Portable adb location
├─ test/                   Unit tests, Electron integration tests, smoke tests
├─ build/pack.js           Portable packager
└─ scripts/assoc.js        .apk file association CLI
```

## Command Line

```
ApkStart.exe                      Open the main window
ApkStart.exe <path\to.apk>        Install an APK
ApkStart.exe --launch <package>   Launch an app directly (used by desktop shortcuts)
```

## Testing

```powershell
npm test                                   # Pure Node unit & engine pipeline tests (offline)
npm run test:boot                          # Real QEMU boot test with 61MB Alpine guest
npm run selftest                           # Runtime self-test (install -> launch -> screencap -> shared sync)
electron test/electron-integration.js      # ICO / shortcut integration test
electron . --smoke test\shot.png           # Launch app and capture smoke screenshot
```

## Troubleshooting Highlights

- **"Hardware acceleration unavailable"**: Enable **Windows Hypervisor Platform** (`HypervisorPlatform`, not just `VirtualMachinePlatform`) in Windows Features and reboot, or click **Fix** in Host Check to install AEHD on Installer/Portable builds.
- **Wrong or blank desktop icon**: Run **Settings → Integration & Files → Rebuild Shortcuts**.
- **`adb devices` doesn't show the emulator**: ApkStart runs its isolated adb server on port `5044` (`$env:ANDROID_ADB_SERVER_PORT = 5044`).

## Contributing

Issues and Pull Requests are welcome. The shell maintains zero third-party runtime dependencies—run `npm test` before submitting. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Release packages contain only ApkStart's own code and Electron runtime; Android system images, QEMU binaries, and Google components are downloaded on demand from official sources under their respective licenses.
