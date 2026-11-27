# Drivers (Compatibility Patches)

> Since ApkStart 0.5.7, compatibility **drivers** are supported: each driver is a declarative JSON file specifying **which machines it matches** and **which launch parameters to override**. Users can author and share hardware-specific patches without waiting for an ApkStart release.

---

## 1. What Problem Drivers Solve

Default parameters cannot work identically on every GPU and driver combination:

- Older integrated GPUs with GLES 3.1 may crash ~10 seconds after boot with `-gpu host`;
- Machines without Windows Hypervisor Platform must fall back immediately to software emulation (`-accel off`);
- Certain GPU driver versions produce a black screen with Vulkan enabled and work cleanly with `swangle`.

Encoding these as data files lets users and the community share working configurations without code changes.

## 2. Where Drivers Live

| Directory | Purpose |
|---|---|
| Settings → Diagnostics & Repair → **Open Drivers Folder** | User drivers: `%APPDATA%\apkstart\drivers\*.json` (`%USERPROFILE%\ApkStart\data\drivers` on Store builds) |
| `<install_dir>\resources\app\src\drivers\` | Built-in examples (read-only, `enabled: false` by default) |

When two drivers share the same `id`, the **user directory overrides the built-in one**.

## 3. Driver Format

```json
{
  "format": "apkstart-driver/1",
  "id": "amd-igpu-swangle",
  "name": "AMD iGPU · Use swangle rendering",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Explain why this machine needs this override",
  "priority": 0,
  "match": {
    "platform": ["win32"],
    "gpuVendor": ["amd"],
    "totalMB": { "min": 8192 },
    "accel": ["whpx"]
  },
  "effect": {
    "gpuMode": "swangle",
    "forceTcg": false,
    "emulatorArgs": ["-feature=Vulkan"],
    "configIni": { "hw.gpu.mode": "swangle" },
    "env": { "ANDROID_EMUGL_VERBOSE": "1" },
    "notes": ["If screen is still black, try changing gpuMode to software"]
  }
}
```

### 3.1 Top-Level Fields

| Field | Required | Description |
|---|---|---|
| `format` | ✅ | Must be `"apkstart-driver/1"` |
| `id` | ✅ | 3–64 chars (`a-z`, `0-9`, `. _ -`); used as filename on import |
| `name` | ✅ | Display name in Settings (max 80 chars) |
| `version` | ✅ | SemVer-like string, e.g. `1.0.0` |
| `author` / `description` / `homepage` | | Metadata for users |
| `enabled` | | Default toggle in file; UI toggle takes precedence |
| `priority` | | `-100` to `100` (default `0`). **Higher priority applies later** and wins conflicts |
| `match` | ✅ | Machine matching criteria (Section 3.2) |
| `effect` | ✅ | Parameter overrides (Section 3.3) |

### 3.2 `match`: Machine Criteria

All specified fields are ANDed together. An empty `match` matches nothing; use `{"any": true}` to match all machines.

| Key | Value | Description |
|---|---|---|
| `any` | `true` | Matches all machines |
| `platform` | `win32` / `linux` | OS platform |
| `arch` | `x64` / `arm64` | CPU architecture |
| `gpuVendor` | `nvidia` / `amd` / `intel` / `unknown` | GPU vendor (string or array) |
| `gpuName` | Regex string (<= 200 chars) | Case-insensitive regex, e.g. `"radeon\\s+780m"` |
| `cpuVendor` | String or array | CPU vendor match |
| `accel` | `whpx` / `aehd` / `none` | Current hardware acceleration state |
| `osBuild` | Number or `{min,max}` | Windows build number (e.g. `22631`) |
| `totalMB` | `{min,max}` | Physical RAM in MB |
| `cores` | `{min,max}` | Logical CPU cores |
| `emulatorVersion` | `{min,max}` | Numeric version comparison (`36.4.9 < 36.4.10`) |

### 3.3 `effect`: Overrides

| Field | Description |
|---|---|
| `gpuMode` | `auto` / `host` / `swangle` / `swiftshader` / `swiftshader_indirect` / `software` |
| `forceTcg` | `true` forces software emulation (`-accel off`) |
| `emulatorArgs` | Extra allowlisted `-flag=value` args passed to `emulator` |
| `configIni` | Allowlisted AVD `config.ini` keys |
| `env` | Extra environment variables (`ANDROID_` / `QEMU_` / `LIBGL_` / `MESA_` / `EMUGL_` prefixes only) |
| `notes` | Notes shown in boot logs and Settings |

## 4. Security Allowlist

Drivers are **pure JSON data**—no scripts, `eval`, or `require` are ever executed.

- **Forbidden `emulatorArgs`**: `-wipe-data`, `-partition-size`, `-datadir`, `-sysdir`, `-avd`, `-port`, `-http-proxy`.
- **Allowed `emulatorArgs`**: `-gpu`, `-accel`, `-feature`, `-gltransport`, `-qemu`, and boolean flags (`-no-audio`, `-no-boot-anim`, `-no-metrics`, `-no-snapshot`, `-no-snapshot-load`, `-no-snapshot-save`).
- **Allowed `configIni`**: `hw.gpu.mode`, `hw.gpu.enabled`, `hw.gltransport`, `hw.keyboard`, `hw.audioInput`, `hw.audioOutput`, `hw.camera.back`, `hw.camera.front`, `hw.gps`, `vm.heapSize`, `hw.lcd.density`.
- **Allowed `env`**: `ANDROID_*`, `QEMU_*`, `LIBGL_*`, `MESA_*`, `EMUGL_*` (<= 200 chars, no newlines).

## 5. Creating Your Own Driver

1. Go to **Settings → Diagnostics & Repair → Export Host Template** (pre-fills `match` for your PC).
2. Edit `effect` in a text editor (e.g., `"gpuMode": "swangle"` or `"forceTcg": true`).
3. Click **Refresh** in Settings to verify it shows as matched and active.
4. Launch an app to test stability, then share the `.json` file if desired.

## 6. Built-in Examples

Three disabled-by-default examples live in `src/drivers/`:

| File | Scenario |
|---|---|
| `example-amd-igpu-swangle.json` | AMD iGPU + older drivers crashing with `-gpu host` |
| `example-no-hypervisor-tcg.json` | No hardware acceleration available; forces software emulation |
| `example-intel-igpu-software.json` | Older Intel iGPU GLES initialization failure |
