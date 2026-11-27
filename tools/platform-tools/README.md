# Portable adb

Extract Android `platform-tools` into this directory (so `adb.exe` is present) and ApkStart will prioritize it:

```
tools/platform-tools/
└─ adb.exe
```

Download: https://developer.android.com/tools/releases/platform-tools

If this directory is empty, ApkStart checks in order:
1. Manually configured `adb` path in Settings
2. This directory
3. `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`
4. System `PATH`
