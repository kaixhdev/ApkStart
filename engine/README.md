# Runtime Engine Directory (Manual Placement, Optional)

**ApkStart is self-contained by default**: `adb`, Android Emulator/QEMU, and system images are automatically downloaded and managed under `%APPDATA%\apkstart\runtime\`.

This directory is only needed if you want to place binaries manually:

## 1. Manual QEMU Placement

```
engine/qemu/
├─ qemu-system-x86_64.exe
├─ qemu-img.exe
└─ … (remaining QEMU files)
```

Official Windows QEMU builds: https://qemu.weilnetz.de/w64/

## 2. Manual adb Placement

```
tools/platform-tools/
└─ adb.exe
```

Download: https://developer.android.com/tools/releases/platform-tools

## Hardware Acceleration

Enable **Windows Hypervisor Platform** in **Turn Windows features on or off** and reboot. Otherwise, ApkStart falls back to software emulation (TCG).
