# Changelog

All notable changes to ApkStart are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated CI validation for i18n dictionaries, manual generation, unit tests, English UI smoke tests, and Windows packaging.
- Automated Windows release pipeline with SHA-256 checksums (`SHA256SUMS.txt`) and tag-to-version verification.
- GitHub issue templates, pull request template, `SECURITY.md`, and `CHANGELOG.md`.

### Changed
- Completed full Chinese-to-English localization across UI, core runtime, diagnostics, build scripts, and documentation.
- Set English (`en`) as the default UI language and fallback language, while preserving all 8 supported languages (`en`, `zh`, `ru`, `vi`, `es`, `pt`, `ja`, `ko`).
- Translated the built-in user manual (`docs/USER-MANUAL.md` / `src/ui/manual.html`) to English and aligned topic anchors.

## [0.6.4] - 2026-11-22

### Changed
- Defaulted GPU rendering preference to `host` across NVIDIA, AMD, and Intel GPUs with automatic fallback on crash.
- Improved 0xC0000135 (DLL load failure) diagnostics and added Section 6.8 to the built-in manual.
- Added discrete/integrated GPU preference (`UserGpuPreferences`) and microphone input toggle.
- Added incremental app-layer updates for portable builds.
