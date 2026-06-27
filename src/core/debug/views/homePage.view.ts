export interface IHomePageOptions {
    appVersion: string;
    nodeVersion: string;
    npmVersion: string;
    environment: string;
    port: string | number;
    host: string;
    showToolbar: boolean;
    cacheInstalled: boolean;
    gatewayInstalled: boolean;
}

function toolbarScript(appVersion: string, nodeVersion: string, npmVersion: string, environment: string, cacheInstalled: boolean, gatewayInstalled: boolean): string {
    return `
<script>
(function() {
    let lastToken = null;
    let lastProfile = null;
    let lastProfilerUrl = '/_debug/profiler';
    let isCollapsed = false;

    // ── collapse / expand ──────────────────────────────────────────────────
    window.wdtCollapse = function() {
        isCollapsed = true;
        document.getElementById('wdt-toolbar').style.display = 'none';
        document.getElementById('wdt-mini').style.display  = 'flex';
        wdtTtHide();
    };
    window.wdtExpand = function() {
        isCollapsed = false;
        document.getElementById('wdt-mini').style.display    = 'none';
        document.getElementById('wdt-toolbar').style.display = 'flex';
    };

    // ── tooltip system ─────────────────────────────────────────────────────
    const TT  = document.getElementById('wdt-tt');
    let ttTimer = null;

    function wdtTtShow(anchor, html) {
        clearTimeout(ttTimer);
        TT.innerHTML = html;
        TT.style.display = 'block';

        // Position above the anchor element
        const rect = anchor.getBoundingClientRect();
        const ttRect = TT.getBoundingClientRect();
        let left = rect.left;
        // clamp so tooltip doesn't go off right edge
        if (left + ttRect.width > window.innerWidth - 8) {
            left = window.innerWidth - ttRect.width - 8;
        }
        TT.style.left   = left + 'px';
        TT.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
        TT.style.top    = 'auto';
    }
    function wdtTtHide() {
        ttTimer = setTimeout(() => { TT.style.display = 'none'; }, 80);
    }
    window.wdtTtHide = wdtTtHide;

    // Keep visible when mouse is over the tooltip itself
    TT.addEventListener('mouseenter', () => clearTimeout(ttTimer));
    TT.addEventListener('mouseleave', wdtTtHide);

    // ── tooltip content builders ───────────────────────────────────────────
    function row(label, value, valueClass) {
        return '<div class="tt-row"><span class="tt-label">' + label + '</span><span class="tt-val' + (valueClass ? ' ' + valueClass : '') + '">' + value + '</span></div>';
    }
    function badge(text, color) {
        return '<span class="tt-badge" style="background:' + color + '">' + text + '</span>';
    }
    function sep()  { return '<div class="tt-sep"></div>'; }
    function link(href, label, icon) {
        return '<a class="tt-link" href="' + href + '" target="_blank">' + (icon||'') + ' ' + label + '</a>';
    }

    function ttStatus(p) {
        const sc = p.statusCode;
        const ok = sc < 400;
        return row('Profile token', '<code>' + p.token + '</code>') +
               row('Method',  badge(p.method, '#1565c0')) +
               row('URL',     '<code style="word-break:break-all">' + p.url + '</code>') +
               row('Status',  badge(sc + ' ' + statusMsg(sc), ok ? '#2e7d32' : '#c0392b')) +
               sep() +
               row('Duration', fmtDuration(p.duration)) +
               row('Profiler', '<a href="' + lastProfilerUrl + '" style="color:#D4884A">Open →</a>');
    }
    function ttDuration(p) {
        const sqlMs = p.sqlCount > 0 ? '~' + p.duration + ' ms' : '0 ms';
        const appMs = p.duration;
        return row('Total time',   '<b>' + fmtDuration(appMs) + '</b>') +
               row('Application',  fmtDuration(appMs)) +
               row('Database',     sqlMs) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=performance" style="color:#D4884A">Performance →</a>');
    }
    function ttMemory(p) {
        const mu = p.memoryUsage;
        return row('Heap used',  fmtMemory(mu)) +
               row('Node PID',  '' + (window._wdt_pid || '—')) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=performance" style="color:#D4884A">Performance →</a>');
    }
    function ttLogs(p) {
        return row('Total logs', p.logCount) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=logs" style="color:#D4884A">Logs →</a>');
    }
    function ttSql(p) {
        return row('Queries',    p.sqlCount) +
               row('Total time', p.sqlCount > 0 ? '—' : '0 ms') +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=database" style="color:#D4884A">Database →</a>');
    }
    function ttRoute(p) {
        return row('Method', badge(p.method, '#1565c0')) +
               row('URL',    '<code>' + p.url + '</code>') +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=routing" style="color:#D4884A">Routing →</a>');
    }
    // hover sur "v1.0.0" → ancienne vue : versions + docs
    function ttVersion() {
        const env = '${environment}';
        const envOk = env !== 'production';
        return row('OptiCoreJs',  badge('v${appVersion}', '#3D1E08')) +
               row('Node.js',     badge('${nodeVersion}', '#1b3d1a')) +
               row('npm',         badge('v${npmVersion}', '#3d2200')) +
               row('Environment', badge(env, envOk ? '#1a3320' : '#3d0a0a')) +
               sep() +
               link('/_debug/profiler', 'Open Profiler', '📊') +
               link('https://github.com/guyzoum77/opticore-api-restfull-template-mysql', 'Documentation', '📖') +
               link('https://github.com/guyzoum77/opticore-api-restfull-template-mysql/issues', 'Help & Support', '❓');
    }

    // hover sur "Server" → runtime + status packages + services
    function ttServer() {
        const env = '${environment}';
        const envOk = env !== 'production';
        const cacheOk   = ${cacheInstalled};
        const gatewayOk = ${gatewayInstalled};
        const pkgBadge  = (ok) => ok
            ? '<span class="tt-badge" style="background:#2e7d32">Enabled</span>'
            : '<span class="tt-badge" style="background:#444;color:#888">not installed</span>';
        return row('Node.js',             badge('${nodeVersion}', '#1b3d1a')) +
               row('npm',                 badge('v${npmVersion}', '#3d2200')) +
               row('Environment',         badge(env, envOk ? '#1a3320' : '#3d0a0a')) +
               sep() +
               link('/_debug/profiler',   'Opticore Profiler',   '📊') +
               row('Opticore Cache',       pkgBadge(cacheOk)) +
               row('Opticore API Gateway', pkgBadge(gatewayOk)) +
               sep() +
               '<div style="padding:4px 14px 2px;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.8px;">Services</div>' +
               link('#docker-compose',                        'Docker Compose', '🐳') +
               link('/_debug/profiler?panel=configuration',  'Env Vars',       '⚙️') +
               link('http://localhost:15672',                 'RabbitMQ UI',    '🐇') +
               link('http://localhost:8025',                  'Webmail',        '📧') +
               link('http://localhost:8001',                  'Redis',          '🔴');
    }

    // map data-tt → builder
    const ttBuilders = {
        status:   () => lastProfile ? ttStatus(lastProfile)   : row('Status', 'No request yet'),
        duration: () => lastProfile ? ttDuration(lastProfile) : row('Duration', 'No request yet'),
        memory:   () => lastProfile ? ttMemory(lastProfile)   : row('Memory', 'No request yet'),
        logs:     () => lastProfile ? ttLogs(lastProfile)     : row('Logs', 'No request yet'),
        sql:      () => lastProfile ? ttSql(lastProfile)      : row('SQL', 'No request yet'),
        route:    () => lastProfile ? ttRoute(lastProfile)    : row('Route', 'No request yet'),
        version:  () => ttVersion(),
        server:   () => ttServer(),
    };

    /**
    * attach hover listeners to all [data-tt] elements
    * 
    * */
    document.querySelectorAll('[data-tt]').forEach(el => {
        el.addEventListener('mouseenter', function() {
            const key = this.getAttribute('data-tt');
            const builder = ttBuilders[key];
            if (builder) wdtTtShow(this, builder());
        });
        el.addEventListener('mouseleave', wdtTtHide);
    });

    function fmtDuration(ms) {
        return ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(2) + ' s';
    }
    function fmtMemory(bytes) {
        return (Math.max(0, bytes) / 1024 / 1024).toFixed(1) + ' MiB';
    }
    function statusClass(code) {
        if (code >= 500) return 's-error';
        if (code >= 400) return 's-warn';
        if (code >= 300) return 's-redirect';
        return 's-ok';
    }
    function statusBg(code) {
        if (code >= 500 || code >= 400) return '#c0392b';
        if (code >= 300) return '#1565c0';
        return '#2e7d32';
    }
    const STATUS_MSGS = {200:'OK',201:'Created',204:'No Content',301:'Moved',302:'Found',304:'Not Modified',400:'Bad Request',401:'Unauthorized',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',409:'Conflict',422:'Unprocessable',429:'Too Many Requests',500:'Internal Server Error',502:'Bad Gateway',503:'Service Unavailable'};
    function statusMsg(code) { return STATUS_MSGS[code] || 'Unknown'; }

    function updateToolbar(p) {
        lastProfile     = p;
        lastProfilerUrl = '/_debug/profiler/' + p.token;

        const badge = document.getElementById('tb-status');
        if (badge) {
            badge.textContent = p.statusCode;
            badge.className   = 'tb-badge tb-badge--' + statusClass(p.statusCode);
            badge.href        = lastProfilerUrl;
        }

        const dur = document.getElementById('tb-duration');
        if (dur) { dur.textContent = fmtDuration(p.duration); dur.href = lastProfilerUrl + '?panel=performance'; }

        const mem = document.getElementById('tb-memory');
        if (mem) { mem.textContent = fmtMemory(p.memoryUsage); mem.href = lastProfilerUrl + '?panel=performance'; }

        const sql = document.getElementById('tb-sql');
        if (sql) { sql.textContent = p.sqlCount > 0 ? p.sqlCount + ' SQL' : '0 SQL'; sql.href = lastProfilerUrl + '?panel=database'; }

        const logs = document.getElementById('tb-logs');
        if (logs) { logs.textContent = p.logCount + ' logs'; logs.href = lastProfilerUrl + '?panel=logs'; }

        const route = document.getElementById('tb-route');
        if (route) {
            route.textContent = p.method + ' ' + (p.url.length > 40 ? p.url.slice(0,40)+'…' : p.url);
            route.href        = lastProfilerUrl + '?panel=routing';
        }

        const profLink = document.getElementById('tb-profiler-link');
        if (profLink) profLink.href = lastProfilerUrl;

        const bar = document.getElementById('tb-time-bar');
        if (bar) bar.style.width = Math.min(p.duration / 2, 100) + '%';

        // update mini badge too
        const miniStatus = document.getElementById('wdt-mini-status');
        if (miniStatus) {
            miniStatus.textContent = p.statusCode;
            miniStatus.style.background = statusBg(p.statusCode);
        }
        const miniLink = document.getElementById('wdt-mini-link');
        if (miniLink) miniLink.href = lastProfilerUrl;

        // pulse
        const toolbar = document.getElementById('wdt-toolbar');
        if (toolbar && !isCollapsed) {
            toolbar.classList.add('tb-pulse');
            setTimeout(() => toolbar.classList.remove('tb-pulse'), 400);
        }
        const mini = document.getElementById('wdt-mini');
        if (mini && isCollapsed) {
            mini.classList.add('tb-pulse');
            setTimeout(() => mini.classList.remove('tb-pulse'), 400);
        }
    }

    async function fetchLatest() {
        try {
            const res  = await fetch('/_debug/api/profiles');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.profiles || data.profiles.length === 0) return;
            const p = data.profiles[0];
            if (p.token === lastToken) return;
            lastToken = p.token;
            updateToolbar(p);
        } catch(e) {}
    }

    fetchLatest();
    setInterval(fetchLatest, 2000);
})();
</script>`;
}

function toolbarHtml(appVersion: string, nodeVersion: string, npmVersion: string, environment: string, cacheInstalled: boolean, gatewayInstalled: boolean): string {
    return `
<!-- ===== WEB DEBUG TOOLBAR ===== -->
<style>
  /* ── full toolbar bar ── */
  #wdt-toolbar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
    height: 36px; background: #1b1b1b;
    border-top: 1px solid #2e2e2e;
    display: flex; align-items: stretch;
    box-shadow: 0 -3px 14px rgba(0,0,0,.55);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 12px; overflow: hidden;
    transition: opacity .2s;
  }
  #wdt-toolbar.tb-pulse { opacity: .65; }
  .tb-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 12px; font-weight: 700; font-size: 12px; color: #fff;
    text-decoration: none; height: 100%; flex-shrink: 0;
    transition: opacity .15s; min-width: 52px;
  }
  .tb-badge:hover { opacity: .8; }
  .tb-badge--s-ok       { background: #2e7d32; }
  .tb-badge--s-warn     { background: #c0392b; }
  .tb-badge--s-error    { background: #c0392b; }
  .tb-badge--s-redirect { background: #1565c0; }
  .tb-badge--s-default  { background: #444; }
  .tb-block {
    display: flex; align-items: center; gap: 5px;
    padding: 0 11px; color: #bbb; text-decoration: none;
    white-space: nowrap; height: 100%;
    transition: background .15s, color .15s;
    flex-shrink: 0; border-left: 1px solid #2e2e2e;
  }
  .tb-block:hover { background: #252525; color: #fff; text-decoration: none; }
  .tb-icon { color: #666; display: flex; align-items: center; }
  .tb-block:hover .tb-icon { color: #999; }
  .tb-time-wrap { position: relative; }
  .tb-time-bar {
    position: absolute; bottom: 0; left: 0; height: 2px;
    background: #C87A3C; width: 0%; transition: width .4s;
  }
  .tb-spacer { flex: 1; }
  .tb-brand {
    display: flex; align-items: center; gap: 8px;
    padding: 0 14px; color: #ccc; text-decoration: none;
    border-left: 1px solid #2e2e2e; height: 100%; font-weight: 500;
  }
  .tb-brand:hover { background: #252525; text-decoration: none; }
  .tb-brand-icon {
    width: 20px; height: 20px; background: #C87A3C; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 900; color: #fff;
  }
  .tb-version {
    display: flex; align-items: center; padding: 0 10px;
    color: #666; font-size: 11px;
    border-left: 1px solid #2e2e2e; height: 100%; white-space: nowrap;
  }
  .tb-collapse {
    display: flex; align-items: center; justify-content: center;
    width: 36px; color: #555; cursor: pointer;
    border: none; background: none;
    border-left: 1px solid #2e2e2e; height: 100%;
    font-size: 13px; transition: background .15s, color .15s;
    flex-shrink: 0;
  }
  .tb-collapse:hover { background: #333; color: #ccc; }
  .tb-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #22c55e; display: inline-block;
    box-shadow: 0 0 4px #16a34a; animation: tb-blink 2s infinite;
  }
  @keyframes tb-blink { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* ── tooltip popover ── */
  #wdt-tt {
    display: none;
    position: fixed;
    z-index: 100000;
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 10px 0 6px;
    min-width: 240px;
    max-width: 340px;
    box-shadow: 0 8px 28px rgba(0,0,0,.7);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 12px;
    pointer-events: auto;
  }
  /* arrow at the bottom */
  #wdt-tt::after {
    content: '';
    position: absolute;
    bottom: -6px; left: 20px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #333;
  }
  .tt-row {
    display: flex; align-items: baseline;
    padding: 3px 14px; gap: 8px; line-height: 1.6;
  }
  .tt-label {
    color: #666; font-size: 11px; white-space: nowrap;
    min-width: 90px; flex-shrink: 0;
  }
  .tt-val {
    color: #d4d4d4; font-size: 12px; word-break: break-all;
  }
  .tt-val code {
    background: #111; border: 1px solid #2a2a2a; padding: 1px 5px;
    border-radius: 3px; font-size: 11px; color: #aaa;
  }
  .tt-badge {
    display: inline-flex; align-items: center;
    padding: 1px 7px; border-radius: 10px;
    font-size: 10px; font-weight: 700; color: #fff;
  }
  .tt-sep {
    height: 1px; background: #2a2a2a; margin: 6px 0;
  }
  .tt-link {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 14px; color: #D4884A; font-size: 12px;
    text-decoration: none; transition: background .1s;
  }
  .tt-link:hover { background: #252525; color: #E09A5A; }

  /* ── collapsed mini button (bottom-right) ── */
  #wdt-mini {
    position: fixed; bottom: 12px; right: 12px; z-index: 99999;
    display: none;
    align-items: center; gap: 0;
    background: #1b1b1b;
    border: 1px solid #333;
    border-radius: 24px;
    box-shadow: 0 4px 18px rgba(0,0,0,.6);
    overflow: hidden;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    transition: box-shadow .2s, opacity .2s;
  }
  #wdt-mini:hover { box-shadow: 0 6px 24px rgba(0,0,0,.8); }
  #wdt-mini.tb-pulse { opacity: .65; }

  /* the "OP" logo pill inside mini */
  #wdt-mini-logo {
    display: flex; align-items: center; gap: 7px;
    padding: 0 12px 0 10px; height: 34px;
    border-right: 1px solid #2a2a2a;
    color: #ccc; font-size: 12px; font-weight: 500;
  }
  #wdt-mini-logo-icon {
    width: 22px; height: 22px; background: #C87A3C; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 900; color: #fff; flex-shrink: 0;
  }

  /* status badge inside mini */
  #wdt-mini-status {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 10px; height: 34px;
    font-size: 12px; font-weight: 700; color: #fff;
    background: #444; border-right: 1px solid #2a2a2a;
    min-width: 44px; text-decoration: none;
    transition: opacity .15s;
  }
  #wdt-mini-status:hover { opacity: .85; }

  /* expand arrow */
  #wdt-mini-expand {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 34px;
    color: #555; font-size: 13px;
    border: none; background: none; cursor: pointer;
    transition: color .15s;
  }
  #wdt-mini-expand:hover { color: #ccc; }
</style>

<!-- full bar -->
<div id="wdt-toolbar">
  <a id="tb-status" href="/_debug/profiler" class="tb-badge tb-badge--s-default" data-tt="status">—</a>

  <a id="tb-duration" href="/_debug/profiler" class="tb-block tb-time-wrap" data-tt="duration">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
    <span>—</span>
    <span class="tb-time-bar" id="tb-time-bar"></span>
  </a>

  <a id="tb-memory" href="/_debug/profiler" class="tb-block" data-tt="memory">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></span>
    <span>—</span>
  </a>

  <a id="tb-logs" href="/_debug/profiler" class="tb-block" data-tt="logs">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
    <span>0 logs</span>
  </a>

  <a id="tb-sql" href="/_debug/profiler" class="tb-block" data-tt="sql">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></span>
    <span>0 SQL</span>
  </a>

  <a id="tb-route" href="/_debug/profiler" class="tb-block" data-tt="route">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>
    <span>waiting…</span>
  </a>

  <div class="tb-spacer"></div>

  <span class="tb-block" style="gap:6px;cursor:default;border-left:none;">
    <span class="tb-dot"></span>
    <span style="color:#666;font-size:11px;">Live</span>
  </span>

  <a id="tb-profiler-link" href="/_debug/profiler" class="tb-brand" title="Open Profiler" data-tt="server">
    <div class="tb-brand-icon">OP</div>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
    &nbsp;Server
  </a>

  <div class="tb-version" data-tt="version">v${appVersion}</div>

  <!-- collapse button — shrinks to mini pill, does NOT remove -->
  <button class="tb-collapse" onclick="wdtCollapse()" title="Minimize toolbar">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
  </button>
</div>

<!-- mini collapsed button (bottom-right) -->
<div id="wdt-mini">
  <a id="wdt-mini-link" href="/_debug/profiler" id="wdt-mini-logo" style="text-decoration:none;">
    <div id="wdt-mini-logo-inner" style="display:flex;align-items:center;gap:7px;padding:0 12px 0 10px;height:34px;border-right:1px solid #2a2a2a;color:#ccc;font-size:12px;font-weight:500;">
      <div id="wdt-mini-logo-icon" style="width:22px;height:22px;background:#C87A3C;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;flex-shrink:0;">OP</div>
      <span style="color:#888;font-size:11px;">Profiler</span>
    </div>
  </a>
  <a id="wdt-mini-status" href="/_debug/profiler" style="display:inline-flex;align-items:center;justify-content:center;padding:0 10px;height:34px;font-size:12px;font-weight:700;color:#fff;background:#444;border-right:1px solid #2a2a2a;min-width:44px;text-decoration:none;">—</a>
  <button id="wdt-mini-expand" onclick="wdtExpand()" title="Expand toolbar" style="display:flex;align-items:center;justify-content:center;width:32px;height:34px;color:#555;font-size:13px;border:none;background:none;cursor:pointer;">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
  </button>
</div>

<!-- floating tooltip -->
<div id="wdt-tt"></div>

${toolbarScript(appVersion, nodeVersion, npmVersion, environment, cacheInstalled, gatewayInstalled)}`;
}

export function renderHomePage(opts: IHomePageOptions): string {
    const { appVersion, nodeVersion, npmVersion, environment, port, host, showToolbar, cacheInstalled, gatewayInstalled } = opts;
    const isProd = environment === "production";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs API Server</title>
<style>
  :root {
    --bg:     #F5EFE0;
    --card:   #FFFCF7;
    --border: #E0D8CA;
    --text:   #1A1A14;
    --muted:  #7A7268;
    --accent: #C87A3C;
    --ok:     #2D6A4A;
    --warn:   #C87A3C;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px; line-height: 1.6;
  }
  body { padding-bottom: ${showToolbar ? "44px" : "0"}; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* ===== CANVAS PARTICLES ===== */
  #op-canvas {
    position: fixed; inset: 0;
    width: 100%; height: 100%;
    z-index: 0; pointer-events: none;
  }

  /* ===== WAVES ===== */
  .op-waves {
    position: fixed; top: 0; left: 0; right: 0;
    height: 500px; z-index: 1;
    pointer-events: none; overflow: hidden;
  }
  .op-wave {
    position: absolute; top: 0; left: 0;
    width: 200%; height: 100%;
    transform-origin: top left;
    will-change: transform;
  }
  /*
   * 3 animations distinctes :
   *  - vitesses très différentes  → effet parallaxe 3D
   *  - animation-delay décalé     → phases jamais alignées
   *  - wave-3 tourne en sens inverse → accentue la profondeur
   */
  .op-wave-1 { animation: op-wave-slow 16s ease-in-out infinite; }
  .op-wave-2 { animation: op-wave-mid  11s ease-in-out -4s infinite; }
  .op-wave-3 { animation: op-wave-fast  7s ease-in-out -2s infinite reverse; }

  @keyframes op-wave-slow {
    0%,100% { transform: translateX(0)    scaleY(1);    }
    50%     { transform: translateX(-25%) scaleY(.96);  }
  }
  @keyframes op-wave-mid {
    0%,100% { transform: translateX(0)    scaleY(1);    }
    50%     { transform: translateX(-25%) scaleY(1.04); }
  }
  @keyframes op-wave-fast {
    0%,100% { transform: translateX(0)    scaleY(1);    }
    50%     { transform: translateX(-25%) scaleY(.98);  }
  }

  /* ===== LAYOUT ===== */
  .page {
    position: relative; z-index: 2;
    min-height: 100%;
    display: flex; flex-direction: column;
    align-items: center;
    /* contenu commence juste sous le bas des vagues */
    padding: 430px 24px 48px;
  }
  .container { width: 100%; max-width: 860px; }

  /* ===== HEADER ===== */
  .hero { text-align: center; margin-bottom: 48px; }
  .hero-logo {
    display: inline-flex; align-items: center; gap: 14px;
    margin-bottom: 20px;
  }
  .hero-icon {
    width: 52px; height: 52px; background: var(--accent);
    border-radius: 14px; display: flex; align-items: center;
    justify-content: center; font-size: 22px; font-weight: 900; color: #fff;
    box-shadow: 0 4px 18px rgba(200,122,60,.30);
  }
  .hero-name { font-size: 28px; font-weight: 700; color: var(--text); }
  .hero-sub { font-size: 13px; color: var(--muted); letter-spacing: .5px; text-transform: uppercase; }
  .hero-desc { color: var(--muted); font-size: 14px; margin-top: 8px; }

  /* ===== STATUS PILL ===== */
  .status-row {
    display: flex; align-items: center; justify-content: center;
    gap: 8px; margin-bottom: 36px;
  }
  .status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EBF5EF; border: 1px solid #A8D5B8;
    color: var(--ok); padding: 5px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--ok); animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(45,106,74,.35)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(45,106,74,0)} }
  .env-pill {
    display: inline-flex; align-items: center;
    background: ${isProd ? "#FDECEA" : "#FDF3EA"};
    border: 1px solid ${isProd ? "#E57373" : "#D4884A"};
    color: ${isProd ? "#C62828" : "#9A5020"};
    padding: 5px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px;
  }

  /* ===== CARDS ===== */
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 28px; }
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 18px 20px;
    transition: border-color .2s, box-shadow .2s;
  }
  .card:hover { border-color: #C8B8A4; box-shadow: 0 2px 12px rgba(200,122,60,.10); }
  .card-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
  .card-value { font-size: 17px; font-weight: 600; color: var(--text); font-family: monospace; }
  .card-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* ===== SECTION ===== */
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px;
    color: var(--muted); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::after { content:""; flex:1; height:1px; background:var(--border); }

  /* ===== QUICK LINKS ===== */
  .quick-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
  .quick-link {
    display: flex; align-items: center; gap: 10px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px;
    color: var(--text); text-decoration: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .quick-link:hover { border-color: var(--accent); background: #FDF3EA; color: var(--text); box-shadow: 0 2px 10px rgba(200,122,60,.12); text-decoration: none; }
  .quick-link-icon {
    width: 32px; height: 32px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .quick-link-label { font-size: 13px; font-weight: 500; }
  .quick-link-desc { font-size: 11px; color: var(--muted); }

  /* ===== API NOTICE ===== */
  .api-notice {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; padding: 20px 24px;
    display: flex; align-items: flex-start; gap: 14px;
  }
  .api-notice-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
  .api-notice-title { font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .api-notice-body { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .api-notice-body code {
    background: #F0EBE1; border: 1px solid #D8D0C4; padding: 1px 6px;
    border-radius: 3px; font-size: 12px; color: #6A5A48; font-family: monospace;
  }

  /* ===== FOOTER ===== */
  .footer { margin-top: 40px; text-align: center; color: var(--muted); font-size: 12px; padding-bottom: 8px; }
  .footer a { color: var(--accent); }
</style>
</head>
<body>
<div class="page">
  <div class="container">

    <!-- HERO -->
    <div class="hero">
      <div class="hero-logo">
        <div class="hero-icon">OP</div>
        <div>
          <div class="hero-name">OptiCoreJs</div>
          <div class="hero-sub">API REST Server</div>
        </div>
      </div>
      <div class="hero-desc">Your server is up and running. Start making requests to your API endpoints.</div>
    </div>

    <!-- STATUS -->
    <div class="status-row">
      <div class="status-pill">
        <span class="status-dot"></span>
        Running on port ${port}
      </div>
      <div class="env-pill">${environment}</div>
    </div>

    <!-- CARDS -->
    <div class="cards">
      <div class="card">
        <div class="card-label">Host</div>
        <div class="card-value">${host}:${port}</div>
        <div class="card-sub">API base URL</div>
      </div>
      <div class="card">
        <div class="card-label">Node.js</div>
        <div class="card-value">${nodeVersion}</div>
        <div class="card-sub">Runtime version</div>
      </div>
      <div class="card">
        <div class="card-label">App version</div>
        <div class="card-value">v${appVersion}</div>
        <div class="card-sub">opticore-template-mysqldb</div>
      </div>
      <div class="card">
        <div class="card-label">Environment</div>
        <div class="card-value" style="color:${isProd ? "#C62828" : "#9A5020"}">${environment}</div>
        <div class="card-sub">NODE_ENV</div>
      </div>
    </div>

    ${showToolbar ? `
    <!-- PROFILER QUICK LINKS -->
    <div class="section">
      <div class="section-title">Web Debug Toolbar</div>
      <div class="quick-links">
        <a href="/_debug/profiler" class="quick-link">
          <div class="quick-link-icon" style="background:#FDE8D4;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8924A" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <div class="quick-link-label">Request Profiler</div>
            <div class="quick-link-desc">All captured requests</div>
          </div>
        </a>
        <a href="/_debug/toolbar" class="quick-link">
          <div class="quick-link-icon" style="background:#FDE8D4;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C87A3C" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div>
            <div class="quick-link-label">Toolbar View</div>
            <div class="quick-link-desc">Latest request bar</div>
          </div>
        </a>
        <a href="/_debug/api/profiles" class="quick-link">
          <div class="quick-link-icon" style="background:#E8F5EE;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div>
            <div class="quick-link-label">Profiles API</div>
            <div class="quick-link-desc">JSON — all profiles</div>
          </div>
        </a>
      </div>
    </div>` : ""}

    <!-- API NOTICE -->
    <div class="section">
      <div class="section-title">Getting Started</div>
      <div class="api-notice">
        <div class="api-notice-icon">🚀</div>
        <div>
          <div class="api-notice-title">REST API is ready</div>
          <div class="api-notice-body">
            This is a REST API server — no UI routes are defined by default.
            Test your endpoints with <code>GET http://${host}:${port}/users</code> or use a client like Postman, Insomnia, or curl.
            ${showToolbar ? `Each API response includes <code>X-Debug-Token</code> and <code>X-Debug-Token-Link</code> headers pointing to the profiler.` : ""}
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      OptiCoreJs &mdash; Built with Node.js ${nodeVersion} &mdash; <a href="/_debug/profiler">Open Profiler</a>
    </div>

  </div>
</div>

<!-- ░░ CANVAS particules sable/désert ░░ -->
<canvas id="op-canvas" aria-hidden="true"></canvas>

<!--
  ░░ VAGUES SVG ░░
  • Bord PLAT au sommet (y=0) — le bas de chaque vague est une courbe qui descend.
  • 3 couches à profondeurs très différentes pour qu'on distingue clairement chacune :
      Vague 1 (derrière, orange foncé)  : arches entre y=195 ↔ y=470
      Vague 2 (milieu, orange moyen)    : arches entre y=130 ↔ y=370
      Vague 3 (devant, orange pâle)     : arches entre y= 60 ↔ y=260
  • Phase décalée via animation-delay + sens inverse sur la vague 3.
-->
<div class="op-waves" aria-hidden="true">

  <!-- ══ Vague 1 — ARRIÈRE, orange foncé #B86A28, la plus profonde ══ -->
  <svg class="op-wave op-wave-1" xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 2880 500" preserveAspectRatio="none">
    <path d="
      M    0,0 L 2880,0
      L 2880,360
      C 2640,470  2400,470  2160,360
      C 1920,195  1680,195  1440,360
      C 1200,470   960,470   720,360
      C  480,195   240,195     0,360
      Z"
      fill="#E8AA68" fill-opacity="0.38"/>
  </svg>

  <!-- ══ Vague 2 — MILIEU, orange vif #D4844A, profondeur intermédiaire ══ -->
  <svg class="op-wave op-wave-2" xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 2880 500" preserveAspectRatio="none">
    <path d="
      M    0,0 L 2880,0
      L 2880,265
      C 2640,375  2400,375  2160,265
      C 1920,130  1680,130  1440,265
      C 1200,375   960,375   720,265
      C  480,130   240,130     0,265
      Z"
      fill="#F0BE80" fill-opacity="0.32"/>
  </svg>

  <!-- ══ Vague 3 — AVANT, orange pâle #F5CC90, la plus haute (en premier plan) ══ -->
  <svg class="op-wave op-wave-3" xmlns="http://www.w3.org/2000/svg"
       viewBox="0 0 2880 500" preserveAspectRatio="none">
    <path d="
      M    0,0 L 2880,0
      L 2880,165
      C 2640,265  2400,265  2160,165
      C 1920, 60  1680, 60  1440,165
      C 1200,265   960,265   720,165
      C  480, 60   240, 60     0,165
      Z"
      fill="#F8D8A8" fill-opacity="0.45"/>
  </svg>

</div>

<!-- ░░ SCRIPT particules désert ░░ -->
<script>
(function() {
  var cv = document.getElementById('op-canvas');
  var cx = cv.getContext('2d');
  var W, H;

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* palette sable / poussière du désert */
  var COLORS = [
    '#F5D5A0','#F0C080','#E8A860','#D4884A',
    '#C87A3C','#F5E0B8','#E0AA70','#F8E8C8'
  ];

  /* génère une particule */
  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.2 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.45 + 0.15,
      /* vitesse : chute lente + dérive latérale (vent du désert) */
      vy: Math.random() * 0.55 + 0.18,
      vx: (Math.random() - 0.38) * 0.30,
      /* oscillation sinusoïdale */
      wobble: Math.random() * Math.PI * 2,
      ws:     Math.random() * 0.018 + 0.004,
      wa:     Math.random() * 0.6 + 0.2,
    };
  }

  var N = 220;
  var pts = [];
  for (var i = 0; i < N; i++) pts.push(mkParticle());

  function tick() {
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < N; i++) {
      var p = pts[i];
      p.wobble += p.ws;
      p.x += p.vx + Math.sin(p.wobble) * p.wa * 0.25;
      p.y += p.vy;

      /* recycle en haut quand hors écran */
      if (p.y > H + 6)  { p.y = -6;  p.x = Math.random() * W; }
      if (p.x >  W + 6) { p.x = -6; }
      if (p.x < -6)     { p.x = W + 6; }

      cx.save();
      cx.globalAlpha = p.alpha;
      cx.fillStyle   = p.color;
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, 6.283);
      cx.fill();
      cx.restore();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();
</script>

${showToolbar ? toolbarHtml(appVersion, nodeVersion, npmVersion, environment, cacheInstalled, gatewayInstalled) : ""}
</body>
</html>`;
}
