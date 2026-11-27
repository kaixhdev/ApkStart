# ApkStart User Manual & Troubleshooting Guide

> Version: v0.6.4 · Platform: Windows 10/11 x64 · Updated: 2026-11-22
>
> ApkStart is an Android app runner for Windows: **install Android apps, pin them to your desktop, and launch them by double-clicking just like native Windows software.**
> This manual covers daily usage first, then provides symptom-based troubleshooting steps. Every step maps directly to real buttons and menus inside the app.

---

## Table of Contents

1. [ApkStart in 30 Seconds](#1-apkstart-in-30-seconds)
2. [Installation & First Launch](#2-installation-first-launch)
3. [Daily Usage](#3-daily-usage)
4. [Understanding Three Core Concepts](#4-understanding-three-core-concepts)
5. [First Step When Troubleshooting: Preflight & Automatic Diagnostics](#5-first-step-when-troubleshooting-preflight-automatic-diagnostics)
6. [Common Troubleshooting Solutions](#6-common-troubleshooting-solutions)
   - [6.1 "Hardware acceleration unavailable" / Slow boot](#61-hardware-acceleration-unavailable-slow-boot)
   - [6.2 Installation Failed (INSTALL_FAILED_*)](#62-installation-failed-install_failed_)
   - [6.3 Missing ARM Translation / ARM App Fails to Install or Crashes](#63-missing-arm-translation-arm-app-fails-to-install-or-crashes)
   - [6.4 adb Unauthorized (Allow USB Debugging)](#64-adb-unauthorized-allow-usb-debugging)
   - [6.5 Double-Clicking Icon Does Nothing / Infinite Spinner / Window with Rotate Button](#65-double-clicking-icon-does-nothing-infinite-spinner-window-with-rotate-button)
   - [6.6 Quick Reference for Other Startup Issues](#66-quick-reference-for-other-startup-issues)
   - [6.7 App Has No Sound / Very Low Volume](#67-app-has-no-sound-very-low-volume)
   - [6.8 Microsoft Store Build Fails to Start / 0xC0000135 (DLL Load Failed)](#68-microsoft-store-build-fails-to-start-0xc0000135-dll-load-failed)
   - [6.9 App Cannot Access Microphone / Voice Chat & Recording Fail](#69-app-cannot-access-microphone-voice-chat-recording-fail)
   - [6.10 Discrete / Integrated GPU Rendering (GPU Preference)](#610-discrete-integrated-gpu-rendering-gpu-preference)
   - [6.11 Interface Language (Multilingual Support)](#611-interface-language-multilingual-support)
   - [6.12 Using a Custom System Image](#612-using-a-custom-system-image)
7. [Command-Line Reference](#7-command-line-reference)
8. [Data & Directory Layout](#8-data-directory-layout)
9. [Help & Feedback](#9-help-feedback)

---

## 1. ApkStart in 30 Seconds

```
Desktop shortcut (real app icon .lnk)
      │ double-click
      ▼
ApkStart.exe --launch <package>
      │ Runtime not running? → Auto-starts (Android 14 Emulator, bundled or downloaded once)
      ▼
Launches the system-resolved LAUNCHER entry (not a hardcoded main Activity)
      ▼
Emulator window = App window (custom title, real icon, portrait aspect ratio, centered fullscreen)
```

**Key Features**

- 🖱️ **Double-click `.apk` to install**: Once file associations are registered, double-clicking an APK in File Explorer automatically parses, installs, and creates a desktop shortcut.
- 🧩 **One desktop icon per app**: Icons are extracted offline from the APK; double-clicking the shortcut launches the app directly.
- 🪟 **Every app is a window**: Native rendering with centered fullscreen (preserving aspect ratio) or freely resizable windowed mode with per-app bounds memory.
- 🔍 **Searchable in Windows**: Creates both Desktop and Start Menu (`Programs\ApkStart\`) shortcuts so Windows Search finds your apps.
- 📁 **File Sharing**: Bidirectional sync between `%USERPROFILE%\ApkStartShared` and `/sdcard/ApkStartShared` inside Android.
- 🪶 **Self-contained runtime**: Does not detect, hijack, or depend on any third-party emulators (MuMu, LDPlayer, WSA, etc.) installed on your PC.

> Note: ApkStart is an early-stage, free, open-source, ad-free project maintained in the author's spare time. This manual is here to help if you run into any issues.

---

## 2. Installation & First Launch

### 2.1 Choosing the Right Edition

Both release mirrors carry identical builds:

- GitHub: `github.com/RoutineMiku/apkstart/releases`
- Gitee: `gitee.com/daily-miku/apkstart/releases`

| Edition | Filename | When to Choose |
|---|---|---|
| **Microsoft Store** | `ApkStart_<4-part-version>_x64.msix` | Install from Microsoft Store. Includes the full runtime offline; updates via Store |
| **Full Portable** | `ApkStart-v*-win64-full.zip` (~830 MB, ~1.3 GB extracted) | Extract and run immediately with no extra downloads—emulator & system image are bundled |
| **Installer** | `ApkStart-v*-Setup.exe` (~1.3 GB) | Traditional Windows installer with shortcuts and uninstaller |
| **Lite Portable** | `ApkStart-v*-win64-portable.zip` (~96 MiB, ~227 MB extracted) | Lightweight download; downloads the runtime on first launch |

> ⚠️ **Always use the latest version (v0.6.4)**. Older builds (0.5.x and earlier) either lacked a bundled runtime or defaulted to embedded windows, which caused slow launches or shell windows with a rotate button. If upgrading manually, verify your desktop shortcuts point to the new directory.

### 2.2 What Happens on First Launch

0. **Select UI Language (fresh install)**: On first launch, a language picker lets you choose English, 简体中文, Русский, Tiếng Việt, Español, Português, 日本語, 한국어, or Follow system. Your choice applies immediately and can be changed anytime under **Settings → General → Interface language**.
1. **Download Runtime (Lite Portable only)**: Downloads `adb`, Android Emulator, and the Android 14 system image using 8-thread chunked downloads with resume support. Full and Store builds skip this step.
2. **Extract System Image**: Decompresses the `.xz` image into `%APPDATA%\apkstart\system-images` (~20–60s, one-time).
3. **Create `/data` Partition**: Generates an ext4 user data partition with FBE and SELinux attributes.
4. **Auto-boot**: Subsequent app launches only run `am start`—cold boot takes ~23s, and Quick Boot snapshot resume takes ~10s.

> A slower first boot is a one-time setup cost. Subsequent launches are much faster.

---

## 3. Daily Usage

### 3.1 Installing Apps

Choose any of these three methods:

- **Double-click an APK** (register file association first under **Settings → System Integration → Associate .apk files**);
- Click **Install APK** (or drag and drop an `.apk` onto the main window);
- Command line: `ApkStart.exe <path\to.apk>`.

Supports `.apks` and `.xapk` split bundles (installed automatically via `install-multiple`). Desktop and Start Menu shortcuts are created automatically.

### 3.2 Launching Apps

Double-click the desktop shortcut. All apps share the same runtime, so launching a second app is nearly instant.

### 3.3 Window & Display Controls

| Action | How |
|---|---|
| Toggle Fullscreen / Window | Press `F11` or right-click the system tray icon. Fullscreen scales while preserving aspect ratio |
| Rotate Orientation | Press `Ctrl+Alt+R` (global) or click the title bar Rotate button; orientation is remembered per app |
| Auto-fullscreen | Settings → Application Window → Auto-fullscreen on launch (works best with forced orientation) |
| Force Landscape / Portrait | Settings → Application Window → Screen orientation |

> The runtime only restarts (~40s, with a status notice) when the panel orientation differs from the app's requested orientation. Apps sharing the same orientation open immediately.

### 3.4 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `F11` | Toggle Fullscreen / Windowed mode |
| `Ctrl+Alt+R` | Rotate current app orientation |
| `Ctrl+R` | Rotate inside embedded shell window (use `Ctrl+Alt+R` in native window mode) |

### 3.5 File Sharing (Windows ↔ Android)

`%USERPROFILE%\ApkStartShared` on Windows and `/sdcard/ApkStartShared` inside Android sync bidirectionally.
Access under **Settings → Integration & Files → File Sharing** (**Sync now** / **Open folder**).

### 3.6 Settings Navigation

Starting in 0.6.0, Settings are organized into categories with a cross-category search bar at the top:

| Category | Contents |
|---|---|
| General & Setup | Runtime & environment, one-click deploy, launch at startup, disk usage & cleanup |
| Display & Window | Display mode, auto-fullscreen, screen orientation, tablet layout, window mode |
| Controls & Input | Mouse bindings, keyboard mapping |
| Performance & Resources | Resource preset, GPU preference (discrete/integrated), microphone, render resolution, data partition, Android system locale, snapshots, prewarm |
| Network & Downloads | Update & download sources, public mirrors, download connections |
| Diagnostics & Repair | Host preflight check, compatibility drivers/patches, automatic diagnostics |
| Integration & Files | Desktop & apps, file sharing, system integration |
| Updates & About | Software updates, About |
| Labs | Native Windows multi-window (experimental), background app retention |

> **Labs · Multi-window (experimental)**: Keeps previously opened apps alive in the background so you can switch back without losing login state. Because the Android runtime uses one emulator display window, only one app is visible in the foreground at a time and memory usage increases. Disabled by default.

### 3.7 Online Updates

Go to **Settings → Updates & About → Check for updates**, or right-click the tray icon → **Check for updates**. The updater speed-tests GitHub, Gitee, and mirrors in real time, downloads in parallel chunks, and falls back automatically on failure. Your runtime, installed apps, and snapshots are preserved.

Portable builds also support **incremental updates**: when the Electron shell version is unchanged, only a small app-layer bundle is downloaded and verified file-by-file via SHA-256. If the Electron version changes or verification fails, it falls back to the full package. Microsoft Store builds update through the Microsoft Store.

---

## 4. Understanding Three Core Concepts

Most runtime issues trace back to one of these three components:

### 4.1 Runtime & System Image

ApkStart runs a **full Android 14 system image** (Google Play `x86_64`) as its base. Starting in 0.6.3, a single unified image handles both `x86_64` and `ARM` apps.

- Missing/corrupted system image or incompatible `/data` → boot failure, boot loop, or hang.
- User data (`/data`) is a writable layer; the system image itself is shared read-only.

### 4.2 Hardware Acceleration

The emulator needs CPU virtualization acceleration for smooth performance. Windows provides two paths:

| Method | Description | Admin Required | Reboot Required |
|---|---|---|---|
| **WHPX** | Built-in Windows feature "Windows Hypervisor Platform" (`HypervisorPlatform`) | When enabling | Yes |
| **AEHD** | Google's kernel hypervisor driver | When installing | No |

**Without acceleration**, Android still runs via pure software emulation (TCG), but booting takes several minutes and frame rates are low. ApkStart automatically falls back and retries up to 4 parameter combinations.

> Do not confuse **VirtualMachinePlatform** (used by WSL2) with **HypervisorPlatform**. The Android Emulator requires **HypervisorPlatform**.

### 4.3 ARM Translation Layer

Many Android apps only ship **ARM native libraries** (`arm64-v8a` / `armeabi-v7a`), while the emulator runs on **x86_64**. The unified Android 14 image includes `ndk_translation` so ARM apps work out of the box.

- If an ARM app encounters a missing translation layer, ApkStart automatically switches to the compatible image and retries (see Section 6.3).

---

## 5. First Step When Troubleshooting: Preflight & Automatic Diagnostics

Before troubleshooting manually, let ApkStart diagnose the issue:

### 5.1 Host Check & Auto-Configure

Location: **Settings → Diagnostics & Repair → Run Check**

- Checks: CPU virtualization (VT-x / SVM), Hyper-V / Hypervisor Platform, GPU / VRAM / driver date, RAM, Windows build, `emulator -accel-check`, and AEHD driver.
- Click **Apply Recommended Settings** to save optimal memory, cores, render resolution, and GPU settings as a local driver profile.
- Severity levels: `ok`, `warn` (works, optimization recommended), `bad` (must be resolved).

Only two things may require manual steps:
- **BIOS Virtualization**: Reboot into BIOS/UEFI and enable Intel VT-x or AMD SVM.
- **Windows Features / Acceleration Driver**: See Section 6.1.

### 5.2 Automatic Diagnostics (Auto-Debug)

Location: **Settings → Diagnostics & Repair → Automatic Diagnostics**

Runs periodically in the background (every 10 minutes) across six categories with one-click **Fix** buttons:

| Category | Checks |
|---|---|
| Runtime | Last boot failure reason, stuck boot, stale lock files, orphan processes, corrupted snapshots, missing hardware acceleration |
| Device Connection | `adb` unauthorized, offline, or missing while runtime is running |
| Storage | Low disk space, data partition size mismatch, unwritable shared folder |
| Settings | Orientation policy vs. panel conflict, auto-fullscreen in native window mode |
| Network / Logs | Offline guest network, unreachable download sources, recent runtime log errors |

> Failed probes are never misreported as errors, and known issues do not spam repeat notifications.

### 5.3 Export Diagnostic Report

Location: **Settings → Diagnostics & Repair → Export Diagnostic Report**

Generates a plain-text report containing host specs, auto-profile parameters, diagnosis, and the last 300 lines of runtime logs. Attach this when reporting bugs.

### 5.4 Built-in Manual & Auto-Guides

Click `?` in the title bar or **Open User Manual** under **Settings → Updates & About** to open this manual, search, or print/save as PDF.

- Each issue in Automatic Diagnostics includes a **Guide** button that jumps straight to the relevant section.
- If an automatic repair fails (acceleration, installation, ARM translation, adb authorization, audio, DLL errors), ApkStart opens the matching manual section once per session.

---

## 6. Common Troubleshooting Solutions

### 6.1 "Hardware acceleration unavailable" / Slow boot

**Symptoms**: Diagnostics report missing hardware acceleration; boot takes several minutes and animations stutter.

**Note**: This causes slowness rather than a hard failure—ApkStart automatically falls back to software emulation. Enable acceleration for smooth performance:

- **Installer / Portable**: Go to **Settings → Diagnostics & Repair → Host Check**, find the acceleration warning, and click **Fix**. Confirm the UAC prompt to enable WHPX (or install AEHD if WHPX is unsupported).
- **Microsoft Store (MSIX)**: Store apps cannot self-elevate. Clicking **Fix** opens **Turn Windows features on or off**:
  1. Check **Windows Hypervisor Platform** (`HypervisorPlatform`);
  2. Click OK and **reboot your PC**.

  Or run in an **Administrator PowerShell**:

  ```powershell
  dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart
  dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
  ```

> Make sure VT-x / SVM is also enabled in BIOS (Section 5.1), and update GPU drivers if they are over 3 years old.

---

### 6.2 Installation Failed (INSTALL_FAILED_*)

**Symptoms**: Installation fails with an `INSTALL_*` code.

| Error Code | Meaning | Solution |
|---|---|---|
| `INSTALL_FAILED_NO_MATCHING_ABIS` | App only has ARM libraries and current image lacks ARM translation | **Handled automatically**: ApkStart switches to the compatible image and retries (see [6.3](#63-missing-arm-translation-arm-app-fails-to-install-or-crashes)) |
| `INSTALL_FAILED_OLDER_SDK` | App requires a newer Android version | Requires a newer system image (current is Android 14 / API 34) |
| `INSTALL_PARSE_FAILED_NO_CERTIFICATES` | APK has no valid signature | APK is corrupted or unsigned; re-download |
| `INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES` / `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Signature differs from installed version | Uninstall the existing app first, then reinstall |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | Newer version is already installed | Install a newer version or uninstall first |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Insufficient runtime disk space | Free up disk space or move the runtime directory (**Settings → Integration & Files**) |
| `INSTALL_FAILED_INVALID_APK` | APK is corrupted or incomplete | Re-download the APK |
| `INSTALL_FAILED_INVALID_URI` | APK path has special characters | Move the APK to a plain ASCII path (e.g. `D:\a.apk`) |
| `INSTALL_FAILED_ALREADY_EXISTS` | App with same package and different signature exists | Uninstall the existing app first |
| `INSTALL_FAILED_DEPRECATED_SDK_VERSION` | App targets a very old Android SDK | **Handled automatically** via bypass flag |
| `INSTALL_FAILED_TEST_ONLY` | Test-only APK | **Handled automatically** via `-t` flag |
| `INSTALL_FAILED_MISSING_SHARED_LIBRARY` | App requires a vendor-specific library | Not supported in generic emulator environments |
| `INSTALL_FAILED_USER_RESTRICTION` | System restricted installation | Restart the runtime and retry |
| `INSTALL_FAILED_CONFLICTING_PROVIDER` | ContentProvider conflict with another app | Uninstall the conflicting app |
| `INSTALL_FAILED_INTERNAL_ERROR` | Internal system error (low space or incomplete boot) | Restart the runtime and retry after boot finishes |

---

### 6.3 Missing ARM Translation / ARM App Fails to Install or Crashes

**Symptoms**: `INSTALL_FAILED_NO_MATCHING_ABIS`, or an ARM app crashes immediately on launch with `DoBadTrampoline`, `libndk_translation`, or `UnsatisfiedLinkError`.

**How ApkStart handles it**:

1. On `NO_MATCHING_ABIS`, ApkStart switches to the Android 14 compatible image, restarts the runtime, restores installed apps from local backups, and retries installation.
2. If an app crashes due to ARM translation errors, ApkStart switches to the compatible image and retries once.

**What you can do**:

- **Wait for the switch**: Switching images restarts the runtime (~40–60s).
- **Verify image status**: Check **Settings → General & Setup → Runtime**. If the compatible image is not downloaded, click to download (~1.5 GB) and restart the runtime.
- **Persistent crashes**: A small number of apps enforce strict anti-emulator, anti-debug, or hardware integrity checks (SafetyNet / Play Integrity) and exit intentionally; ApkStart cannot bypass those app-side restrictions.

---

### 6.4 adb Unauthorized (Allow USB Debugging)

**Symptoms**: Diagnostics report `adb unauthorized` or `adb devices` shows `unauthorized`.

**Steps (in order)**:

1. Check if an emulator window is showing the **"Allow USB debugging?"** dialog—click **Allow** and check **"Always allow from this computer"**.
2. If the dialog is unresponsive or missing: go to **Settings → General & Setup → Reset Android Data** and retry (your app list is kept and apps reinstall automatically).

> ⚠️ **Do not delete `%USERPROFILE%\.android\adbkey`**. Android only writes a new public key when `adb_keys` does not exist; replacing your local key mismatches the stored key inside the guest.

> CLI debugging: ApkStart runs its dedicated adb server on **port 5044** (isolated from your system's 5037):
> ```powershell
> $env:ANDROID_ADB_SERVER_PORT = 5044
> adb devices    # Should list emulator-5554
> ```

---

### 6.5 Double-Clicking Icon Does Nothing / Infinite Spinner / Window with Rotate Button

**1. Verify you are on v0.6.4**: Check `%APPDATA%\ApkStart\logs\app.log` for `start v0.6.4`. Older shortcuts pointing to 0.5.x will launch the legacy version.

**2. Allow time for cold boot**: A cold boot takes 23–48s (orientation switches take ~50s). Do not rapid-click the shortcut multiple times while it is starting.

**3. Native window fallback**: If logs show `attach failed` or `emu:0`, the window agent fell back to the embedded shell window (with the title bar and rotate button). Launching from a junction or non-standard path was improved in 0.6.3; export a diagnostic report if it persists.

**4. Reset Android Data (last resort)**: **Settings → General & Setup → Reset Android Data** rebuilds `/data` if the partition is corrupted.

---

### 6.6 Quick Reference for Other Startup Issues

| Diagnosis | Automatic Action | Manual Action |
|---|---|---|
| Hardware acceleration unavailable | Falls back to software emulation | Enable acceleration per Section 6.1 |
| Memory allocation failed | Lowers RAM & CPU cores | Close memory-heavy apps |
| Emulator port busy | Switches to free port | Close other emulators (Nox/MuMu/BlueStacks) or reboot |
| Stale lock files / AVD already running | Cleans AVD locks and retries | Ensure no other emulator uses the same runtime |
| Missing/corrupted system image | Cold-boots with clean data | Delete and re-download image under Runtime |
| Corrupted Quick Boot snapshot | Discards snapshot & cold-boots | Clean exit rebuilds snapshot; or disable snapshots |
| Missing DLL / VC++ Redistributable | — | Whitelist ApkStart in antivirus; install VC++ 2015–2022 x64 |
| Insufficient disk space | — | Move runtime directory or disable snapshots |
| Non-ASCII install path | Uses Windows 8.3 short paths | Move ApkStart to an ASCII path (e.g. `C:\ApkStart`) |
| CPU missing AVX/SSE4 | — | Usually a warning; otherwise use older engine or newer CPU |
| Unsupported GPU mode | Selects compatible GPU mode | — |
| GPU / Unknown crash | Retries with conservative settings | Update GPU drivers or add a compatibility driver patch |

**Shortcut shows ApkStart icon or blank icon**: Use **Settings → Integration & Files → Rebuild Shortcuts** to regenerate Desktop and Start Menu shortcuts with real app icons.

---

### 6.7 App Has No Sound / Very Low Volume

1. **Windows volume & output device**: Verify Windows is not muted, the correct playback device is selected, and **Volume Mixer** has not muted ApkStart / Android Emulator.
2. **In-app volume**: Some apps start muted or at 0 media volume; check in-app settings and Android volume controls.
3. **ApkStart audio toggle**: Ensure **Settings → Performance & Resources → Android audio** is enabled, then **restart the runtime** (`-no-audio` is only applied at boot).
4. **Windows Audio service**: Press `Win+R`, run `services.msc`, and confirm **Windows Audio** (`Audiosrv`) is Running and set to Automatic (or run `net start Audiosrv` in an Admin PowerShell).
5. **Bluetooth headphones**: Disconnect/reconnect or restart the runtime after switching audio devices.

---

### 6.8 Microsoft Store Build Fails to Start / 0xC0000135 (DLL Load Failed)

**Symptoms**: App spins or exits with exit code `0xC0000135` (`3221225781`), most commonly in the Microsoft Store build.

`0xC0000135` (`STATUS_DLL_NOT_FOUND`) has three common causes:
1. **Store (MSIX) path virtualization**: Launching `qemu` from read-only `C:\Program Files\WindowsApps\...` can interfere with relative DLL resolution.
2. **Missing VC++ Redistributable**: Check **Settings → Diagnostics & Repair**—only reinstall VC++ 2015–2022 x64 if diagnostics explicitly report it missing.
3. **Antivirus quarantine**: Whitelist ApkStart's installation and runtime directories.

**Steps**:
1. Run **Host Check**; if VC++ 2015–2022 x64 is reported missing, click **Fix** and reboot.
2. Otherwise, fully quit ApkStart from the system tray and relaunch, check Windows Controlled Folder Access / antivirus exclusions, or use the **Portable** build in `C:\ApkStart` to avoid `WindowsApps` restrictions.
3. For advanced debugging, check Windows Event Viewer → Windows Logs → Application for `FaultingModuleName` and attach a Diagnostic Report.

---

### 6.9 App Cannot Access Microphone / Voice Chat & Recording Fail

1. **ApkStart microphone toggle**: Enable **Settings → Performance & Resources → Microphone input** and **restart the runtime**.
2. **Windows microphone privacy**: Under Windows **Settings → Privacy & security → Microphone**, enable both **Microphone access** and **Let desktop apps access your microphone**.
3. **Verify Windows recording**: Test your microphone in Windows Sound Recorder and set your preferred mic as the default input device.
4. **Audio & Mic relationship**: The emulator only disables the audio subsystem (`-no-audio`) when both Android audio and Microphone input are off.

---

### 6.10 Discrete / Integrated GPU Rendering (GPU Preference)

Starting in 0.6.4, ApkStart defaults to `-gpu host` across NVIDIA, AMD, and Intel GPUs (falling back automatically on crash).

On dual-GPU laptops/PCs, set **Settings → Performance & Resources → GPU preference**:

| Option | Best For |
|---|---|
| System default (recommended) | Let Windows choose automatically based on power/load |
| Discrete GPU priority | Games, video, high frame rates |
| Integrated GPU priority | Lightweight apps, battery saving |

Takes effect on the **next runtime start** (requires Windows 10 1803+). If an older AMD GPU crashes under `host`, enable the bundled `example-amd-igpu-swangle` driver under **Settings → Diagnostics & Repair → Compatibility Drivers**.

---

### 6.11 Interface Language (Multilingual Support)

ApkStart supports 8 UI languages (**English, 简体中文, Русский, Tiếng Việt, Español, Português, 日本語, 한국어**) plus **Follow system**.

- **Switch anytime**: **Settings → General & Setup → Interface language** (applies immediately without restarting apps).
- **Android system language**: Configured separately under **Settings → Performance & Resources → Android system language**.

---

### 6.12 Using a Custom System Image

If you already have an Android `x86_64` system image (e.g., from Android SDK `system-images\android-XX\tag\abi\` containing `system.img` and `kernel-ranchu`):

1. Go to **Settings → Performance & Resources → Custom system image directory** and click **Browse** (or enter the path).
2. Save and restart the runtime. Clear the field to revert to the built-in image.

> Note: Switching system images may require rebuilding `/data` on first boot.

---

## 7. Command-Line Reference

```
ApkStart.exe                          Open the main window
ApkStart.exe <path\to.apk>            Install an APK
ApkStart.exe --launch <package>       Launch an app directly (used by desktop shortcuts)
```

---

## 8. Data & Directory Layout

| Purpose | Location |
|---|---|
| Runtime (adb / emulator / image) | Bundled, or `%APPDATA%\apkstart\runtime` (Lite) |
| Extracted system image | `%APPDATA%\apkstart\system-images` |
| AVD / Installed apps / Snapshots | `%APPDATA%\apkstart\avd` |
| App icons | `%APPDATA%\apkstart\icons\<package>.ico` |
| Settings & App list | `%APPDATA%\ApkStart\settings.json` / `apps.json` |
| Runtime logs / Diagnostic reports | `%APPDATA%\ApkStart\logs\` |
| Windows ↔ Android shared folder | `%USERPROFILE%\ApkStartShared` ↔ `/sdcard/ApkStartShared` |

> **Reset Android Data** only clears the writable `/data` layer; system images and cached APKs are preserved. Ensure the drive holding `%APPDATA%` (or your custom runtime directory) has several GB of free space.

---

## 9. Help & Feedback

When reporting an issue, please attach:

1. **Diagnostic Report**: Settings → Diagnostics & Repair → Export Diagnostic Report;
2. **Last 20 lines of `app.log`**: `%APPDATA%\ApkStart\logs\app.log`;
3. **Version & Edition**: e.g., "Store 0.6.4" or "Full Portable 0.6.4".

- GitHub: <https://github.com/RoutineMiku/apkstart> (Issues / Releases)
- Gitee: <https://gitee.com/daily-miku/apkstart>

---

*This manual corresponds to v0.6.4. If any label differs slightly, follow the in-app UI.*
