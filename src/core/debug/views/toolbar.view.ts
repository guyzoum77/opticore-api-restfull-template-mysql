import { IRequestProfile } from "../types/debugToolbar.types";
import {
    statusClass, formatDuration, formatMemory, sqlTotalTime,
    ICON_CLOCK, ICON_MEMORY, ICON_DB, ICON_ROUTE,
    ICON_LOG, ICON_USER, ICON_SERVER, ICON_CLOSE, escapeHtml
} from "./helpers.view";

function statusBadge(code: number, profilerUrl: string): string {
    return `<a href="${profilerUrl}" class="tb-badge tb-badge--${statusClass(code)}">${code}</a>`;
}

function tbBlock(icon: string, label: string, profilerUrl: string, extra = ""): string {
    return `
        <a href="${profilerUrl}" class="tb-block">
            <span class="tb-icon">${icon}</span>
            <span class="tb-label">${escapeHtml(label)}</span>
            ${extra}
        </a>`;
}

export function renderToolbarBar(profile: IRequestProfile): string {
    const profilerUrl = `/_debug/profiler/${profile.token}`;
    const sqlMs = sqlTotalTime(profile);
    const sqlCount = profile.queries.length;
    const logCount = profile.logs.length;
    const logWarnings = profile.logs.filter(l => l.level === "warning" || l.level === "error" || l.level === "critical").length;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Debug Toolbar</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 12px;
  }
  .toolbar {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 36px;
    background: #1b1b1b;
    border-top: 1px solid #2e2e2e;
    display: flex;
    align-items: stretch;
    z-index: 99999;
    box-shadow: 0 -2px 8px rgba(0,0,0,.4);
    overflow: hidden;
  }
  .tb-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 10px;
    font-weight: 700;
    font-size: 12px;
    color: #fff;
    text-decoration: none;
    height: 100%;
    transition: opacity .15s;
  }
  .tb-badge:hover { opacity: .85; }
  .tb-badge--s-ok    { background: #2e7d32; }
  .tb-badge--s-warn  { background: #c0392b; }
  .tb-badge--s-error { background: #c0392b; }
  .tb-badge--s-redirect { background: #1565c0; }
  .tb-block {
    display: flex; align-items: center; gap: 5px;
    padding: 0 10px;
    color: #ccc;
    text-decoration: none;
    border-left: 1px solid #2e2e2e;
    height: 100%;
    white-space: nowrap;
    transition: background .15s;
    cursor: pointer;
  }
  .tb-block:hover { background: #252525; color: #fff; }
  .tb-icon { color: #888; display: flex; align-items: center; }
  .tb-block:hover .tb-icon { color: #aaa; }
  .tb-label { font-size: 12px; }
  .tb-underline { border-bottom: 2px solid #e74c3c; }
  .tb-spacer { flex: 1; }
  .tb-brand {
    display: flex; align-items: center; gap: 6px;
    padding: 0 12px;
    color: #ccc;
    text-decoration: none;
    border-left: 1px solid #2e2e2e;
    height: 100%;
    font-weight: 500;
  }
  .tb-brand:hover { background: #252525; }
  .tb-brand-icon {
    width: 20px; height: 20px;
    background: #C87A3C;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 900; color: #fff;
    flex-shrink: 0;
  }
  .tb-version {
    display: flex; align-items: center;
    padding: 0 10px;
    color: #888;
    font-size: 11px;
    border-left: 1px solid #2e2e2e;
    height: 100%;
    white-space: nowrap;
  }
  .tb-close {
    display: flex; align-items: center; justify-content: center;
    padding: 0 10px;
    color: #666;
    text-decoration: none;
    border-left: 1px solid #2e2e2e;
    height: 100%;
    cursor: pointer;
    background: none;
    border-top: none; border-right: none; border-bottom: none;
    font-size: 16px;
    transition: color .15s, background .15s;
  }
  .tb-close:hover { background: #c0392b; color: #fff; }
  .tb-badge-pill {
    display: inline-flex; align-items: center; justify-content: center;
    background: #c0392b;
    color: #fff;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    margin-left: 2px;
  }
  .tb-badge-pill--warn { background: #e67e22; }
  .tb-badge-pill--ok   { background: #2e7d32; }
  .tb-time-bar {
    width: 100%;
    height: 2px;
    background: #e74c3c;
    position: absolute;
    bottom: 0; left: 0;
  }
</style>
</head>
<body>
<div class="toolbar" id="wdt">
  ${statusBadge(profile.statusCode, profilerUrl)}

  <a href="${profilerUrl}?panel=performance" class="tb-block" style="position:relative;">
    ${ICON_CLOCK}
    <span class="tb-label tb-underline">${formatDuration(profile.duration)}</span>
    <span class="tb-time-bar" style="width:${Math.min(profile.duration / 2, 100)}%"></span>
  </a>

  ${tbBlock(ICON_MEMORY, formatMemory(profile.memoryUsage), `${profilerUrl}?panel=performance`)}

  ${tbBlock(ICON_LOG,
    logCount > 0 ? `${logCount}` : "0",
    `${profilerUrl}?panel=logs`,
    logWarnings > 0 ? `<span class="tb-badge-pill tb-badge-pill--warn">${logWarnings}</span>` : ""
  )}

  ${tbBlock(ICON_USER, "n/a", profilerUrl)}

  ${tbBlock(ICON_DB,
    sqlCount > 0 ? `${sqlCount} in ${formatDuration(sqlMs)}` : "0 queries",
    `${profilerUrl}?panel=database`,
    sqlCount > 0 ? `<span class="tb-badge-pill tb-badge-pill--ok">${sqlCount}</span>` : ""
  )}

  ${tbBlock(ICON_ROUTE, profile.route.path || profile.url, `${profilerUrl}?panel=routing`)}

  <div class="tb-spacer"></div>

  <a href="${profilerUrl}" class="tb-brand">
    <div class="tb-brand-icon">OP</div>
    <span>${ICON_SERVER} &nbsp;Server</span>
  </a>

  <div class="tb-version">${escapeHtml(profile.appVersion)}</div>

  <button class="tb-close" onclick="document.getElementById('wdt').style.display='none'" title="Close toolbar">
    ${ICON_CLOSE}
  </button>
</div>
</body>
</html>`;
}

export function renderToolbarBarFragment(profile: IRequestProfile): string {
    const profilerUrl = `/_debug/profiler/${profile.token}`;
    const sqlMs = sqlTotalTime(profile);
    const sqlCount = profile.queries.length;
    const logCount = profile.logs.length;
    const logWarnings = profile.logs.filter(l => l.level === "warning" || l.level === "error" || l.level === "critical").length;

    return `<div class="sf-toolbar" id="sfwdt${profile.token}">
  <div class="sf-toolbar-block sf-toolbar-status sf-toolbar-status-${statusClass(profile.statusCode)}">
    <a href="${profilerUrl}" title="Open profiler">${profile.statusCode}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_CLOCK} <a href="${profilerUrl}?panel=performance">${formatDuration(profile.duration)}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_MEMORY} ${formatMemory(profile.memoryUsage)}
  </div>
  <div class="sf-toolbar-block">
    ${ICON_LOG} <a href="${profilerUrl}?panel=logs">${logCount}${logWarnings > 0 ? ` <sup>${logWarnings}</sup>` : ""}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_DB} <a href="${profilerUrl}?panel=database">${sqlCount} / ${formatDuration(sqlMs)}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_ROUTE} <a href="${profilerUrl}?panel=routing">${profile.method} ${profile.route.path}</a>
  </div>
</div>`;
}
