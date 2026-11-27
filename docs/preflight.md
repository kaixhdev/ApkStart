# Host Check & Auto-Configure (Preflight)

> Starting in 0.5.8, Settings includes **Run Check** under Diagnostics & Repair: it inspects whether this PC can run the Android runtime, applies safe settings automatically, provides one-click elevation buttons where admin rights are needed, and gives clear instructions for BIOS changes.

## 1. What It Checks

| Item | How It Probes | On Failure |
|---|---|---|
| CPU Virtualization (VT-x / SVM) | `Win32_Processor` `VirtualizationFirmwareEnabled` / `VMMonitorModeExtensions` | Marked `unknown`, prompts manual check |
| Hyper-V / VBS Running | `Win32_ComputerSystem.HypervisorPresent` | `unknown` |
| Windows Hypervisor Platform (WHPX) | `Get-WindowsOptionalFeature -FeatureName HypervisorPlatform`; falls back to `WinHvPlatform.dll` + Hypervisor presence | `unknown` |
| Hardware Acceleration | `emulator -accel-check` (reuses provisioner cache) | Treated as unavailable |
| AEHD Driver | `%SystemRoot%\System32\drivers\aehd.sys` | Treated as not installed |
| GPU / VRAM / Driver Version | `Win32_VideoController` + Registry `HardwareInformation.qwMemorySize` (`AdapterRAM` truncates >4 GB) | GPU unknown |
| Memory / Windows Build | `Win32_ComputerSystem`, `os.release()` | — |

**WMI Caveat**: When Hyper-V / Memory Integrity (VBS) is active, `VMMonitorModeExtensions` and `SecondLevelAddressTranslationExtensions` report `False` even though hardware acceleration works. Those fields only trigger "unsupported" if no Hypervisor is present and acceleration is unavailable.

## 2. What Auto-Configure Writes

Clicking **Apply Recommended Settings** writes only safe, reversible options:

| Setting | Rule |
|---|---|
| `memoryMB` | 32 GB host -> 8 GB; 16 GB -> 6 GB; 12 GB -> 4 GB; 8 GB -> 3 GB; smaller -> 2 GB (never >50% of host RAM) |
| `cores` | 8+ threads -> 4 cores; 4–7 -> 2–3 cores (always reserves >= 1 core for Windows) |
| `renderSize` | No acceleration or VRAM < 512 MB -> `540x960`; otherwise `auto` |
| `gpuMode` | Accelerated -> `auto` (fallback chain); no acceleration -> `software` |
| `forceTcg` | No acceleration -> `true` |

It also saves a hardware driver profile (`%APPDATA%\apkstart\drivers\auto-<vendor>-<build>.json`, `priority: 5`) subject to the same driver allowlist validation.

## 3. User-Assisted Steps

| Situation | UI Action |
|---|---|
| VT-x / SVM disabled in BIOS | **Manual guide only** (reboot into BIOS -> enable Intel VT-x / AMD SVM) |
| Windows Features disabled (Installer) | **Enable now (Admin)** -> elevated `dism` for `HypervisorPlatform` + `VirtualMachinePlatform` -> prompt reboot |
| Windows Features disabled (Store) | **Open "Windows Features"** (MSIX cannot self-elevate) |
| No acceleration & VT supported (Installer) | **Install AEHD driver (Admin)** |
| GPU driver > 3 years old | Recommends updating from vendor website (never auto-installs GPU drivers) |

## 4. Severity Levels

- `ok`: Ready
- `warn`: Works, optimization recommended (low RAM, older driver, older OS build, unreadable hardware info)
- `bad`: Blocking issue (BIOS virtualization off, Windows Hypervisor Platform off)

## 5. Privacy

All probes run locally (read-only WMI, Registry, and file existence checks). No network requests or telemetry are sent.
