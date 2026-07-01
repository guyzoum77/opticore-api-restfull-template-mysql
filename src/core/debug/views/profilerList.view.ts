import { IRequestProfile } from "../types/debugToolbar.types";
import { escapeHtml } from "./helpers.view";

const FF = `'Montserrat',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`;

const LOGO_SVG = `<svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 2C8.27 2 2 8.27 2 16s6.27 14 14 14 14-6.27 14-14S23.73 2 16 2zm6.7 9.46c-.07 1.83-1.07 2.78-2.05 2.75-.86-.03-1.4-.5-1.34-1.18.05-.62.45-.78.78-1.18.25-.32.31-.58.21-.9-.13-.42-.55-.62-1.1-.6-.93.02-1.55.62-1.49 1.5.04.55.43 1.12.86 1.86l.37.62c.42.83.66 1.36.7 2.04.08 1.27-.78 2.36-2.43 2.41-1.13.04-2.1-.44-2.27-1.26-.12-.57.18-.92.59-1.05.5-.13.86.13.96.65.1.5-.04.66-.04.92.02.42.46.55.92.54.71-.02 1.07-.5 1.05-1.11-.02-.5-.27-.85-.85-1.78l-.31-.5c-.61-1-1.04-1.77-1.07-2.62-.05-1.51 1.05-2.83 3.1-2.9 1.55-.05 2.78.66 2.74 1.56z" fill="#fff"/>
</svg>`;

const ICON_SETTINGS_LG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
const CHEVRON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;

function statusBadge(code: number): string {
    let style: string;
    if (code >= 500 || code >= 400) {
        style = "background:#fbe3e4; color:#c0392b";
    }
    else if (code >= 300) {
        style = "background:#e3edf8; color:#1565c0";
    }
    else {
        style = "background:#e8f4ec; color:#1a7a3c";
    }
    return `<span style="display:inline-block; padding:2px 7px; border-radius:4px; font-size:12px; font-weight:600; ${style}">
                ${code}
            </span>`;
}

function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
}
function fmtClock(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

function tableRow(p: IRequestProfile): string {
    const ip: string = escapeHtml(p.request?.ip ?? "—");
    const token: string = p.token.slice(0, 6);
    return `
    <tr onclick="location.href='/_debug/profiler/${p.token}'" style="border-bottom:1px solid #ececec;cursor:pointer;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
      <td style="padding:8px 12px;">${statusBadge(p.statusCode)}</td>
      <td style="padding:8px 12px; font-size: 12px; color:#333; ">${escapeHtml(p.method)}</td>
      <td style="padding:8px 12px; font-size: 12px; color:#333; max-width:380px; overflow:hidden; text-overflow: ellipsis; white-space:nowrap;" title="${escapeHtml(p.url)}">${escapeHtml(p.url)}</td>
      <td style="padding:8px 12px; font-size: 12px; color:#333; line-height:1.4;white-space:nowrap;">${fmtDate(p.timestamp)}<br><span style="color:#888;font-size:11px;">${fmtClock(p.timestamp)}</span></td>
      <td style="padding:8px 12px;"><a href="/_debug/profiler/${p.token}" onclick="event.stopPropagation()" style="font-size:13px;color:#C87A3C;text-decoration:none;">${token}</a></td>
    </tr>`;
}

function tabHref(
    tab: "requests" | "commands",
    search: string, method: string, status: string, ip: string, token: string, from: string, until: string, limit: number
): string {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (method) params.set("method", method);
    if (status) params.set("status", status);
    if (ip) params.set("ip", ip);
    if (token) params.set("token", token);
    if (from) params.set("from", from);
    if (until) params.set("until", until);
    if (limit !== 10) params.set("limit", String(limit));
    if (tab !== "requests") params.set("tab", tab);
    const qs = params.toString();
    return `/_debug/profiler${qs ? "?" + qs : ""}`;
}

function selectWrap(inner: string): string {
    return `<div style="position:relative;">
      ${inner}
      <span style="position:absolute;right:9px;top:50%;transform:translateY(-50%);pointer-events:none;">${CHEVRON}</span>
    </div>`;
}

function renderSidebar(
    profiles: IRequestProfile[],
    search: string,
    method: string,
    status: string,
    ip: string,
    token: string,
    from: string,
    until: string,
    limit: number
): string {
    const hasProfiles: boolean = profiles.length > 0;
    const FIELD_STYLE  = `width:100%; height:36px; border:1px solid #d0d0d0; border-radius:3px; padding:0 10px; font-family:${FF}; font-size:14px; outline:none; box-sizing:border-box;`;
    const LABEL_STYLE  = `display:block; font-size:13px; font-weight:600; color:#333; margin-bottom:8px;`;
    const SELECT_STYLE: string = FIELD_STYLE + `appearance:none; -webkit-appearance:none; color:#333; background:#fff; cursor:pointer; padding-right:28px;`;
    const DATE_STYLE: string = FIELD_STYLE + `color:#777;cursor:pointer;`;

    const methodOpts: string = ["Any","GET","POST","PUT","DELETE","PATCH","OPTIONS"].map(m =>
        `<option value="${m === "Any" ? "" : m}"${method === (m === "Any" ? "" : m) ? " selected" : ""}>${m}</option>`
    ).join("");
    const limitOpts: string = [10,25,50,100].map((n: number): string =>
        `<option value="${n}"${limit === n ? " selected" : ""}>${n}</option>`
    ).join("");

    return `
    <!-- SIDEBAR CARD -->
    <div>
      <div style="background: #ffffff;
          box-shadow: #e4e4e4 0px 0px 0px 1px;
          border-radius: 5px;
          padding:22px 22px 26px 22px;
      ">

        <!-- Search profiles | Latest -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
          <a href="/_debug/profiler" style="display:flex; align-items:center; gap:8px; text-decoration:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2">
             <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style="font-size:13px; color:#888;">Search profiles</span>
          </a>
          <a href="/_debug/profiler/latest"
           style="font-size:13px; color:#C87A3C;text-decoration:none;cursor:pointer;${!hasProfiles ? "opacity:.4;pointer-events:none;" : ""}">Latest</a>
        </div>

        <form method="get" action="/_debug/profiler">

          <!-- IP -->
          <label style="${LABEL_STYLE}">IP</label>
          <input name="ip" value="${escapeHtml(ip)}" style="${FIELD_STYLE}margin-bottom:20px;">

          <!-- Method + Status -->
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <div style="flex:1;">
              <label style="${LABEL_STYLE}">Method</label>
              ${selectWrap(`<select name="method" style="${SELECT_STYLE}">${methodOpts}</select>`)}
            </div>
            <div style="flex:1;">
              <label style="${LABEL_STYLE}">Status</label>
              <input name="status" value="${escapeHtml(status)}" style="${FIELD_STYLE}" placeholder="">
            </div>
          </div>

          <!-- URL -->
          <label style="${LABEL_STYLE}">URL</label>
          <input name="search" value="${escapeHtml(search)}" style="${FIELD_STYLE}margin-bottom:20px;">

          <!-- Token -->
          <label style="${LABEL_STYLE}">Token</label>
          <input name="token" value="${escapeHtml(token)}" style="width:128px;height:36px;border:1px solid #d0d0d0;border-radius:3px;padding:0 10px;font-family:${FF};font-size:14px;outline:none;margin-bottom:20px;">

          <!-- From -->
          <label style="${LABEL_STYLE}">From</label>
          <div style="margin-bottom:20px;">
            <input type="date" name="from" value="${escapeHtml(from)}" style="${DATE_STYLE}">
          </div>

          <!-- Until -->
          <label style="${LABEL_STYLE}">Until</label>
          <div style="margin-bottom:20px;">
            <input type="date" name="until" value="${escapeHtml(until)}" style="${DATE_STYLE}">
          </div>

          <!-- Results + Search -->
          <label style="${LABEL_STYLE}">Results</label>
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="position:relative;width:74px;">
              <select name="limit" style="${SELECT_STYLE}width:74px;">${limitOpts}</select>
              <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);pointer-events:none;">${CHEVRON}</span>
            </div>
            <button type="submit" style="height:36px;padding:0 18px;border:1px solid #cfcfcf;border-radius:3px;background:#f0f0f0;font-family:${FF};font-size:14px;color:#333;cursor:pointer;">Search</button>
          </div>

        </form>
      </div>

      <!-- Profiler settings -->
      <a href="/_debug/profiler" style="display:flex;align-items:center;gap:8px;margin-top:18px;color:#777;text-decoration:none;font-size:15px;">
        ${ICON_SETTINGS_LG}
        Profiler settings
      </a>
    </div>`;
}

export function renderProfilerList(
    profiles: IRequestProfile[],
    search   = "",
    method   = "",
    status   = "",
    limit    = 10,
    ip       = "",
    token    = "",
    from     = "",
    until    = "",
    tab: "requests" | "commands" = "requests"
): string {
    let filtered = [...profiles];

    if (ip) filtered = filtered.filter(p => (p.request?.ip ?? "").toLowerCase().includes(ip.toLowerCase()));
    if (token) filtered = filtered.filter(p => p.token.toLowerCase().startsWith(token.toLowerCase()));
    if (search) filtered = filtered.filter(p => p.url.toLowerCase().includes(search.toLowerCase()));
    if (method) filtered = filtered.filter(p => p.method === method.toUpperCase());
    if (status) {
        const code = parseInt(status, 10);
        if (code >= 100) filtered = filtered.filter(p => p.statusCode === code);
        else if (code >= 1 && code <= 9) { const prefix = code * 100; filtered = filtered.filter(p => p.statusCode >= prefix && p.statusCode < prefix + 100); }
    }
    if (from) { const ts = new Date(from).getTime(); if (!isNaN(ts)) filtered = filtered.filter(p => p.timestamp >= ts); }
    if (until){ const ts = new Date(until).getTime() + 86399999; if (!isNaN(ts)) filtered = filtered.filter(p => p.timestamp <= ts); }
    filtered = filtered.slice(0, limit);

    const isFiltered = !!(search || method || status || ip || token || from || until);

    const tableBody = filtered.length > 0
        ? filtered.map(tableRow).join("")
        : `<tr><td colspan="6" style="padding:30px 20px;text-align:center;color:#999;font-size:14px;">
             No requests found. Try adjusting your filters.
           </td></tr>`;


    const TH = `text-align:left;padding:10px 14px;font-size:13px;font-weight:600;color:#444;border-top:1px solid #e6e6e6;border-bottom:1px solid #e6e6e6;background:#f5f5f5;`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Profiler</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; }
  body { margin:0; background:#fff; font-family:${FF}; color:#222; -webkit-font-smoothing:antialiased; }
  a { color:#C87A3C; text-decoration:none; }
  a:hover { text-decoration:underline; }
  input:focus, select:focus { border-color:#C87A3C !important; outline:none; }
</style>
</head>
<body>

<!-- ── HEADER ── -->
<div style="max-width:2000px;margin:0 auto;padding:34px 200px 0 200px;">
  <div style="display:flex;align-items:center;justify-content:space-between;">

    <a href="/_debug/profiler" style="display:flex;align-items:center;gap:14px;cursor:pointer;text-decoration:none;">
      <span style="font-weight: 900; 
        font-size: 20px; 
        color:#222; 
        letter-spacing:-.2px; "
      >OptiCoreJs Profiler</span>
    </a>

    <div style="position:relative; width:340px;">
      <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);" width="15" height="15" 
            viewBox="0 0 24 24" fill="none" 
            stroke="#999" stroke-width="2">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input placeholder="search on opticorejs.com" style="width:100%; height:42px; padding:0 14px 0 36px; border:1px solid #d8d8d8; border-radius:4px; font-family:${FF}; font-size:12.5px;color:#555; outline:none;background:#fff;cursor:default;opacity:.6;">
    </div>
  </div>
</div>

<!-- ── PROFILE SEARCH BANNER ── -->
<div style="max-width:2000px; margin:15px auto 0 auto; padding:0 200px;">
  <div style="background:#f5f5f5; border-radius:5px 5px 0 0; padding:16px 36px; border-top:4px solid #737373;">
    <h2 style="margin:0; font-size:22px; font-weight:900; color:#3c3c3c;">Profile Search</h2>
  </div>
</div>

<!-- ── MAIN GRID ── -->
<div
    style="max-width:2000px; margin: 20px auto 0 auto;padding:0 200px 80px 200px;display:grid;grid-template-columns:250px 1fr;gap:20px;">

  ${renderSidebar(profiles, search, method, status, ip, token, from, until, limit)}

  <!-- ── RESULTS ── -->
  <div style="width: 100%">

    <!-- Tabs -->
    <div style="background:#fff;border:1px solid #e3e3e3;border-radius:6px;padding:18px 28px 0 28px;margin-bottom:26px;display:flex;align-items:center;gap:36px;">
      <a href="${tabHref("requests", search, method, status, ip, token, from, until, limit)}" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;">
        <span style="font-family:${FF};font-size:13.5px;font-weight:${tab === "requests" ? 700 : 500};color:${tab === "requests" ? "#222" : "#888"};cursor:pointer;">HTTP Requests</span>
        <span style="display:block;width:100%;height:3px;background:${tab === "requests" ? "#C87A3C" : "transparent"};margin-top:14px;border-radius:2px 2px 0 0;"></span>
      </a>
      <a href="${tabHref("commands", search, method, status, ip, token, from, until, limit)}" style="text-decoration:none;display:flex;flex-direction:column;align-items:center;">
        <span style="font-family:${FF};font-size:13.5px;font-weight:${tab === "commands" ? 700 : 500};color:${tab === "commands" ? "#222" : "#888"};cursor:pointer;">Console Commands</span>
        <span style="display:block;width:100%;height:3px;background:${tab === "commands" ? "#C87A3C" : "transparent"};margin-top:14px;border-radius:2px 2px 0 0;"></span>
      </a>
    </div>

    ${tab === "commands" ? `
    <h2 style="margin:0 0 22px 0;font-size:15px;font-weight:700;color:#222;">Console Commands</h2>

    <div style="border:1px solid #e6e6e6;border-radius:4px;background:#f5f5f5;padding:70px 20px;text-align:center;">
      <div style="font-size:13.5px;color:#999;">No console commands have been executed yet.</div>
    </div>
    ` : `
    <h2 style="margin:0 0 22px 0;font-size:15px;font-weight:700;color:#222;">${filtered.length} result${filtered.length !== 1 ? "s" : ""} found</h2>

    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="${TH}border-radius:4px 0 0 0;">Status</th>
          <th style="${TH}">Method</th>
          <th style="${TH}">URL</th>
          <th style="${TH}">Time</th>
          <th style="${TH}border-radius:0 4px 0 0;">Token</th>
        </tr>
      </thead>
      <tbody>${tableBody}</tbody>
    </table>
    `}

  </div>
</div>

<script>
  ${!isFiltered && tab === "requests" ? "setTimeout(()=>location.reload(),5000);" : ""}
  document.addEventListener("keydown", e=>{
    if(e.key==="r" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName!=="INPUT"){
        location.reload();
    }
  });
</script>
</body>
</html>`;
}