# ApkStart Privacy Policy

Last updated: 2026-11-16

ApkStart is a locally-running Android app runner. Our principle is simple: **we do not collect, upload, or share your personal data.**

## 1. What We Do Not Collect

- No account system, no name, email, phone number, or other identity data.
- No device identifiers, advertising IDs, or location data.
- No analytics, telemetry, crash-reporting, or advertising SDKs.
- No data is sent to any server operated by us — we do not operate one.

## 2. Local Data (Never Leaves Your Device)

| Path | Content |
|---|---|
| `%USERPROFILE%\ApkStart\data` | Android system image, installed apps, app data, snapshots |
| `%USERPROFILE%\ApkStartShared` | Shared folder synced bidirectionally with `/sdcard/ApkStartShared` inside Android |

Uninstalling the Microsoft Store version does not automatically delete these directories; you may remove them manually at any time.

## 3. Network Behavior

- **Microsoft Store build**: All runtime components are bundled; first launch extracts locally without downloading executables. Updates are delivered by the Microsoft Store.
- **Installer / Portable build**: GitHub and Gitee Release endpoints are contacted only when you check for updates; the Lite Portable build downloads the runtime package on first launch. Requests contain only version metadata and standard HTTP headers.
- Network access from Android apps is controlled by those apps and routed via QEMU user-mode NAT over your host network; ApkStart does not inspect or retain traffic.

## 4. Third-Party Apps

Third-party Android apps you run are provided by their respective developers and governed by their own privacy policies.

## 5. Children

This application is not directed at children under 13 and does not knowingly collect information from children.

## 6. Changes & Contact

Updates to this policy will be posted on this page with an updated "Last updated" date.
For questions, open an issue at https://github.com/kaixhdev/ApkStart/issues.
