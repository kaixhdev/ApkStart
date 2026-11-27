'use strict';
/**
 * 自动检测（自动 debug）内核
 *
 * 分两层，刻意分开：
 *   1) 采集层（src/core/autodebug-probe.js，主进程）：把机器真实状态采成一份纯数据快照 obs；
 *   2) 判定层（本文件，纯函数）：evaluate(obs) → issues[]。
 *
 * 判定层不碰 fs / child_process / electron，CI 可以直接 require 并单测
 * （教训见记忆 2026-11-17：CI 上 require 顶层依赖 electron 的模块会全红）。
 * 唯一额外依赖是同目录的 manual.js（纯映射表），用来把问题直接指到内置教程章节。
 *
 * 一条铁律：obs 里没有的字段一律当作「不知道」，不能因为探测失败就报问题。
 * 误报比漏报更伤用户信任 —— 用户一旦发现弹出来的「检测结果」是假的，
 * 就再也不会相信自动检测给出的任何结论了。
 */

const manual = require('./manual');

/** Issue categories (rendered in this order in Settings) */
const CATEGORIES = [
  { id: 'runtime', name: 'Runtime', hint: 'Android VM process, boot phases, snapshots, and stale locks' },
  { id: 'device', name: 'Device Connection', hint: 'adb authorization status and device online state' },
  { id: 'storage', name: 'Storage', hint: 'Disk free space, data partition, and shared folder' },
  { id: 'settings', name: 'Settings', hint: 'Conflicting or mutually overriding configuration options' },
  { id: 'network', name: 'Network', hint: 'Android networking and download source connectivity' },
  { id: 'logs', name: 'Logs', hint: 'Errors in runtime logs' },
];

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** 严重度排序：数字越大越严重 */
const SEVERITY_RANK = { error: 3, warn: 2, info: 1 };

/** 归一化一条问题，保证 UI 拿到的字段永远齐全 */
function normalise(raw) {
  if (!raw || !raw.code) return null;
  const severity = SEVERITY_RANK[raw.severity] ? raw.severity : 'info';
  const item = {
    code: String(raw.code),
    category: CATEGORY_IDS.includes(raw.category) ? raw.category : 'runtime',
    severity,
    title: String(raw.title || raw.code),
    hint: String(raw.hint || ''),
    // fix 是「一键修复」的动作名，由渲染层映射到具体操作；没有就留空
    fix: raw.fix || '',
    // detail 是给人看的补充信息（路径、数值等），不进标题
    detail: raw.detail === undefined || raw.detail === null ? '' : String(raw.detail),
  };
  // 0.6.2：每条问题都自带「教程」目标，渲染层不用再复制一份故障分类表
  item.help = manual.topicForIssue(item);
  return item;
}

/**
 * 判定：把观测快照变成问题列表
 * @param {object} obs 采集层给出的快照（字段可缺省）
 * @returns {Array<object>} 归一化后的问题列表
 */
function evaluate(obs) {
  const o = obs || {};
  const runtime = o.runtime || {};
  const device = o.device || {};
  const storage = o.storage || {};
  const settings = o.settings || {};
  const network = o.network || {};
  const logs = o.logs || {};
  const accel = o.accel || {};
  const out = [];

  const push = (raw) => {
    const it = normalise(raw);
    if (it) out.push(it);
  };

  /* ---------------- Runtime ---------------- */

  const bootError = runtime.error || (runtime.lastFailure && runtime.lastFailure.error) || '';
  if (bootError) {
    push({
      code: 'runtime.bootFailed',
      category: 'runtime',
      severity: 'error',
      title: 'Android runtime failed on last boot',
      hint: 'The underlying runtime error was captured; resolving it usually restores startup immediately.',
      detail: bootError,
      fix: 'restartRuntime',
    });
  }

  if (runtime.running && runtime.phase && runtime.phase !== 'ready' && runtime.bootMs > 150000) {
    push({
      code: 'runtime.stuckBoot',
      category: 'runtime',
      severity: 'warn',
      title: 'Android boot is stuck during startup',
      hint: 'Booting has exceeded 2.5 minutes without reaching ready state. Usually caused by a corrupted Quick Boot snapshot; restarting the runtime (cold boot) typically fixes it.',
      detail: `Phase: ${runtime.phase}`,
      fix: 'restartRuntime',
    });
  }

  if (Number(runtime.locks) > 0) {
    push({
      code: 'runtime.staleLocks',
      category: 'runtime',
      severity: 'warn',
      title: `Detected ${runtime.locks} stale lock file(s) from a previous run`,
      hint: 'Uncleaned lock files cause the next launch to fail with "AVD is already in use". Click Fix to clean them up.',
      fix: 'lock',
    });
  }

  if (Number(runtime.orphans) > 0) {
    push({
      code: 'runtime.orphanProcesses',
      category: 'runtime',
      severity: 'warn',
      title: `${runtime.orphans} orphan emulator process(es) still running`,
      hint: 'Leftover Android processes from an unclean exit still hold resources and AVD locks, which can block the next boot. Click Fix to clean up (installed apps and saves are untouched).',
      fix: 'orphans',
    });
  }

  if (runtime.snapshotStale) {
    push({
      code: 'runtime.staleSnapshot',
      category: 'runtime',
      severity: 'warn',
      title: 'Quick Boot snapshot is corrupted',
      hint: 'The snapshot file exists on disk but failed validation, forcing an extra cold boot each launch. Deleting it reclaims disk space.',
      fix: 'snapshots',
    });
  }

  /* ---------------- Device Connection ---------------- */

  if (device.state === 'unauthorized') {
    push({
      code: 'device.unauthorized',
      category: 'device',
      severity: 'error',
      title: 'Android device is unauthorized for debugging',
      hint: 'Android showed the "Allow USB debugging?" prompt without confirmation, blocking adb. Restarting the runtime (cold boot) will re-trigger authorization.',
      fix: 'restartRuntime',
    });
  } else if (device.state === 'offline') {
    push({
      code: 'device.offline',
      category: 'device',
      severity: 'warn',
      title: 'Android device is offline',
      hint: 'adb sees the device but cannot connect yet (usually still booting or adb handshake pending). Restart the runtime if it does not recover.',
      fix: 'restartRuntime',
    });
  } else if (runtime.running && device.checked && device.state === 'no-device') {
    push({
      code: 'device.missing',
      category: 'device',
      severity: 'warn',
      title: 'Runtime is running, but adb cannot see the device',
      hint: 'The Android process is alive but adb cannot detect it—often due to an adb port conflict or incomplete boot.',
      fix: 'restartRuntime',
    });
  }

  /* ---------------- Storage ---------------- */

  const freeMB = Number(storage.freeMB) || 0;
  if (freeMB > 0 && freeMB < 2048) {
    push({
      code: 'storage.diskCritical',
      category: 'storage',
      severity: 'error',
      title: 'Drive containing the runtime is nearly full',
      hint: 'Less than 2 GB free; app installs and snapshot writes will fail. Click Fix to reclaim old images, snapshots, and logs.',
      detail: `${freeMB} MB free`,
      fix: 'disk',
    });
  } else if (freeMB > 0 && freeMB < 8192) {
    push({
      code: 'storage.diskLow',
      category: 'storage',
      severity: 'warn',
      title: 'Low disk space on the runtime drive',
      hint: 'Less than 8 GB free; snapshots and system images need headroom. Cleaning up reclaimable files is recommended.',
      detail: `${freeMB} MB free`,
      fix: 'disk',
    });
  }

  if (storage.needsReset) {
    push({
      code: 'storage.dataNeedsReset',
      category: 'storage',
      severity: 'warn',
      title: 'Data partition resize has not taken effect',
      hint: 'A Quick Boot differential disk is blocking in-place expansion, so Android still sees the old size. Reset Android data to rebuild at the new size (clears installed apps).',
      detail: `Configured ${storage.configuredGB} GB · Actual ${storage.actualGB} GB`,
      fix: 'dataReset',
    });
  } else if (Number(storage.configuredGB) > 0 && Number(storage.actualGB) > 0
    && Number(storage.configuredGB) > Number(storage.actualGB)) {
    push({
      code: 'storage.dataMismatch',
      category: 'storage',
      severity: 'error',
      title: 'Android data partition is smaller than configured',
      hint: 'Available space inside Android is smaller than the configured value, which may cause "insufficient storage" errors for large games.',
      detail: `Configured ${storage.configuredGB} GB · Actual ${storage.actualGB} GB`,
      fix: 'dataReset',
    });
  }

  if (storage.sharedOk === false) {
    push({
      code: 'storage.sharedBroken',
      category: 'storage',
      severity: 'warn',
      title: 'Shared folder is unavailable',
      hint: 'The host directory for file sharing does not exist or is not writable; files saved in Android cannot sync.',
      detail: storage.sharedPath || '',
      fix: 'shared',
    });
  }

  /* ---------------- Settings ---------------- */

  const mode = String(settings.orientationMode || 'auto');
  if (mode === 'portrait' && settings.landscape === true) {
    push({
      code: 'settings.orientationConflict',
      category: 'settings',
      severity: 'warn',
      title: 'Screen orientation policy conflicts with current panel orientation',
      hint: 'Policy requires portrait, but the panel is landscape—Android will letterbox the app into a narrow strip. Align the panel orientation with the policy.',
      fix: 'orientation',
    });
  } else if (mode === 'landscape' && settings.landscape === false) {
    push({
      code: 'settings.orientationConflict',
      category: 'settings',
      severity: 'warn',
      title: 'Screen orientation policy conflicts with current panel orientation',
      hint: 'Policy requires landscape, but the panel is portrait—video and games will be squeezed into a narrow strip. Align the panel orientation with the policy.',
      fix: 'orientation',
    });
  }

  if (settings.windowEmbed === false && settings.autoFullscreen) {
    push({
      code: 'settings.detachedFullscreen',
      category: 'settings',
      severity: 'info',
      title: '"Auto-fullscreen on launch" does not apply in native window mode',
      hint: 'In native window mode the emulator manages its own window. Press F11 in the window for fullscreen, or switch to Embedded mode in Settings.',
    });
  }

  if (settings.keepSnapshot === false && freeMB > 0 && freeMB < 4096) {
    push({
      code: 'settings.snapshotOffLowDisk',
      category: 'settings',
      severity: 'info',
      title: 'Low disk space with Quick Boot snapshot disabled',
      hint: 'Under 4 GB free and snapshots are off: launching apps will perform a full cold boot (~15+ seconds). Re-enable snapshots if disk space allows.',
      fix: 'settings',
    });
  }

  /* ---------------- Audio ---------------- */

  const audio = o.audio || {};
  if (audio.checked && audio.enabled === false) {
    push({
      code: 'audio.disabled',
      category: 'settings',
      severity: 'warn',
      title: 'Android app audio is disabled in Settings',
      hint: 'Android audio output is turned off, so only ApkStart apps have no sound. Click Fix to re-enable it and restart the runtime.',
      fix: 'audio',
    });
  }
  if (audio.checked && audio.serviceRunning === false) {
    push({
      code: 'audio.windowsServiceStopped',
      category: 'settings',
      severity: 'warn',
      title: 'Windows Audio service (Audiosrv) is not running',
      hint: 'All Windows apps will lack sound while this service is stopped. Start "Windows Audio" in services.msc and set it to Automatic, or run `net start Audiosrv` in an admin PowerShell.',
      fix: 'audioService',
    });
  }
  if (audio.checked && audio.micEnabled === false) {
    push({
      code: 'audio.microphoneDisabled',
      category: 'settings',
      severity: 'warn',
      title: 'Microphone input is disabled in Settings',
      hint: 'Voice chat, calls, and recording in apps will fail (no recording device). Click Fix to re-enable and restart the runtime, and check Windows microphone permissions for desktop apps.',
      fix: 'microphone',
    });
  }

  /* ---------------- Network ---------------- */

  if (network.ok === false) {
    push({
      code: 'network.guestDown',
      category: 'network',
      severity: 'warn',
      title: 'No internet connection inside Android',
      hint: 'DNS or network connectivity failed inside Android, causing video/news apps to spin indefinitely. Use "Repair Network" to reset Android data if needed (app list is preserved).',
      detail: network.reason || '',
      fix: 'repairNetwork',
    });
  }

  const badSources = Array.isArray(network.sources) ? network.sources.filter((s) => s && s.ok === false) : [];
  if (badSources.length) {
    push({
      code: 'network.sourcesDown',
      category: 'network',
      severity: 'warn',
      title: `${badSources.length} download source(s) unreachable`,
      hint: 'Update checks query multiple sources; one failing does not block updates. If all fail, check your internet connection or proxy.',
      detail: badSources.map((s) => s.name).join(', '),
      fix: 'settings',
    });
  }

  /* ---------------- Logs ---------------- */

  const errLines = Array.isArray(logs.errors) ? logs.errors.filter(Boolean) : [];
  if (errLines.length) {
    push({
      code: 'logs.errors',
      category: 'logs',
      severity: 'warn',
      title: `${errLines.length} error(s) found in runtime logs`,
      hint: 'The last session recorded errors; export a diagnostic report to view full context.',
      detail: errLines.slice(-1)[0],
      fix: 'report',
    });
  }

  /* ---------------- Acceleration ---------------- */

  if (accel.checked && accel.ok === false) {
    push({
      code: 'accel.softwareEmulation',
      category: 'runtime',
      severity: 'warn',
      title: 'Hardware acceleration is not available',
      hint: 'Running in pure software emulation (slow boot and lower frame rates). Enable "Windows Hypervisor Platform" and reboot to fix.',
      detail: accel.note || '',
      fix: 'virtualization',
    });
  }

  return dedupe(out);
}

/** 同 code 只留最后一条（后一次检测覆盖前一次） */
function dedupe(issues) {
  const map = new Map();
  for (const raw of issues || []) {
    const it = normalise(raw);
    if (!it) continue;
    map.set(it.code, it);
  }
  return Array.from(map.values());
}

/** 按严重度从高到低排 */
function bySeverity(a, b) {
  const d = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
  if (d) return d;
  return String(a.code).localeCompare(String(b.code));
}

/** 汇总：给状态条计数、给设置页分栏 */
function summarize(issues) {
  const list = dedupe(issues).sort(bySeverity);
  const errors = list.filter((i) => i.severity === 'error').length;
  const warns = list.filter((i) => i.severity === 'warn').length;
  const infos = list.filter((i) => i.severity === 'info').length;
  const byCategory = CATEGORIES.map((c) => {
    const items = list.filter((i) => i.category === c.id);
    return {
      id: c.id,
      name: c.name,
      count: items.length,
      errors: items.filter((i) => i.severity === 'error').length,
    };
  });
  return {
    total: list.length,
    errors,
    warns,
    infos,
    byCategory,
    // 一眼能看出「有没有必须马上处理的问题」
    health: errors ? 'error' : (warns ? 'warn' : (infos ? 'info' : 'ok')),
  };
}

/** 按分类分组，用于设置页分类渲染 */
function groupByCategory(issues) {
  const list = dedupe(issues).sort(bySeverity);
  return CATEGORIES.map((c) => ({
    ...c,
    items: list.filter((i) => i.category === c.id),
  })).filter((g) => g.items.length);
}

/**
 * 对比两次检测结果：找出「新出现」和「已消失」的问题。
 * 自动检测只在新问题出现时提醒用户，已消失的只做静默记账 ——
 * 每次都弹「已恢复 3 项」会变成噪音。
 */
function diff(prevIssues, nextIssues) {
  const prev = new Map((prevIssues || []).map((i) => [i.code, i]));
  const next = new Map((nextIssues || []).map((i) => [i.code, i]));
  const added = [];
  const resolved = [];
  for (const [code, it] of next) {
    const before = prev.get(code);
    if (!before || before.severity !== it.severity) added.push(it);
  }
  for (const [code, it] of prev) {
    if (!next.has(code)) resolved.push(it);
  }
  return { added, resolved };
}

module.exports = {
  CATEGORIES,
  CATEGORY_IDS,
  SEVERITY_RANK,
  normalise,
  evaluate,
  dedupe,
  summarize,
  groupByCategory,
  diff,
  bySeverity,
};
