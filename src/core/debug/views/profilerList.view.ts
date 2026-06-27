import { IRequestProfile } from "../types/debugToolbar.types";
import {
    statusClass, formatDuration, formatMemory, formatTimestamp,
    sqlTotalTime, escapeHtml,
    ICON_LOG, ICON_DB, ICON_PERF, ICON_ROUTE, ICON_CONFIG, ICON_EXCEPTION
} from "./helpers.view";

const ICON_LIST = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`;
const ICON_SETTINGS = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`;

const LIST_CSS = `
  :root {
    --bg:#F5EFE0; --card:#FFFCF7; --border:#E0D8CA; --text:#1A1A14;
    --muted:#7A7268; --accent:#C87A3C; --hover:#FDF3EA;
    --ok:#2D6A4A; --warn:#C0392B; --redirect:#1565c0;
    --sidebar-w:240px; --header-h:56px;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; background:var(--bg); color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; font-size:13px; }
  a { color:var(--accent); text-decoration:none; }
  a:hover { text-decoration:underline; }

  /* ── HEADER ── */
  .pf-header {
    position:sticky; top:0; z-index:100; height:var(--header-h);
    background:var(--card); border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:14px; padding:0 20px;
    box-shadow:0 1px 4px rgba(200,122,60,.07);
  }
  .pf-logo { display:flex; align-items:center; gap:9px; font-weight:700; font-size:14px; color:var(--text); text-decoration:none; }
  .pf-logo:hover { text-decoration:none; }
  .pf-logo-icon {
    width:26px; height:26px; background:#C87A3C; border-radius:5px;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:900; color:#fff; flex-shrink:0;
  }
  .pf-logo-sub { font-size:11px; color:var(--muted); font-weight:400; }
  .pf-spacer { flex:1; }
  .pf-header-search {
    background:#F0EBE1; border:1px solid var(--border); color:var(--text);
    padding:5px 11px; border-radius:4px; font-size:12px; width:200px; outline:none;
  }
  .pf-header-search:focus { border-color:var(--accent); }
  .pf-header-search::placeholder { color:#A09888; }

  /* ── BODY LAYOUT ── */
  .pf-body { display:flex; height:calc(100vh - var(--header-h)); overflow:hidden; }

  /* ── SIDEBAR ── */
  .pf-sidebar {
    width:var(--sidebar-w); flex-shrink:0;
    background:var(--card); border-right:1px solid var(--border);
    display:flex; flex-direction:column; overflow-y:auto;
  }

  /* Tabs: Search profiles | Latest */
  .pf-tabs { display:flex; border-bottom:1px solid var(--border); flex-shrink:0; }
  .pf-tab {
    flex:1; padding:11px 4px; text-align:center;
    font-size:12px; color:var(--muted); text-decoration:none;
    border-bottom:2px solid transparent; transition:color .1s,background .1s;
    white-space:nowrap;
  }
  .pf-tab:hover { background:var(--hover); color:var(--text); text-decoration:none; }
  .pf-tab.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }
  .pf-tab.disabled { opacity:.4; pointer-events:none; }

  /* Filter form */
  .pf-filter { padding:14px 14px 10px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .pf-field { margin-bottom:10px; }
  .pf-field:last-of-type { margin-bottom:0; }
  .pf-label {
    display:block; font-size:10.5px; font-weight:600;
    text-transform:uppercase; letter-spacing:.4px;
    color:var(--muted); margin-bottom:4px;
  }
  .pf-input, .pf-select {
    width:100%; background:#F0EBE1; border:1px solid var(--border);
    color:var(--text); padding:6px 9px; border-radius:4px; font-size:12px;
    outline:none; font-family:inherit;
  }
  .pf-input:focus, .pf-select:focus { border-color:var(--accent); background:#FDF7F0; }
  .pf-select { cursor:pointer; }
  .pf-row2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .pf-search-btn {
    width:100%; margin-top:12px; padding:7px;
    background:var(--accent); color:#fff; border:none;
    border-radius:4px; font-size:12.5px; font-weight:600;
    cursor:pointer; transition:opacity .15s;
  }
  .pf-search-btn:hover { opacity:.88; }

  /* Footer */
  .pf-sidebar-footer {
    margin-top:auto; padding:12px 14px;
    font-size:11.5px; color:var(--muted);
    border-top:1px solid var(--border);
    display:flex; align-items:center; gap:6px;
  }
  .pf-sidebar-footer a { color:var(--muted); display:flex; align-items:center; gap:5px; }
  .pf-sidebar-footer a:hover { color:var(--accent); text-decoration:none; }

  /* ── CONTENT ── */
  .pf-content { flex:1; overflow-y:auto; padding:28px 32px; }
  .pf-results-title {
    font-size:22px; font-weight:600; color:var(--text); margin-bottom:20px;
  }
  .pf-results-title span { color:var(--accent); }

  /* ── TABLE ── */
  .tbl-wrap { overflow-x:auto; border-radius:5px; border:1px solid var(--border); background:var(--card); }
  table { width:100%; border-collapse:collapse; }
  thead th {
    background:#F0EBE1; padding:9px 12px; text-align:left;
    font-size:11px; font-weight:600; text-transform:uppercase;
    letter-spacing:.5px; color:var(--muted); border-bottom:1px solid var(--border);
    white-space:nowrap;
  }
  tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
  tbody tr:last-child { border-bottom:none; }
  tbody tr:hover { background:var(--hover); }
  td { padding:9px 12px; vertical-align:middle; font-size:12px; }
  .mono { font-family:"SF Mono",Consolas,monospace; }
  .muted { color:var(--muted); }
  .center { text-align:center; }
  .url-cell { max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; }

  /* ── BADGES ── */
  .status-badge { display:inline-block; padding:2px 8px; border-radius:3px; font-size:11px; font-weight:700; color:#fff; }
  .status-badge.s-ok       { background:var(--ok); }
  .status-badge.s-warn     { background:var(--warn); }
  .status-badge.s-error    { background:var(--warn); }
  .status-badge.s-redirect { background:var(--redirect); }
  .count-badge {
    display:inline-flex; align-items:center; justify-content:center;
    background:#E8E0D4; color:#5A5040; border-radius:10px;
    font-size:11px; font-weight:600; min-width:20px; height:20px; padding:0 5px;
  }
  .count-badge.err { background:#c62828; color:#fff; }
  .open-link {
    background:#FDF3EA; border:1px solid #D4884A; padding:2px 9px;
    border-radius:3px; font-size:11px; color:#9A5020; white-space:nowrap;
  }
  .open-link:hover { background:#F5E6D4; border-color:var(--accent); text-decoration:none; }

  /* empty */
  .pf-empty { text-align:center; padding:56px 24px; color:var(--muted); }
  .pf-empty-icon { font-size:40px; margin-bottom:14px; }
  .pf-empty-text { font-size:14px; }
`;

function methodBadge(method: string): string {
    const colors: Record<string, string> = {
        GET: "#2e7d32", POST: "#1565c0", PUT: "#e65100",
        DELETE: "#c62828", PATCH: "#6a1b9a", OPTIONS: "#424242"
    };
    const bg = colors[method] ?? "#424242";
    return `<span style="background:${bg};color:#fff;padding:2px 7px;border-radius:3px;font-size:11px;font-weight:700;">${method}</span>`;
}

function row(p: IRequestProfile): string {
    const sqlCount = p.queries.length;
    const logCount = p.logs.length;
    const hasError = logCount > 0 && p.logs.some(l => l.level === "error" || l.level === "critical");

    return `
    <tr onclick="location.href='/_debug/profiler/${p.token}'" style="cursor:pointer;">
      <td><span class="status-badge ${statusClass(p.statusCode)}">${p.statusCode}</span></td>
      <td>${methodBadge(p.method)}</td>
      <td class="url-cell mono" title="${escapeHtml(p.url)}">${escapeHtml(p.url)}</td>
      <td class="mono">${formatDuration(p.duration)}</td>
      <td class="mono">${formatMemory(p.memoryUsage)}</td>
      <td class="center">${sqlCount > 0 ? `<span class="count-badge">${sqlCount}</span>` : `<span class="muted">—</span>`}</td>
      <td class="center">${logCount > 0 ? `<span class="count-badge${hasError ? " err" : ""}">${logCount}</span>` : `<span class="muted">—</span>`}</td>
      <td class="mono muted" style="font-size:11px;">${formatTimestamp(p.timestamp)}</td>
      <td><a href="/_debug/profiler/${p.token}" class="open-link">Open</a></td>
    </tr>`;
}

function renderSidebar(
    profiles: IRequestProfile[],
    search: string, method: string, status: string, limit: number
): string {
    const latest = profiles[0] ?? null;
    const latestUrl = latest ? `/_debug/profiler/${latest.token}` : null;

    const methodOpts = ["Any", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].map(m =>
        `<option value="${m === "Any" ? "" : m}"${method === (m === "Any" ? "" : m) ? " selected" : ""}>${m}</option>`
    ).join("");

    const statusOpts = [
        { v: "", l: "Any" },
        { v: "2", l: "2xx Success" },
        { v: "3", l: "3xx Redirect" },
        { v: "4", l: "4xx Client Error" },
        { v: "5", l: "5xx Server Error" },
    ].map(({ v, l }) =>
        `<option value="${v}"${status === v ? " selected" : ""}>${l}</option>`
    ).join("");

    const limitOpts = [10, 25, 50, 100].map(n =>
        `<option value="${n}"${limit === n ? " selected" : ""}>${n}</option>`
    ).join("");

    return `
    <aside class="pf-sidebar">
      <div class="pf-tabs">
        <a class="pf-tab active" href="/_debug/profiler">Search profiles</a>
        <a class="pf-tab${latestUrl ? "" : " disabled"}" href="${latestUrl ?? "#"}">Latest</a>
      </div>

      <form class="pf-filter" method="get" action="/_debug/profiler">
        <div class="pf-field">
          <label class="pf-label">URL</label>
          <input type="text" name="search" class="pf-input" placeholder="contains…" value="${escapeHtml(search)}">
        </div>
        <div class="pf-row2">
          <div class="pf-field">
            <label class="pf-label">Method</label>
            <select name="method" class="pf-select">${methodOpts}</select>
          </div>
          <div class="pf-field">
            <label class="pf-label">Status</label>
            <select name="status" class="pf-select">${statusOpts}</select>
          </div>
        </div>
        <div class="pf-field">
          <label class="pf-label">Max results</label>
          <select name="limit" class="pf-select">${limitOpts}</select>
        </div>
        <button type="submit" class="pf-search-btn">Search</button>
      </form>

      <div class="pf-sidebar-footer">
        ${ICON_SETTINGS}
        <a href="/_debug/profiler">Profiler settings</a>
      </div>
    </aside>`;
}

export function renderProfilerList(
    profiles: IRequestProfile[],
    search = "",
    method = "",
    status = "",
    limit = 50
): string {
    let filtered = profiles;

    if (search) {
        filtered = filtered.filter(p =>
            p.url.toLowerCase().includes(search.toLowerCase()) ||
            p.method.toLowerCase().includes(search.toLowerCase()) ||
            String(p.statusCode).includes(search)
        );
    }
    if (method) {
        filtered = filtered.filter(p => p.method === method.toUpperCase());
    }
    if (status) {
        const prefix = parseInt(status, 10) * 100;
        filtered = filtered.filter(p => p.statusCode >= prefix && p.statusCode < prefix + 100);
    }
    filtered = filtered.slice(0, limit);

    const latest = profiles[0] ?? null;
    const latestUrl = latest ? `/_debug/profiler/${latest.token}` : null;

    const tableRows = filtered.length > 0
        ? filtered.map(row).join("")
        : `<tr><td colspan="9">
             <div class="pf-empty">
               <div class="pf-empty-icon">📭</div>
               <div class="pf-empty-text">No requests found. Try adjusting your filters.</div>
             </div>
           </td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Profiler</title>
<style>${LIST_CSS}</style>
</head>
<body>

<!-- HEADER -->
<header class="pf-header">
  <a href="/_debug/profiler" class="pf-logo">
    <div class="pf-logo-icon">OP</div>
    <div>
      <div>OptiCoreJs Profiler</div>
      <div class="pf-logo-sub">Web Debug Toolbar</div>
    </div>
  </a>
  <div class="pf-spacer"></div>
  <input type="text" class="pf-header-search" placeholder="Search on symfony.com…" disabled style="opacity:.4;cursor:default;">
</header>

<!-- BODY -->
<div class="pf-body">

  ${renderSidebar(profiles, search, method, status, limit)}

  <!-- CONTENT -->
  <main class="pf-content">
    <div class="pf-results-title">
      <span>${filtered.length}</span> result${filtered.length !== 1 ? "s" : ""} found
    </div>

    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Method</th>
            <th>URL</th>
            <th>Time</th>
            <th>Memory</th>
            <th>SQL</th>
            <th>Logs</th>
            <th>Profiled at</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  </main>

</div>

<script>
  ${!search && !method && !status ? "setTimeout(() => location.reload(), 5000);" : ""}
  document.addEventListener("keydown", e => { if (e.key === "r" && !e.ctrlKey && !e.metaKey) location.reload(); });
</script>
</body>
</html>`;
}
