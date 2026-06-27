import { IRequestProfile, ISqlQuery, ILogEntry } from "../types/debugToolbar.types";
import { IRegisteredRoute } from "../debugToolbar.module";
import {
    statusClass, formatDuration, formatMemory, formatTimestamp,
    sqlTotalTime, escapeHtml,
    ICON_CLOCK, ICON_MEMORY, ICON_DB, ICON_ROUTE,
    ICON_LOG, ICON_PERF, ICON_CONFIG, ICON_EXCEPTION, ICON_CLOSE, ICON_MAP
} from "./helpers.view";

type Panel = "request" | "performance" | "logs" | "routing" | "configuration" | "database" | "exception" | "routes";

const BASE_CSS = `
  :root {
    --bg:#F5EFE0; --sidebar-bg:#FFFCF7; --content-bg:#F5EFE0;
    --border:#E0D8CA; --header-bg:#FFFCF7;
    --text:#1A1A14; --muted:#7A7268; --link:#C87A3C; --accent:#C87A3C;
    --hover:#FDF3EA; --active-bg:#FDF3EA; --active-border:#C87A3C;
    --ok-bg:#EBF5EF; --ok-text:#2D6A4A;
    --warn-bg:#FDECEA; --warn-text:#C0392B;
    --info-bg:#FDF3EA; --info-text:#9A5020;
    --sidebar-w:220px; --header-h:100px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,monospace; font-size:13px; line-height:1.5; }
  a { color:var(--link); text-decoration:none; }
  a:hover { text-decoration:underline; }
  code, pre { font-family:"SF Mono",Consolas,"Liberation Mono",monospace; }

  /* HEADER */
  .pf-header {
    position:sticky; top:0; z-index:50;
    background:var(--header-bg);
    border-bottom:1px solid var(--border);
    padding:14px 24px 0;
    box-shadow:0 2px 10px rgba(200,122,60,.08);
  }
  .pf-header-top {
    display:flex; align-items:center; gap:14px; margin-bottom:12px;
  }
  .pf-logo {
    display:flex; align-items:center; gap:8px; font-weight:700; color:var(--text);
  }
  .pf-logo-icon {
    width:24px; height:24px; background:#C87A3C;
    border-radius:5px; display:flex; align-items:center; justify-content:center;
    font-size:10px; font-weight:900; color:#fff; flex-shrink:0;
  }
  .pf-header-title { font-size:13px; color:var(--muted); }
  .pf-spacer { flex:1; }
  .pf-search {
    background:#F0EBE1; border:1px solid var(--border); color:var(--text);
    padding:5px 12px; border-radius:4px; font-size:12px; width:200px; outline:none;
  }
  .pf-search:focus { border-color:#C87A3C; }
  .pf-search::placeholder { color:#A09888; }
  .pf-back { background:#FDF3EA; border:1px solid #D4884A; color:#9A5020; padding:5px 12px; border-radius:4px; font-size:12px; }
  .pf-back:hover { background:#F5E6D4; border-color:#C87A3C; text-decoration:none; }

  /* STATUS BAR */
  .pf-status-bar {
    display:flex; align-items:center; gap:12px;
    padding:10px 0;
    border-top:1px solid var(--border);
    font-size:12px;
  }
  .pf-status-pill {
    padding:4px 12px; border-radius:4px;
    font-weight:700; font-size:12px; color:#fff;
  }
  .pf-status-pill.s-ok       { background:#2D6A4A; border:1px solid #4A9A6A; }
  .pf-status-pill.s-warn     { background:#C0392B; border:1px solid #E05040; }
  .pf-status-pill.s-error    { background:#C0392B; border:1px solid #E05040; }
  .pf-status-pill.s-redirect { background:#1565c0; border:1px solid #2980b9; }
  .pf-status-method {
    font-family:monospace; font-size:12px; font-weight:700;
    color:#fff; background:#6A5A48; padding:4px 8px; border-radius:3px;
  }
  .pf-status-url { font-family:monospace; font-size:13px; color:var(--text); }
  .pf-status-meta { color:var(--muted); font-size:11px; margin-left:auto; white-space:nowrap; }

  /* LAYOUT */
  .pf-body { display:flex; height:calc(100vh - var(--header-h)); }

  /* SIDEBAR */
  .pf-sidebar {
    width:var(--sidebar-w); flex-shrink:0;
    background:var(--sidebar-bg);
    border-right:1px solid var(--border);
    overflow-y:auto;
    display:flex; flex-direction:column;
  }
  .pf-sidebar-section { padding:8px 0; border-bottom:1px solid var(--border); }
  .pf-sidebar-item {
    display:flex; align-items:center; gap:8px;
    padding:9px 16px;
    color:var(--muted);
    text-decoration:none;
    font-size:12.5px;
    transition:all .1s;
    border-left:3px solid transparent;
  }
  .pf-sidebar-item svg { flex-shrink:0; }
  .pf-sidebar-item:hover { background:var(--hover); color:var(--text); text-decoration:none; border-left-color:#C8B8A4; }
  .pf-sidebar-item.active { background:var(--active-bg); color:#7A3A10; border-left-color:var(--active-border); font-weight:600; }
  .pf-sidebar-badge {
    margin-left:auto; background:#C0392B; color:#fff;
    border-radius:10px; font-size:10px; font-weight:700;
    min-width:18px; height:18px; display:inline-flex;
    align-items:center; justify-content:center; padding:0 4px;
  }
  .pf-sidebar-badge.ok { background:#2D6A4A; }
  .pf-sidebar-badge.warn { background:#C87A3C; }
  .pf-sidebar-footer {
    margin-top:auto; padding:12px 14px;
    font-size:11.5px; color:var(--muted); border-top:1px solid var(--border);
    display:flex; align-items:center; gap:6px;
  }
  .pf-sidebar-footer a { color:var(--muted); display:flex; align-items:center; gap:5px; }
  .pf-sidebar-footer a:hover { color:#C87A3C; text-decoration:none; }

  /* SIDEBAR TABS */
  .pf-sidebar-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
  .pf-sidebar-tab {
    flex:1; padding:10px 6px; text-align:center;
    font-size:11.5px; color:var(--muted); text-decoration:none;
    border-bottom:2px solid transparent; transition:all .12s;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .pf-sidebar-tab:hover { background:var(--hover); color:var(--text); text-decoration:none; }
  .pf-sidebar-tab--active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; background:#F8F2E8; }

  /* CONTENT */
  .pf-content { flex:1; overflow-y:auto; padding:24px; }

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
  .perf-metric-unit { font-size:16px; font-weight:400; color:var(--muted); }

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
</style>`;

function sidebarItem(icon: string, label: string, panel: Panel, active: Panel, badge?: number, badgeClass?: string): string {
    const isActive = panel === active;
    const badgeHtml = badge != null && badge > 0
        ? `<span class="pf-sidebar-badge ${badgeClass ?? ""}">${badge}</span>`
        : "";
    return `<a href="?panel=${panel}" class="pf-sidebar-item${isActive ? " active" : ""}">
        ${icon} ${label}${badgeHtml}
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
    if (entries.length === 0) return `<div style="color:#555;font-style:italic;padding:10px 0;font-size:12px;">${emptyLabel}</div>`;
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
    <div class="panel-title" style="font-size:18px;margin-bottom:22px;">Performance metrics</div>

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
        <div class="panel-title">${ICON_LOG} Logs</div>
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">No log entries were recorded for this request.</div>
          <div style="font-size:12px;color:#555;margin-top:8px;">
            Use <code>logCollector.record(token, { level, message })</code> to add entries.
          </div>
        </div>`;
    }

    const countByLevel: Record<string, number> = {};
    logs.forEach(l => { countByLevel[l.level] = (countByLevel[l.level] ?? 0) + 1; });

    return `
    <div class="panel-title">${ICON_LOG} Logs</div>

    <div class="stats-grid">
      ${Object.entries(countByLevel).map(([level, count]) =>
        `<div class="stat-card">
          <div class="stat-value">${count}</div>
          <div class="stat-label">${level}</div>
        </div>`
      ).join("")}
    </div>

    <div class="table-wrap">
      <div class="table-wrap-title">${ICON_LOG} Log Entries <span class="badge badge-info">${logs.length}</span></div>
      ${logs.map((l: ILogEntry) => `
        <div class="log-entry">
          <span class="log-level log-${l.level}">${l.level}</span>
          <div style="flex:1;">
            <div class="log-msg">${escapeHtml(l.message)}</div>
            ${l.context && Object.keys(l.context).length > 0
                ? `<div class="log-context">${escapeHtml(JSON.stringify(l.context, null, 2))}</div>`
                : ""}
          </div>
          <span class="log-time">${new Date(l.timestamp).toLocaleTimeString()}</span>
        </div>`
      ).join("")}
    </div>`;
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
      <div style="font-weight:700;font-size:14px;color:#e74c3c;margin-bottom:6px;">
        ${ICON_EXCEPTION} HTTP ${profile.statusCode} — ${escapeHtml(profile.statusMessage)}
      </div>
      <div style="font-family:monospace;font-size:12px;color:#999;">
        ${escapeHtml(profile.method)} ${escapeHtml(profile.url)}
      </div>
    </div>` : ""}
    ${errLogs.map(l => `
    <div style="background:#1e1a1a;border:1px solid #c62828;border-radius:6px;padding:14px 18px;margin-bottom:12px;">
      <div style="font-weight:700;font-size:13px;color:#e74c3c;margin-bottom:8px;">${escapeHtml(l.level.toUpperCase())}</div>
      <pre style="font-size:13px;color:#e0e0e0;white-space:pre-wrap;">${escapeHtml(l.message)}</pre>
      ${l.context ? `<pre class="json-pre" style="margin-top:10px;">${escapeHtml(JSON.stringify(l.context, null, 2))}</pre>` : ""}
    </div>`).join("")}
    `}`;
}

function panelRoutes(routes: IRegisteredRoute[]): string {
    if (routes.length === 0) {
        return `
        <div class="panel-title" style="font-size:18px;margin-bottom:22px;">${ICON_MAP} Routes</div>
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
        if (rows.length === 0) return `<div style="padding:16px;color:var(--muted);font-size:12px;text-align:center;">None</div>`;
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
    <div class="panel-title" style="font-size:18px;margin-bottom:22px;">${ICON_MAP} Routes</div>

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
    const logErrors = profile.logs.filter(l => l.level === "error" || l.level === "critical").length;
    const logWarnings = profile.logs.filter(l => l.level === "warning").length;
    const hasException = profile.statusCode >= 400 || logErrors > 0;

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

    const token8 = profile.token.slice(0, 8);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Profiler — ${profile.method} ${profile.url}</title>
${BASE_CSS}
</head>
<body>

<!-- HEADER -->
<div class="pf-header">
  <div class="pf-header-top">
    <a href="/_debug/profiler" class="pf-logo" style="text-decoration:none;">
      <div class="pf-logo-icon">OP</div>
      <div>
        <div>OptiCoreJs Profiler</div>
        <div class="pf-header-title">Web Debug Toolbar</div>
      </div>
    </a>
    <div class="pf-spacer"></div>
    <form method="get" action="/_debug/profiler">
      <input type="text" name="search" class="pf-search" placeholder="Search profiles…">
    </form>
    <a href="/_debug/profiler" class="pf-back">← All requests</a>
  </div>

  <div class="pf-status-bar">
    <div class="pf-status-pill ${statusClass(profile.statusCode)}">
      ${hasException ? "ERROR " : ""}${profile.statusCode} ${escapeHtml(profile.statusMessage)}
    </div>
    <span class="pf-status-method">${escapeHtml(profile.method)}</span>
    <span class="pf-status-url">${escapeHtml(profile.url)}</span>
    <span class="pf-status-meta">
      IP: ${escapeHtml(profile.request.ip)} &nbsp;|&nbsp;
      Profiled on: ${formatTimestamp(profile.timestamp)} &nbsp;|&nbsp;
      Token: ${token8}
    </span>
  </div>
</div>

<!-- BODY -->
<div class="pf-body">

  <!-- SIDEBAR -->
  <div class="pf-sidebar">
    <div class="pf-sidebar-tabs">
      <a class="pf-sidebar-tab" href="/_debug/profiler">Search profiles</a>
      <a class="pf-sidebar-tab pf-sidebar-tab--active" href="?panel=${panel}">Latest</a>
    </div>
    <div class="pf-sidebar-section">
      ${sidebarItem(ICON_ROUTE, "Request / Response", "request", panel)}
      ${sidebarItem(ICON_PERF, "Performance", "performance", panel)}
      ${sidebarItem(ICON_EXCEPTION, "Exception", "exception", panel,
          hasException ? (profile.statusCode >= 400 ? 1 : logErrors) : 0, "warn")}
      ${sidebarItem(ICON_LOG, "Logs", "logs", panel,
          profile.logs.length,
          logErrors > 0 ? "warn" : logWarnings > 0 ? "warn" : "ok")}
      ${sidebarItem(ICON_MAP, "Routes", "routes", panel,
          appRoutes.filter(r => !r.path.startsWith("/_debug") && r.path !== "/").length, "ok")}
      ${sidebarItem(ICON_ROUTE, "Routing", "routing", panel)}
      ${sidebarItem(ICON_DB, "Database", "database", panel,
          profile.queries.length, "ok")}
      ${sidebarItem(ICON_CONFIG, "Configuration", "configuration", panel)}
    </div>

    <div class="pf-sidebar-footer">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
      <a href="/_debug/profiler">Profiler settings</a>
    </div>
  </div>

  <!-- CONTENT -->
  <div class="pf-content">
    ${panelContent}
  </div>

</div>

<script>
function filterTable(input) {
  const query = input.value.toLowerCase();
  const wrap = input.closest(".table-wrap");
  if (!wrap) return;
  wrap.querySelectorAll("tbody tr").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? "" : "none";
  });
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape") location.href = "/_debug/profiler";
});
</script>
</body>
</html>`;
}
