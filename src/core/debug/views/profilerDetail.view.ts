import { IRequestProfile, ISqlQuery, ILogEntry } from "../types/debugToolbar.types";
import { IRegisteredRoute } from "../debugToolbar.module";
import {
    statusClass, formatDuration, formatMemory, formatTimestamp,
    sqlTotalTime, escapeHtml,
    ICON_CLOCK, ICON_MEMORY, ICON_DB, ICON_ROUTE,
    ICON_LOG, ICON_PERF, ICON_CONFIG, ICON_EXCEPTION, ICON_CLOSE, ICON_MAP
} from "./helpers.view";

type Panel = "request" | "performance" | "logs" | "routing" | "configuration" | "database" | "exception" | "routes";

const FF = `'Montserrat',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;

const LOGO_SVG = `<svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 2C8.27 2 2 8.27 2 16s6.27 14 14 14 14-6.27 14-14S23.73 2 16 2zm6.7 9.46c-.07 1.83-1.07 2.78-2.05 2.75-.86-.03-1.4-.5-1.34-1.18.05-.62.45-.78.78-1.18.25-.32.31-.58.21-.9-.13-.42-.55-.62-1.1-.6-.93.02-1.55.62-1.49 1.5.04.55.43 1.12.86 1.86l.37.62c.42.83.66 1.36.7 2.04.08 1.27-.78 2.36-2.43 2.41-1.13.04-2.1-.44-2.27-1.26-.12-.57.18-.92.59-1.05.5-.13.86.13.96.65.1.5-.04.66-.04.92.02.42.46.55.92.54.71-.02 1.07-.5 1.05-1.11-.02-.5-.27-.85-.85-1.78l-.31-.5c-.61-1-1.04-1.77-1.07-2.62-.05-1.51 1.05-2.83 3.1-2.9 1.55-.05 2.78.66 2.74 1.56z" fill="#fff"/></svg>`;

const ICON_SETTINGS_LG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;

const BASE_CSS = `
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:#fff; color:#222; font-family:${FF}; font-size:13px; line-height:1.5; -webkit-font-smoothing:antialiased; }
  a { color:#C87A3C; text-decoration:none; }
  a:hover { text-decoration:underline; }
  code, pre { font-family:"SF Mono",Consolas,"Liberation Mono",monospace; }

  /* keep panel inner styles using CSS vars for convenience */
  :root {
    --bg:#fff; --sidebar-bg:#fff; --content-bg:#fff;
    --border:#e3e3e3; --text:#222; --muted:#888; --accent:#C87A3C;
    --hover:#fafafa; --active-bg:#FDF3EA; --active-border:#C87A3C;
    --ok-bg:#e8f4ec; --ok-text:#1a7a3c;
    --warn-bg:#fbe3e4; --warn-text:#c0392b;
    --info-bg:#FDF3EA; --info-text:#9A5020;
  }

  /* CONTENT area */
  .pf-content { flex:1; overflow-y:auto; padding:36px 40px; }

  /* PANEL */
  .panel-title { font-size:17px; font-weight:600; color:var(--text); margin-bottom:18px; display:flex; align-items:center; gap:8px; }
  .panel-section { margin-bottom:28px; }
  .panel-section-title {
    font-size:12px; font-weight:600; text-transform:uppercase;
    letter-spacing:.7px; color:var(--muted); margin-bottom:10px;
    display:flex; align-items:center; gap:6px;
  }
  .panel-section-title::after {
    content:""; flex:1; height:1px; background:var(--border);
  }

  /* CARDS ROW (for Request/Response panel) */
  .card-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:16px; }
  .card {
    background:var(--sidebar-bg); border:1px solid var(--border);
    border-radius:6px; padding:16px;
  }
  .card-title { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
  .card-value { font-size:14px; color:var(--text); }
  .card-empty { color:var(--muted); font-style:italic; font-size:12px; }

  /* TABLES */
  .data-table { width:100%; border-collapse:collapse; font-size:12px; }
  .data-table th {
    background:#F0EBE1; padding:8px 12px; text-align:left;
    font-size:11px; font-weight:600; text-transform:uppercase;
    letter-spacing:.5px; color:var(--muted); border-bottom:1px solid var(--border);
    white-space:nowrap;
  }
  .data-table td { padding:8px 12px; border-bottom:1px solid var(--border); vertical-align:top; }
  .data-table tr:hover td { background:var(--hover); }
  .data-table tr:last-child td { border-bottom:none; }
  .data-table .key-col { color:#6A5A48; font-family:monospace; font-size:12px; white-space:nowrap; width:220px; }
  .data-table .val-col { color:var(--text); font-family:monospace; font-size:12px; word-break:break-all; }
  .table-wrap { background:var(--sidebar-bg); border:1px solid var(--border); border-radius:6px; overflow:hidden; margin-bottom:20px; }
  .table-wrap-title {
    background:#F0EBE1; padding:10px 14px; font-size:12px; font-weight:600;
    color:var(--muted); border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:8px;
  }
  .table-search {
    margin-left:auto; background:#EDE7DB; border:1px solid var(--border);
    color:var(--text); padding:3px 8px; border-radius:3px; font-size:11px; outline:none;
  }
  .table-search:focus { border-color:#C87A3C; }

  /* SQL */
  .sql-block { padding:12px 14px; border-bottom:1px solid var(--border); }
  .sql-block:last-child { border-bottom:none; }
  .sql-meta { display:flex; gap:10px; margin-bottom:6px; align-items:center; }
  .sql-type { font-size:10px; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; }
  .sql-type-SELECT { background:#FDF3EA; color:#9A5020; }
  .sql-type-INSERT { background:#EBF5EF; color:#2D6A4A; }
  .sql-type-UPDATE { background:#FEF9E7; color:#7D6608; }
  .sql-type-DELETE { background:#FDECEA; color:#C0392B; }
  .sql-type-OTHER  { background:#E8E0D4; color:#6A5A48; }
  .sql-duration { color:var(--muted); font-size:11px; margin-left:auto; }
  .sql-code {
    background:#F0EBE1; border:1px solid var(--border); border-radius:4px;
    padding:10px 12px; font-family:monospace; font-size:12px;
    color:#3A2810; white-space:pre-wrap; word-break:break-all;
    line-height:1.6;
  }

  /* LOGS */
  .log-entry { padding:10px 14px; border-bottom:1px solid var(--border); display:flex; gap:10px; align-items:flex-start; }
  .log-entry:last-child { border-bottom:none; }
  .log-level {
    font-size:10px; font-weight:700; padding:2px 7px; border-radius:3px;
    text-transform:uppercase; white-space:nowrap; flex-shrink:0;
  }
  .log-debug    { background:#E8E0D4; color:#6A5A48; }
  .log-info     { background:var(--info-bg); color:var(--info-text); }
  .log-warning  { background:#FEF9E7; color:#7D6608; }
  .log-error    { background:var(--warn-bg); color:var(--warn-text); }
  .log-critical { background:#FDECEA; color:#7F1010; }
  .log-msg { color:var(--text); font-size:12px; flex:1; word-break:break-word; }
  .log-time { color:var(--muted); font-size:11px; white-space:nowrap; font-family:monospace; }
  .log-context { margin-top:6px; font-family:monospace; font-size:11px; color:#6A5A48; background:#F0EBE1; padding:6px 8px; border-radius:3px; }

  /* PERFORMANCE */
  .perf-bar-wrap { margin-bottom:8px; }
  .perf-bar-label { display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px; }
  .perf-bar-outer { height:8px; background:#E8E0D4; border-radius:4px; overflow:hidden; }
  .perf-bar-inner { height:100%; border-radius:4px; transition:width .3s; }

  /* STATS GRID */
  .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
  .stat-card {
    background:var(--sidebar-bg); border:1px solid var(--border); border-radius:6px;
    padding:14px 16px; text-align:center;
  }
  .stat-value { font-size:22px; font-weight:700; color:var(--text); margin-bottom:2px; }
  .stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }

  /* MISC */
  .badge { display:inline-block; padding:1px 7px; border-radius:10px; font-size:11px; font-weight:600; }
  .badge-ok   { background:#EBF5EF; color:#2D6A4A; }
  .badge-warn { background:#FDECEA; color:#C0392B; }
  .badge-info { background:#FDF3EA; color:#9A5020; }
  .badge-muted{ background:#E8E0D4; color:#6A5A48; }
  .empty-state { text-align:center; padding:48px 24px; color:var(--muted); }
  .empty-icon { font-size:36px; margin-bottom:12px; }
  .empty-text { font-size:14px; }
  .json-pre {
    background:#F0EBE1; border:1px solid var(--border); border-radius:4px;
    padding:14px; font-size:11.5px; color:#3A2810; font-family:monospace;
    white-space:pre-wrap; word-break:break-all; max-height:400px; overflow:auto;
    line-height:1.6;
  }
  hr.divider { border:none; border-top:1px solid var(--border); margin:20px 0; }

  /* ── PERFORMANCE METRICS ROW (Symfony-style) ── */
  .perf-metrics-row {
    display:flex; border:1px solid var(--border); border-radius:6px;
    background:var(--sidebar-bg); overflow:hidden; margin-bottom:28px;
  }
  .perf-metric {
    flex:1; padding:20px 24px; border-right:1px solid var(--border); text-align:center;
  }
  .perf-metric:last-child { border-right:none; }
  .perf-metric-label {
    font-size:11px; font-weight:600; text-transform:uppercase;
    letter-spacing:.5px; color:var(--muted); margin-bottom:10px;
  }
  .perf-metric-value { font-size:30px; font-weight:700; color:var(--text); font-family:monospace; }
  .perf-metric-unit { font-size:13px; font-weight:400; color:var(--muted); }

  /* ── EXECUTION TIMELINE ── */
  .tl-threshold-row {
    display:flex; align-items:center; gap:8px;
    font-size:12px; color:var(--text); margin-bottom:12px; flex-wrap:wrap;
  }
  .tl-threshold-input {
    width:56px; padding:4px 8px; border:1px solid var(--border);
    border-radius:3px; background:#F0EBE1; color:var(--text);
    font-size:12px; outline:none; text-align:center;
  }
  .tl-threshold-input:focus { border-color:var(--accent); }
  .tl-threshold-hint { color:var(--muted); font-size:11.5px; }
  .tl-legend {
    display:flex; align-items:center; gap:14px;
    font-size:11.5px; color:var(--muted); margin-bottom:14px;
  }
  .tl-legend-item { display:flex; align-items:center; gap:5px; }
  .tl-legend-dot { width:10px; height:10px; border-radius:2px; display:inline-block; }
  .tl-chart {
    background:var(--sidebar-bg); border:1px solid var(--border);
    border-radius:5px; overflow:hidden;
  }
  .tl-row {
    display:flex; align-items:center; gap:12px;
    padding:10px 16px; border-bottom:1px solid var(--border);
  }
  .tl-row:last-child { border-bottom:none; }
  .tl-name {
    width:200px; flex-shrink:0; font-size:12px; color:var(--text);
    font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .tl-track {
    flex:1; height:20px; background:#EDE7DB;
    border-radius:3px; overflow:hidden; position:relative;
  }
  .tl-bar {
    height:100%; min-width:4px; border-radius:3px;
    display:flex; align-items:center; justify-content:flex-end;
    padding-right:6px; transition:width .3s;
  }
  .tl-bar-label { color:#fff; font-size:10.5px; font-weight:600; white-space:nowrap; }
  .tl-info { width:80px; font-size:11px; color:var(--muted); font-family:monospace; flex-shrink:0; text-align:right; }
  .tl-empty { color:var(--muted); font-size:12px; padding:24px; text-align:center; }

  /* ── ROUTES PANEL ── */
  .routes-summary {
    display:flex; gap:0; border:1px solid var(--border); border-radius:6px;
    background:var(--sidebar-bg); overflow:hidden; margin-bottom:24px;
  }
  .routes-summary-item {
    flex:1; padding:16px 20px; border-right:1px solid var(--border); text-align:center;
  }
  .routes-summary-item:last-child { border-right:none; }
  .routes-summary-value { font-size:28px; font-weight:700; color:var(--text); font-family:monospace; }
  .routes-summary-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); margin-top:4px; }
  .route-method {
    display:inline-block; padding:2px 8px; border-radius:3px;
    font-size:11px; font-weight:700; color:#fff; font-family:monospace;
  }
  .rm-GET    { background:#2e7d32; }
  .rm-POST   { background:#1565c0; }
  .rm-PUT    { background:#e65100; }
  .rm-DELETE { background:#c62828; }
  .rm-PATCH  { background:#6a1b9a; }
  .rm-ALL    { background:#424242; }
  .rm-OPTIONS{ background:#37474f; }
  .route-path { font-family:monospace; font-size:12.5px; color:var(--text); }
  .route-path .param { color:var(--accent); }
  .route-filter { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .route-filter-btn {
    padding:4px 12px; border-radius:3px; border:1px solid var(--border);
    background:#F0EBE1; color:var(--muted); font-size:11.5px; cursor:pointer;
    transition:all .1s;
  }
  .route-filter-btn:hover, .route-filter-btn.active {
    background:var(--hover); border-color:var(--accent); color:var(--text);
  }
`;

function sidebarItem(icon: string, label: string, panel: Panel, active: Panel, badge?: number, badgeIsError = false): string {
    const isActive = panel === active;
    const badgeHtml = badge != null && badge > 0
        ? `<span style="background:${badgeIsError ? "#fbe3e4" : "#e8f4ec"};color:${badgeIsError ? "#c0392b" : "#1a7a3c"};border-radius:4px;padding:2px 9px;font-size:13px;font-weight:600;">${badge}</span>`
        : "";
    const activeCss = isActive
        ? `border-left:4px solid #C87A3C;background:#FDF3EA;color:#C87A3C;font-weight:600;padding-left:20px;`
        : `padding-left:24px;color:#555;border-left:4px solid transparent;`;
    const flex = badge != null && badge > 0 ? "justify-content:space-between;" : "";
    return `<a href="?panel=${panel}" style="display:flex;align-items:center;gap:14px;${flex}padding:16px 20px;${activeCss}font-size:16px;text-decoration:none;" onmouseenter="if(!this.classList.contains('act'))this.style.background='#fafafa'" onmouseleave="if(!this.classList.contains('act'))this.style.background=''">
        ${badge != null && badge > 0
            ? `<span style="display:flex;align-items:center;gap:14px;">${icon} ${label}</span>${badgeHtml}`
            : `${icon} ${label}`}
    </a>`;
}

function sqlType(sql: string): string {
    const t = sql.trimStart().toUpperCase().slice(0, 6);
    if (t.startsWith("SELECT")) return "SELECT";
    if (t.startsWith("INSERT")) return "INSERT";
    if (t.startsWith("UPDATE")) return "UPDATE";
    if (t.startsWith("DELETE")) return "DELETE";
    return "OTHER";
}

function renderHeaders(headers: Record<string, string>): string {
    const entries = Object.entries(headers);
    if (entries.length === 0) return `<div class="empty-state"><div class="empty-text">None</div></div>`;
    return `<table class="data-table">
    <tbody>${entries.map(([k, v]) =>
        `<tr><td class="key-col">${escapeHtml(k)}</td><td class="val-col">${escapeHtml(v)}</td></tr>`
    ).join("")}</tbody></table>`;
}

function renderKeyValue(obj: Record<string, unknown>, emptyLabel = "None"): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) return `<div style="color:#555;font-style:italic;padding:10px 0;font-size:13px;">${emptyLabel}</div>`;
    return `<table class="data-table">
    <tbody>${entries.map(([k, v]) =>
        `<tr><td class="key-col">${escapeHtml(k)}</td><td class="val-col">${escapeHtml(typeof v === "object" ? JSON.stringify(v, null, 2) : String(v))}</td></tr>`
    ).join("")}</tbody></table>`;
}

// ===== PANELS =====

function panelRequest(profile: IRequestProfile): string {
    const hasBody = Object.keys(profile.request.body ?? {}).length > 0;
    const hasQuery = Object.keys(profile.request.query ?? {}).length > 0;
    const hasCookies = Object.keys(profile.request.cookies ?? {}).length > 0;
    const statusOk = profile.statusCode < 400;

    return `
    <div class="panel-title">Request / Response</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value" style="color:${statusOk ? "#4caf50" : "#e74c3c"}">${profile.statusCode}</div>
        <div class="stat-label">HTTP Status</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatDuration(profile.duration)}</div>
        <div class="stat-label">Duration</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatMemory(profile.memoryUsage)}</div>
        <div class="stat-label">Memory</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${profile.queries.length}</div>
        <div class="stat-label">SQL Queries</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="card-title">GET Parameters</div>
        ${hasQuery ? renderKeyValue(profile.request.query as Record<string, unknown>) : `<div class="card-empty">None</div>`}
      </div>
      <div class="card">
        <div class="card-title">POST Parameters</div>
        ${hasBody ? renderKeyValue(profile.request.body as Record<string, unknown>) : `<div class="card-empty">None</div>`}
      </div>
      <div class="card">
        <div class="card-title">Route Parameters</div>
        ${Object.keys(profile.request.params ?? {}).length > 0
            ? renderKeyValue(profile.request.params as Record<string, unknown>)
            : `<div class="card-empty">None</div>`}
      </div>
      <div class="card">
        <div class="card-title">Uploaded Files</div>
        <div class="card-empty">None</div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Request Attributes</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td class="key-col">_method</td><td class="val-col">${escapeHtml(profile.method)}</td></tr>
            <tr><td class="key-col">_route</td><td class="val-col">${escapeHtml(profile.route.path)}</td></tr>
            <tr><td class="key-col">_controller</td><td class="val-col">${escapeHtml(profile.route.controller ?? "unknown")}</td></tr>
            <tr><td class="key-col">_ip</td><td class="val-col">${escapeHtml(profile.request.ip)}</td></tr>
            <tr><td class="key-col">_hostname</td><td class="val-col">${escapeHtml(profile.request.hostname ?? "localhost")}</td></tr>
            <tr><td class="key-col">_protocol</td><td class="val-col">${escapeHtml(profile.request.protocol ?? "http")}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Request Headers</div>
      <div class="table-wrap">
        <div class="table-wrap-title">Headers <input type="search" class="table-search" placeholder="Filter…" oninput="filterTable(this)"></div>
        ${renderHeaders(profile.request.headers as Record<string, string>)}
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Response Headers</div>
      <div class="table-wrap">
        ${renderHeaders(profile.response.headers as Record<string, string>)}
      </div>
    </div>

    ${hasCookies ? `<div class="panel-section">
      <div class="panel-section-title">Cookies</div>
      <div class="table-wrap">${renderKeyValue(profile.request.cookies as Record<string, unknown>)}</div>
    </div>` : ""}

    ${profile.response.body ? `<div class="panel-section">
      <div class="panel-section-title">Response Body</div>
      <pre class="json-pre">${escapeHtml(JSON.stringify(profile.response.body, null, 2))}</pre>
    </div>` : ""}`;
}

function panelPerformance(profile: IRequestProfile): string {
    const total   = profile.duration;
    const sqlTime = sqlTotalTime(profile);
    const appTime = Math.max(0, total - sqlTime);

    const events: { label: string; duration: number; color: string }[] = [
        { label: "kernel.request  (Application)", duration: appTime,  color: "#C87A3C" },
        ...(sqlTime > 0 ? [{ label: "kernel.response (Database SQL)",  duration: sqlTime,  color: "#2D6A4A" }] : []),
    ].filter(e => e.duration > 0);

    const timelineRows = events.length > 0
        ? events.map(e => {
            const pct = total > 0 ? Math.min((e.duration / total) * 100, 100) : 0;
            return `
            <div class="tl-row">
              <div class="tl-name">${e.label}</div>
              <div class="tl-track">
                <div class="tl-bar" style="width:${Math.max(pct, 0.5).toFixed(1)}%;background:${e.color};">
                  <span class="tl-bar-label">${formatDuration(e.duration)}</span>
                </div>
              </div>
              <div class="tl-info">${formatDuration(e.duration)}</div>
            </div>`;
          }).join("")
        : `<div class="tl-empty">No timing events recorded for this request.</div>`;

    return `
    <div class="panel-title">Performance metrics</div>

    <div class="perf-metrics-row">
      <div class="perf-metric">
        <div class="perf-metric-label">Total execution time</div>
        <div class="perf-metric-value">${total}<span class="perf-metric-unit">ms</span></div>
      </div>
      <div class="perf-metric">
        <div class="perf-metric-label">Application time</div>
        <div class="perf-metric-value">${appTime}<span class="perf-metric-unit">ms</span></div>
      </div>
      <div class="perf-metric">
        <div class="perf-metric-label">Peak memory usage</div>
        <div class="perf-metric-value">${(Math.max(0, profile.memoryUsage) / 1024 / 1024).toFixed(2)}<span class="perf-metric-unit"> MiB</span></div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Execution timeline</div>

      <div class="tl-threshold-row">
        Threshold
        <input type="number" class="tl-threshold-input" id="tl-threshold" value="0" min="0" max="${total}">
        ms
        <span class="tl-threshold-hint">(timeline only displays events with a duration longer than this threshold)</span>
      </div>

      <div class="tl-legend">
        <span class="tl-legend-item"><span class="tl-legend-dot" style="background:#C87A3C;"></span> application</span>
        ${sqlTime > 0 ? `<span class="tl-legend-item"><span class="tl-legend-dot" style="background:#2D6A4A;"></span> database</span>` : ""}
      </div>

      <div class="tl-chart">${timelineRows}</div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Process Info</div>
      <div class="table-wrap">
        <table class="data-table">
          <tbody>
            <tr><td class="key-col">Node.js version</td><td class="val-col">${escapeHtml(profile.nodeVersion)}</td></tr>
            <tr><td class="key-col">App version</td><td class="val-col">${escapeHtml(profile.appVersion)}</td></tr>
            <tr><td class="key-col">Environment</td><td class="val-col"><span class="badge ${profile.environment === "production" ? "badge-warn" : "badge-info"}">${escapeHtml(profile.environment)}</span></td></tr>
            <tr><td class="key-col">Process PID</td><td class="val-col">${process.pid}</td></tr>
            <tr><td class="key-col">Platform</td><td class="val-col">${process.platform}</td></tr>
            <tr><td class="key-col">Heap used</td><td class="val-col">${formatMemory(process.memoryUsage().heapUsed)}</td></tr>
            <tr><td class="key-col">Heap total</td><td class="val-col">${formatMemory(process.memoryUsage().heapTotal)}</td></tr>
            <tr><td class="key-col">RSS</td><td class="val-col">${formatMemory(process.memoryUsage().rss)}</td></tr>
            <tr><td class="key-col">Uptime</td><td class="val-col">${Math.round(process.uptime())}s</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function panelDatabase(profile: IRequestProfile): string {
    const queries = profile.queries;
    const totalTime = sqlTotalTime(profile);

    if (queries.length === 0) {
        return `
        <div class="panel-title">${ICON_DB} Database</div>
        <div class="empty-state">
          <div class="empty-icon">🗄</div>
          <div class="empty-text">No SQL queries were recorded for this request.</div>
          <div style="font-size:12px;color:#555;margin-top:8px;">
            Use <code>sqlCollector.record(token, { sql, duration })</code> in your repositories.
          </div>
        </div>`;
    }

    return `
    <div class="panel-title">${ICON_DB} Database Queries</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${queries.length}</div>
        <div class="stat-label">Total Queries</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatDuration(totalTime)}</div>
        <div class="stat-label">Total Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${queries.length > 0 ? formatDuration(Math.round(totalTime / queries.length)) : "0 ms"}</div>
        <div class="stat-label">Avg per Query</div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap-title">
        ${ICON_DB} SQL Queries
        <span class="badge badge-info">${queries.length}</span>
      </div>
      ${queries.map((q: ISqlQuery, i: number) => {
        const type = sqlType(q.sql);
        return `<div class="sql-block">
          <div class="sql-meta">
            <span class="sql-type sql-type-${type}">${type}</span>
            <span style="color:#666;font-size:11px;">#${i + 1}</span>
            ${q.error ? `<span class="badge badge-warn">ERROR</span>` : ""}
            <span class="sql-duration">${ICON_CLOCK} ${formatDuration(q.duration)}</span>
          </div>
          <pre class="sql-code">${escapeHtml(q.sql)}</pre>
          ${q.bindings && q.bindings.length > 0
            ? `<div style="margin-top:6px;font-size:11px;color:#666;">Bindings: <code>${escapeHtml(JSON.stringify(q.bindings))}</code></div>`
            : ""}
          ${q.error ? `<div style="color:#e74c3c;font-size:11px;margin-top:4px;">Error: ${escapeHtml(q.error)}</div>` : ""}
        </div>`;
    }).join("")}
    </div>`;
}

function panelLogs(profile: IRequestProfile): string {
    const logs = profile.logs;

    if (logs.length === 0) {
        return `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No log entries were recorded for this request.</div>
          <div style="font-size:12px;color:#555;margin-top:8px;">
            Use <code>logCollector.record(token, { level, message })</code> to add entries.
          </div>
        </div>`;
    }

    const errCount  = logs.filter(l => l.level === "error" || l.level === "critical").length;
    const warnCount = logs.filter(l => l.level === "warning").length;
    const deprCount = logs.filter(l => (l.level as string) === "deprecation").length;

    function tabBadge(count: number, cls: string): string {
        return count > 0
            ? `<span class="log-tab-badge ${cls}">${count}</span>`
            : `<span class="log-tab-zero">0</span>`;
    }

    function levelCls(level: string): string {
        if (level === "critical") return "log-error";
        if (level === "deprecation") return "log-deprecation";
        return `log-${level}`;
    }

    function rowBorderCls(level: string): string {
        if (level === "error" || level === "critical") return "log-row-error";
        if (level === "warning") return "log-row-warning";
        if (level === "deprecation") return "log-row-deprecation";
        return "";
    }

    function logType(level: string): string {
        if (level === "error" || level === "critical") return "error";
        if (level === "warning") return "warning";
        if (level === "deprecation") return "deprecation";
        return "other";
    }

    const rows = logs.map((l: ILogEntry, i: number) => {
        const ctx = l.context ?? {};
        const hasCtx = Object.keys(ctx).length > 0;
        const hasStack = hasCtx && typeof ctx.stack === "string" && (ctx.stack as string).length > 0;
        const source = hasCtx && typeof ctx.source === "string" ? ctx.source as string : "";

        const ctxId   = `lctx${i}`;
        const stackId = `lstk${i}`;
        const ms = String(l.timestamp % 1000).padStart(3, "0");
        const timeStr = new Date(l.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
        }) + "." + ms;

        let extra = "";
        if (hasStack) {
            const stack = ctx.stack as string;
            const ctxWithoutStack: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(ctx)) {
                if (k !== "stack") ctxWithoutStack[k] = v;
            }
            const hasOtherCtx = Object.keys(ctxWithoutStack).length > 0;
            extra = `
            <div class="log-meta-links">
              ${hasOtherCtx ? `<button class="log-ctx-btn" onclick="toggleLogCtx('${ctxId}', this)">Show context</button>` : ""}
              <button class="log-ctx-btn" onclick="toggleLogCtx('${stackId}', this)">Show trace</button>
            </div>
            ${hasOtherCtx ? `<pre id="${ctxId}" class="log-context-detail">${escapeHtml(JSON.stringify(ctxWithoutStack, null, 2))}</pre>` : ""}
            <pre id="${stackId}" class="log-context-detail log-stack-trace">${escapeHtml(stack)}</pre>`;
        } else if (hasCtx) {
            extra = `
            <div class="log-meta-links">
              <button class="log-ctx-btn" onclick="toggleLogCtx('${ctxId}', this)">Show context</button>
            </div>
            <pre id="${ctxId}" class="log-context-detail">${escapeHtml(JSON.stringify(ctx, null, 2))}</pre>`;
        }

        return `
        <tr class="log-row ${rowBorderCls(l.level)}" data-ltype="${logType(l.level)}">
          <td class="log-td-time">
            ${escapeHtml(timeStr)}<br>
            <span class="log-level ${levelCls(l.level)}">${escapeHtml(l.level)}</span>
          </td>
          <td class="log-td-msg">
            <span class="log-msg-text">${escapeHtml(l.message)}</span>
            ${source ? `<span class="log-source-ref">${escapeHtml(source)}</span>` : ""}
            ${extra}
          </td>
        </tr>`;
    }).join("");

    return `
    <div class="log-tabs" id="log-tabs">
      <button class="log-tab active" data-ltab="all">All messages</button>
      <button class="log-tab" data-ltab="error">Errors ${tabBadge(errCount, "log-tab-err")}</button>
      <button class="log-tab" data-ltab="deprecation">Deprecations ${tabBadge(deprCount, "log-tab-depr")}</button>
      <button class="log-tab" data-ltab="warning">Warnings ${tabBadge(warnCount, "log-tab-warn")}</button>
    </div>

    <div class="log-table-wrap">
      <table class="log-table">
        <thead><tr><th>Time</th><th>Message</th></tr></thead>
        <tbody id="log-tbody">${rows}</tbody>
      </table>
    </div>

    <script>
    (function(){
      var tabs = document.querySelectorAll('#log-tabs .log-tab');
      var rows = document.querySelectorAll('#log-tbody .log-row');
      tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          var f = this.getAttribute('data-ltab');
          tabs.forEach(function(t){ t.classList.remove('active'); });
          this.classList.add('active');
          rows.forEach(function(row){
            row.style.display = (f === 'all' || row.getAttribute('data-ltype') === f) ? '' : 'none';
          });
        });
      });
    })();
    function toggleLogCtx(id, btn){
      var el = document.getElementById(id);
      if(!el) return;
      var shown = el.style.display === 'block';
      el.style.display = shown ? 'none' : 'block';
      btn.textContent = shown ? 'Show context' : 'Hide context';
    }
    </script>`;
}

function panelRouting(profile: IRequestProfile): string {
    return `
    <div class="panel-title">${ICON_ROUTE} Routing</div>

    <div class="panel-section">
      <div class="panel-section-title">Matched Route</div>
      <div class="table-wrap">
        <table class="data-table">
          <tbody>
            <tr><td class="key-col">Route</td><td class="val-col"><code>${escapeHtml(profile.route.path)}</code></td></tr>
            <tr><td class="key-col">Method</td><td class="val-col"><span class="badge badge-info">${escapeHtml(profile.route.method)}</span></td></tr>
            <tr><td class="key-col">Controller</td><td class="val-col">${escapeHtml(profile.route.controller ?? "unknown")}</td></tr>
            <tr><td class="key-col">Full URL</td><td class="val-col"><code>${escapeHtml(profile.request.url)}</code></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    ${Object.keys(profile.route.params ?? {}).length > 0 ? `
    <div class="panel-section">
      <div class="panel-section-title">Route Parameters</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Value</th></tr></thead>
          <tbody>
            ${Object.entries(profile.route.params ?? {}).map(([k, v]) =>
              `<tr><td class="key-col">${escapeHtml(k)}</td><td class="val-col"><code>${escapeHtml(v)}</code></td></tr>`
            ).join("")}
          </tbody>
        </table>
      </div>
    </div>` : ""}

    ${Object.keys(profile.request.query ?? {}).length > 0 ? `
    <div class="panel-section">
      <div class="panel-section-title">Query String</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            ${Object.entries(profile.request.query ?? {}).map(([k, v]) =>
              `<tr><td class="key-col">${escapeHtml(k)}</td><td class="val-col"><code>${escapeHtml(String(v))}</code></td></tr>`
            ).join("")}
          </tbody>
        </table>
      </div>
    </div>` : ""}`;
}

function panelConfiguration(profile: IRequestProfile): string {
    const safeEnv = Object.entries(process.env)
        .filter(([k]) => !/(PASSWORD|SECRET|KEY|TOKEN|AUTH|PASS|PRIVATE)/i.test(k))
        .sort(([a], [b]) => a.localeCompare(b));

    return `
    <div class="panel-title">${ICON_CONFIG} Configuration</div>

    <div class="panel-section">
      <div class="panel-section-title">App Info</div>
      <div class="table-wrap">
        <table class="data-table">
          <tbody>
            <tr><td class="key-col">App Version</td><td class="val-col">${escapeHtml(profile.appVersion)}</td></tr>
            <tr><td class="key-col">Node.js</td><td class="val-col">${escapeHtml(profile.nodeVersion)}</td></tr>
            <tr><td class="key-col">Environment</td><td class="val-col"><span class="badge ${profile.environment === "production" ? "badge-warn" : "badge-info"}">${escapeHtml(profile.environment)}</span></td></tr>
            <tr><td class="key-col">Platform</td><td class="val-col">${process.platform} (${process.arch})</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Environment Variables <span class="badge badge-muted">${safeEnv.length}</span></div>
      <div class="table-wrap">
        <div class="table-wrap-title">Environment <input type="search" class="table-search" placeholder="Filter…" oninput="filterTable(this)"></div>
        <table class="data-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            ${safeEnv.map(([k, v]) =>
              `<tr><td class="key-col">${escapeHtml(k)}</td><td class="val-col" style="max-width:500px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(v ?? "")}">${escapeHtml(v ?? "")}</td></tr>`
            ).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function panelException(profile: IRequestProfile): string {
    const errLogs = profile.logs.filter(l => l.level === "error" || l.level === "critical");
    const isError = profile.statusCode >= 500;
    const isNotFound = profile.statusCode === 404;

    return `
    <div class="panel-title">${ICON_EXCEPTION} Exceptions</div>
    ${errLogs.length === 0 && !isError ? `
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-text">No exceptions were thrown during this request.</div>
    </div>` : `
    ${isError || isNotFound ? `
    <div style="background:var(--warn-bg);border:1px solid #c62828;border-radius:6px;padding:16px 20px;margin-bottom:20px;">
      <div style="font-weight:700;font-size:13px;color:#e74c3c;margin-bottom:6px;">
        ${ICON_EXCEPTION} HTTP ${profile.statusCode} — ${escapeHtml(profile.statusMessage)}
      </div>
      <div style="font-family:monospace;font-size:12px;color:#999;">
        ${escapeHtml(profile.method)} ${escapeHtml(profile.url)}
      </div>
    </div>` : ""}
    ${errLogs.map(l => `
    <div style="background:#1e1a1a;border:1px solid #c62828;border-radius:6px;padding:14px 18px;margin-bottom:12px;">
      <div style="font-weight:700;font-size:13px;color:#e74c3c;margin-bottom:6px;">${escapeHtml(l.level.toUpperCase())}</div>
      <pre style="font-size:12px;color:#e0e0e0;white-space:pre-wrap;">${escapeHtml(l.message)}</pre>
      ${l.context ? `<pre class="json-pre" style="margin-top:10px;">${escapeHtml(JSON.stringify(l.context, null, 2))}</pre>` : ""}
    </div>`).join("")}
    `}`;
}

function panelRoutes(routes: IRegisteredRoute[]): string {
    if (routes.length === 0) {
        return `
        <div class="panel-title">${ICON_MAP} Routes</div>
        <div class="empty-state">
          <div class="empty-icon">🗺</div>
          <div class="empty-text">No routes found. Routes are collected after the server starts.</div>
        </div>`;
    }

    const methods  = [...new Set(routes.map(r => r.method))].sort();
    const appRoutes   = routes.filter(r => !r.path.startsWith("/_debug") && r.path !== "/");
    const debugRoutes = routes.filter(r => r.path.startsWith("/_debug") || r.path === "/");

    function colorParam(path: string): string {
        return escapeHtml(path).replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g,
            '<span class="param">:$1</span>');
    }

    function methodBadge(method: string): string {
        const cls = ["GET","POST","PUT","DELETE","PATCH","OPTIONS"].includes(method)
            ? `rm-${method}` : "rm-ALL";
        return `<span class="route-method ${cls}">${method}</span>`;
    }

    function renderTable(rows: IRegisteredRoute[]): string {
        if (rows.length === 0) return `<div style="padding:14px;color:var(--muted);font-size:12px;text-align:center;">None</div>`;
        return `<table class="data-table">
          <thead><tr><th>Method</th><th>Path</th><th style="text-align:center;">Middlewares</th></tr></thead>
          <tbody>
            ${rows.map(r => `
            <tr>
              <td>${methodBadge(r.method)}</td>
              <td class="route-path">${colorParam(r.path)}</td>
              <td class="center mono muted">${r.middlewareCount}</td>
            </tr>`).join("")}
          </tbody>
        </table>`;
    }

    return `
    <div class="panel-title">${ICON_MAP} Routes</div>

    <div class="routes-summary">
      <div class="routes-summary-item">
        <div class="routes-summary-value">${routes.length}</div>
        <div class="routes-summary-label">Total Routes</div>
      </div>
      <div class="routes-summary-item">
        <div class="routes-summary-value">${appRoutes.length}</div>
        <div class="routes-summary-label">App Routes</div>
      </div>
      ${methods.map(m => `
      <div class="routes-summary-item">
        <div class="routes-summary-value">${routes.filter(r => r.method === m).length}</div>
        <div class="routes-summary-label">${m}</div>
      </div>`).join("")}
    </div>

    ${appRoutes.length > 0 ? `
    <div class="panel-section">
      <div class="panel-section-title">Application Routes <span class="badge badge-info">${appRoutes.length}</span></div>
      <div class="table-wrap">${renderTable(appRoutes)}</div>
    </div>` : ""}

    ${debugRoutes.length > 0 ? `
    <div class="panel-section">
      <div class="panel-section-title">Framework / Debug Routes <span class="badge badge-muted">${debugRoutes.length}</span></div>
      <div class="table-wrap">${renderTable(debugRoutes)}</div>
    </div>` : ""}`;
}

export function renderProfilerDetail(profile: IRequestProfile, panel: Panel = "request", appRoutes: IRegisteredRoute[] = []): string {
    const logErrors   = profile.logs.filter(l => l.level === "error" || l.level === "critical").length;
    const logWarnings = profile.logs.filter(l => l.level === "warning").length;
    const hasException = profile.statusCode >= 400 || logErrors > 0;
    const isError = profile.statusCode >= 500 || profile.statusCode >= 400;
    const token6  = profile.token.slice(0, 6);

    let panelContent: string;
    switch (panel) {
        case "performance":   panelContent = panelPerformance(profile); break;
        case "logs":          panelContent = panelLogs(profile); break;
        case "routing":       panelContent = panelRouting(profile); break;
        case "configuration": panelContent = panelConfiguration(profile); break;
        case "database":      panelContent = panelDatabase(profile); break;
        case "exception":     panelContent = panelException(profile); break;
        case "routes":        panelContent = panelRoutes(appRoutes); break;
        default:              panelContent = panelRequest(profile);
    }

    // Banner color by status
    let bannerBg: string, bannerBorder: string, bannerCode: string, bannerMsg: string;
    if (profile.statusCode >= 500) {
        bannerBg="#fcebec"; bannerBorder="#e1142d"; bannerCode="#e1142d"; bannerMsg="#d98a8f";
    } else if (profile.statusCode >= 400) {
        bannerBg="#fcebec"; bannerBorder="#e1142d"; bannerCode="#e1142d"; bannerMsg="#d98a8f";
    } else if (profile.statusCode >= 300) {
        bannerBg="#e3edf8"; bannerBorder="#1565c0"; bannerCode="#1565c0"; bannerMsg="#6a9fd8";
    } else {
        bannerBg="#e8f4ec"; bannerBorder="#2e7d32"; bannerCode="#2e7d32"; bannerMsg="#6aaa6a";
    }

    const methodBadge = `<span style="display:inline-block;padding:7px 13px;border:1px solid #d7d7d7;border-radius:4px;font-size:18px;font-weight:600;color:#555;background:#f5f5f5;">${escapeHtml(profile.method)}</span>`;

    const fmtDate = new Date(profile.timestamp).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
    const fmtTime = new Date(profile.timestamp).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" });

    const panelLabel: Record<Panel, string> = {
        request: "Request / Response", performance: "Performance",
        logs: "Log Messages", routing: "Routing", configuration: "Configuration",
        database: "Database", exception: "Exception", routes: "Routes",
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Profiler — ${profile.method} ${escapeHtml(profile.url)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${BASE_CSS}
  /* Panel inner styles */
  .panel-title { font-size:18px; font-weight:600; color:#333; margin-bottom:18px; }
  .panel-section { margin-bottom:22px; }
  .panel-section-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#888; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
  .panel-section-title::after { content:""; flex:1; height:1px; background:#e6e6e6; }
  .card-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin-bottom:16px; }
  .card { background:#f8f8f8; border:1px solid var(--border); border-radius:4px; padding:12px 16px; }
  .card-title { font-size:11px; color:var(--muted); margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:.4px; }
  .card-value { font-size:13px; color:#333; }
  .card-empty { color:var(--muted); font-style:italic; font-size:13px; }
  .data-table { width:100%; border-collapse:collapse; font-size:13px; }
  .data-table th { background:#f5f5f5; padding:9px 13px; text-align:left; font-size:11px; font-weight:700; color:#666; border-bottom:1px solid #e6e6e6; text-transform:uppercase; letter-spacing:.4px; }
  .data-table td { padding:9px 13px; border-bottom:1px solid #ececec; vertical-align:top; }
  .data-table tr:hover td { background:#fafafa; }
  .data-table tr:last-child td { border-bottom:none; }
  .data-table .key-col { color:#555; font-family:monospace; font-size:12px; white-space:nowrap; width:240px; }
  .data-table .val-col { color:#333; font-family:monospace; font-size:12px; word-break:break-all; }
  .table-wrap { background:#fff; border:1px solid #e6e6e6; border-radius:4px; overflow:hidden; margin-bottom:18px; }
  .table-wrap-title { background:#f5f5f5; padding:10px 14px; font-size:13px; font-weight:600; color:#444; border-bottom:1px solid #e6e6e6; display:flex; align-items:center; gap:10px; }
  .table-search { margin-left:auto; background:#fff; border:1px solid #d0d0d0; color:#333; padding:3px 8px; border-radius:3px; font-size:12px; outline:none; font-family:${FF}; }
  .table-search:focus { border-color:#C87A3C; }
  .sql-block { padding:11px 14px; border-bottom:1px solid #ececec; }
  .sql-block:last-child { border-bottom:none; }
  .sql-meta { display:flex; gap:8px; margin-bottom:5px; align-items:center; }
  .sql-type { font-size:10px; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; }
  .sql-type-SELECT{background:#FDF3EA;color:#9A5020} .sql-type-INSERT{background:#e8f4ec;color:#1a7a3c}
  .sql-type-UPDATE{background:#FEF9E7;color:#7D6608} .sql-type-DELETE{background:#fbe3e4;color:#c0392b} .sql-type-OTHER{background:#f0f0f0;color:#666}
  .sql-duration { color:var(--muted); font-size:11px; margin-left:auto; }
  .sql-code { background:#f8f8f8; border:1px solid #e6e6e6; border-radius:4px; padding:10px 12px; font-family:monospace; font-size:12px; color:#333; white-space:pre-wrap; word-break:break-all; line-height:1.6; }
  .log-entry { padding:9px 13px; border-bottom:1px solid #ececec; display:flex; gap:10px; align-items:flex-start; }
  .log-entry:last-child { border-bottom:none; }
  .log-level { font-size:10px; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; white-space:nowrap; flex-shrink:0; }
  .log-debug{background:#f0f0f0;color:#666} .log-info{background:#FDF3EA;color:#9A5020}
  .log-warning{background:#FEF9E7;color:#7D6608} .log-error{background:#fbe3e4;color:#c0392b} .log-critical{background:#fbe3e4;color:#7F1010}
  .log-msg { color:#333; font-size:13px; flex:1; word-break:break-word; }
  .log-time { color:var(--muted); font-size:11px; white-space:nowrap; font-family:monospace; }
  .log-context { margin-top:5px; font-family:monospace; font-size:11px; color:#555; background:#f5f5f5; padding:6px 8px; border-radius:3px; }
  .perf-metrics-row { display:flex; border:1px solid #e6e6e6; border-radius:6px; overflow:hidden; margin-bottom:18px; }
  .perf-metric { flex:1; padding:16px 20px; border-right:1px solid #e6e6e6; text-align:center; }
  .perf-metric:last-child { border-right:none; }
  .perf-metric-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); margin-bottom:6px; }
  .perf-metric-value { font-size:22px; font-weight:700; color:#222; font-family:monospace; }
  .perf-metric-unit { font-size:13px; font-weight:400; color:var(--muted); }
  .tl-threshold-row { display:flex; align-items:center; gap:8px; font-size:12px; color:#333; margin-bottom:10px; flex-wrap:wrap; }
  .tl-threshold-input { width:52px; padding:3px 7px; border:1px solid #d0d0d0; border-radius:3px; background:#fff; color:#333; font-size:12px; outline:none; text-align:center; font-family:${FF}; }
  .tl-threshold-hint { color:var(--muted); font-size:12px; }
  .tl-legend { display:flex; align-items:center; gap:12px; font-size:12px; color:var(--muted); margin-bottom:10px; }
  .tl-legend-item { display:flex; align-items:center; gap:5px; }
  .tl-legend-dot { width:10px; height:10px; border-radius:2px; display:inline-block; }
  .tl-chart { background:#fff; border:1px solid #e6e6e6; border-radius:4px; overflow:hidden; }
  .tl-row { display:flex; align-items:center; gap:12px; padding:8px 13px; border-bottom:1px solid #ececec; }
  .tl-row:last-child { border-bottom:none; }
  .tl-name { width:200px; flex-shrink:0; font-size:12px; color:#333; font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tl-track { flex:1; height:18px; background:#f0f0f0; border-radius:3px; overflow:hidden; position:relative; }
  .tl-bar { height:100%; min-width:4px; border-radius:3px; display:flex; align-items:center; justify-content:flex-end; padding-right:6px; }
  .tl-bar-label { color:#fff; font-size:10px; font-weight:600; white-space:nowrap; }
  .tl-info { width:75px; font-size:11px; color:var(--muted); font-family:monospace; flex-shrink:0; text-align:right; }
  .tl-empty { color:var(--muted); font-size:13px; padding:24px; text-align:center; }
  .routes-summary { display:flex; border:1px solid #e6e6e6; border-radius:6px; overflow:hidden; margin-bottom:18px; }
  .routes-summary-item { flex:1; padding:12px 16px; border-right:1px solid #e6e6e6; text-align:center; }
  .routes-summary-item:last-child { border-right:none; }
  .routes-summary-value { font-size:22px; font-weight:700; color:#222; font-family:monospace; }
  .routes-summary-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); margin-top:4px; }
  .route-method { display:inline-block; padding:2px 7px; border-radius:3px; font-size:11px; font-weight:700; color:#fff; font-family:monospace; }
  .rm-GET{background:#2e7d32} .rm-POST{background:#1565c0} .rm-PUT{background:#e65100} .rm-DELETE{background:#c62828} .rm-PATCH{background:#6a1b9a} .rm-ALL{background:#424242} .rm-OPTIONS{background:#37474f}
  .route-path { font-family:monospace; font-size:13px; color:#333; }
  .route-path .param { color:#C87A3C; }
  .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:16px; }
  .stat-card { background:#f8f8f8; border:1px solid #e6e6e6; border-radius:4px; padding:12px 16px; text-align:center; }
  .stat-value { font-size:20px; font-weight:700; color:#222; margin-bottom:3px; }
  .stat-label { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
  .badge { display:inline-block; padding:2px 7px; border-radius:4px; font-size:11px; font-weight:600; }
  .badge-ok   { background:#e8f4ec; color:#1a7a3c; }
  .badge-warn { background:#fbe3e4; color:#c0392b; }
  .badge-info { background:#FDF3EA; color:#9A5020; }
  .badge-muted{ background:#f0f0f0; color:#666; }
  .empty-state { text-align:center; padding:40px 24px; color:var(--muted); }
  .empty-icon { font-size:28px; margin-bottom:8px; }
  .empty-text { font-size:13px; }
  .json-pre { background:#f8f8f8; border:1px solid #e6e6e6; border-radius:4px; padding:12px; font-size:12px; color:#333; font-family:monospace; white-space:pre-wrap; word-break:break-all; max-height:400px; overflow:auto; line-height:1.6; }
  hr.divider { border:none; border-top:1px solid #e6e6e6; margin:18px 0; }
  .perf-bar-wrap { margin-bottom:8px; }
  .perf-bar-label { display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px; }
  .perf-bar-outer { height:7px; background:#f0f0f0; border-radius:4px; overflow:hidden; }
  .perf-bar-inner { height:100%; border-radius:4px; }
  .center { text-align:center; }
  .mono { font-family:monospace; }
  .muted { color:var(--muted); }

  /* ── LOG FILTER TABS ── */
  .log-tabs { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; }
  .log-tab {
    padding:5px 13px; border:1px solid #e0e0e0; border-radius:4px;
    font-size:13px; cursor:pointer; background:#f8f8f8; color:#555;
    font-family:inherit; transition:all .12s;
    display:inline-flex; align-items:center; gap:5px;
  }
  .log-tab.active { background:#fff; border-color:#C87A3C; color:#C87A3C; font-weight:600; }
  .log-tab:hover:not(.active) { background:#fff; border-color:#bbb; color:#333; }
  .log-tab-badge {
    display:inline-flex; align-items:center; justify-content:center;
    border-radius:10px; font-size:10px; font-weight:700;
    min-width:18px; height:18px; padding:0 5px; color:#fff;
  }
  .log-tab-err  { background:#c0392b; }
  .log-tab-warn { background:#e67e22; }
  .log-tab-depr { background:#8e44ad; }
  .log-tab-zero { color:#aaa; font-size:12px; }

  /* ── LOG MESSAGES TABLE ── */
  .log-table-wrap { border:1px solid #e6e6e6; border-radius:4px; overflow:hidden; }
  .log-table { width:100%; border-collapse:collapse; font-size:12px; }
  .log-table th { background:#f5f5f5; padding:9px 14px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#888; border-bottom:1px solid #e6e6e6; }
  .log-row { border-bottom:1px solid #ececec; }
  .log-row:last-child { border-bottom:none; }
  .log-row td { padding:10px 14px; vertical-align:top; }
  .log-td-time { width:150px; white-space:nowrap; color:#888; font-family:monospace; font-size:11px; }
  .log-row-error   { border-left:3px solid #e74c3c; }
  .log-row-warning { border-left:3px solid #e67e22; }
  .log-row-deprecation { border-left:3px solid #8e44ad; }
  .log-msg-text { font-size:12.5px; color:#333; word-break:break-word; line-height:1.5; }
  .log-meta-links { margin-top:5px; }
  .log-ctx-btn {
    background:none; border:none; padding:0; cursor:pointer;
    color:#C87A3C; font-size:11.5px; text-decoration:underline; font-family:inherit;
  }
  .log-ctx-btn:hover { color:#9A5020; }
  .log-ctx-btn + .log-ctx-btn { margin-left:10px; }
  .log-context-detail {
    display:none; margin-top:6px; background:#f5f5f5; border:1px solid #ebebeb;
    border-radius:3px; padding:8px 10px; font-family:monospace; font-size:11px;
    color:#555; white-space:pre-wrap; word-break:break-all;
  }
  .log-stack-trace {
    max-height:280px; overflow-y:auto; line-height:1.7; color:#444;
  }
  .log-source-ref {
    display:block; margin-top:4px; font-family:monospace; font-size:11px;
    color:#888; word-break:break-all;
  }
  .log-deprecation { background:#f3e5f5; color:#6a1b9a; }
</style>
</head>
<body>

<!-- ── HEADER ── -->
<div style="max-width:2000px;margin:0 auto;padding:34px 200px 0 200px;">
  <div style="display:flex;align-items:center;justify-content:space-between;">
    <a href="/_debug/profiler" style="display:flex;align-items:center;gap:14px;text-decoration:none;cursor:pointer;">
      <div style="width:42px;height:42px;border-radius:50%;background:#C87A3C;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
        ${LOGO_SVG}
      </div>
      <span style="font-size:24px;font-weight:500;color:#222;letter-spacing:-.2px;">OptiCoreJs Profiler</span>
    </a>
    <div style="position:relative;width:340px;">
      <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input placeholder="search on opticorejs.com" disabled style="width:100%;height:42px;padding:0 14px 0 36px;border:1px solid #d8d8d8;border-radius:4px;font-family:${FF};font-size:14px;color:#555;outline:none;background:#fff;cursor:default;opacity:.6;">
    </div>
  </div>
</div>

<!-- ── STATUS BANNER ── -->
<div style="max-width:2000px;margin:22px auto 0 auto;padding:0 200px;">
  <div style="background:${bannerBg};border-radius:6px;border-top:4px solid ${bannerBorder};padding:30px 36px 32px 36px;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${bannerBorder}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="1.1" fill="${bannerBorder}" stroke="none"/></svg>
      <span style="font-size:26px;font-weight:700;color:${bannerCode};">${isError ? "ERROR " : ""}${profile.statusCode}</span>
      <span style="font-size:24px;font-weight:400;color:${bannerMsg};">${escapeHtml(profile.statusMessage)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
      ${methodBadge}
      <span style="font-size:30px;font-weight:400;color:#333;">${escapeHtml(profile.url)}</span>
    </div>
    <div style="display:flex;align-items:center;gap:34px;font-size:16px;color:#777;">
      <span><strong style="color:#555;font-weight:600;">IP:</strong> ${escapeHtml(profile.request.ip)}</span>
      <span><strong style="color:#555;font-weight:600;">Profiled on:</strong> ${fmtDate} at ${fmtTime}</span>
      <span><strong style="color:#555;font-weight:600;">Token:</strong> ${token6}</span>
    </div>
  </div>
</div>

<!-- ── MAIN GRID ── -->
<div style="max-width:2000px;margin:30px auto 0 auto;padding:0 200px 80px 200px;display:grid;grid-template-columns:250px 1fr;gap:40px;">

  <!-- ── SIDEBAR CARD ── -->
  <div>
    <div style="border:1px solid #e3e3e3;border-radius:4px;overflow:hidden;">

      <!-- Search profiles | Latest header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #ececec;">
        <a href="/_debug/profiler" style="display:flex;align-items:center;gap:8px;text-decoration:none;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style="font-size:15px;color:#888;">Search profiles</span>
        </a>
        <a href="/_debug/profiler/latest" style="font-size:15px;color:#C87A3C;text-decoration:none;cursor:pointer;">Latest</a>
      </div>

      <!-- Nav items -->
      ${sidebarItem(ICON_ROUTE, "Request / Response", "request", panel)}
      ${sidebarItem(ICON_PERF, "Performance", "performance", panel)}
      ${sidebarItem(ICON_EXCEPTION, "Exception", "exception", panel,
          hasException ? (profile.statusCode >= 400 ? 1 : logErrors) : 0, true)}
      ${sidebarItem(ICON_LOG, "Logs", "logs", panel,
          profile.logs.length, logErrors > 0)}
      ${sidebarItem(ICON_MAP, "Routes", "routes", panel,
          appRoutes.filter(r => !r.path.startsWith("/_debug") && r.path !== "/").length, false)}
      ${sidebarItem(ICON_ROUTE, "Routing", "routing", panel)}
      ${sidebarItem(ICON_DB, "Database", "database", panel,
          profile.queries.length, false)}
      ${sidebarItem(ICON_CONFIG, "Configuration", "configuration", panel)}

    </div>

    <!-- Profiler settings -->
    <a href="/_debug/profiler" style="display:flex;align-items:center;gap:8px;margin-top:18px;color:#777;text-decoration:none;font-size:15px;">
      ${ICON_SETTINGS_LG}
      Profiler settings
    </a>
  </div>

  <!-- ── CONTENT ── -->
  <div class="pf-content">
    <h1 class="panel-title">${panelLabel[panel]}</h1>
    ${panelContent}
  </div>

</div>

<script>
function filterTable(input) {
  const q = input.value.toLowerCase();
  const wrap = input.closest(".table-wrap");
  if (!wrap) return;
  wrap.querySelectorAll("tbody tr").forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape") location.href = "/_debug/profiler";
});
</script>
</body>
</html>`;
}
