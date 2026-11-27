# Contributing Guide

Issues and Pull Requests are welcome. This project follows a **zero-dependency shell, predictable behavior** philosophy—please review the guidelines below before contributing.

## Development Environment

- Windows 10/11 x64
- Node.js >= 20
- `npm install && npm start`

## Pre-Submission Checks

```powershell
npm test          # Pure Node unit tests + engine pipeline tests (no network or VM required)
```

For UI changes, run a smoke screenshot to verify layout integrity:

```powershell
electron . --smoke test\shot.png
```

## Code Conventions

- **Zero third-party runtime dependencies in the shell**. Parsers under `src/core/` (ZIP, AXML, ARSC, PNG, ICO) are hand-written; prefer Node built-in modules for new features.
- The renderer uses vanilla HTML/CSS/JS with no frontend framework.
- All Android interactions go through `src/core/adb.js`—do not assemble raw `adb` commands elsewhere.
- Main and renderer communicate exclusively through the allowlisted `preload.js` bridge with `contextIsolation` enabled.
- Comments, UI strings, and identifiers should be written in English.
- **UI Localization (i18n)**: English is the source and default language; translations live in `src/i18n/<lang>.json` keyed by English source text and applied only at the display boundary:
  - `npm run i18n:check` validates dictionary formatting and placeholder parity (also runs in CI);
  - Never pass `adb`/`emulator` commands, log-parsing regexes, package names, paths, config keys, or IPC channels through i18n;
  - Use `{name}` / `{0}` placeholders for interpolated strings and keep placeholders identical across translations.

## Testing Conventions

- Tests automatically skip real APK parsing when no APK fixture is available; to cover it, set:

```powershell
$env:APKSTART_TEST_APK="C:\path\to\any.apk"; npm test
```

- Do not access the external internet in unit tests. Spin up a local `http` server for network tests (see `test/engine-test.js`).

## Commit Messages

Follow Conventional Commits style, for example:

```
feat(engine): support importing qcow2 disk from custom path
fix(axml): correct attribute table base offset
docs: add WHPX setup instructions
```

## Legal & Boundaries

- This repository does not distribute Android system images, QEMU binaries, or Google components; they are downloaded on demand on the user's machine.
- Do not commit commercial APKs, cracking tools, or any copyrighted third-party content.
