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
    let recentProfiles = [];
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
    function sep()  { 
        return '<div class="tt-sep"></div>'; 
    }
    function link(href, label, icon, imgSRC=null, imageAltName=null) {
        const iconHtml = icon ? icon : (imgSRC ? '<img src="' + imgSRC + '" alt="' + (imageAltName || '') + '">' : '');
        return '<a class="tt-link" href="' + href + '" target="_blank">' + iconHtml + ' ' + label + '</a>';
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
               row('Profiler', '<a href="' + lastProfilerUrl + '" style="color:#FAC68E">Open →</a>');
    }
    function ttDuration(p) {
        const sqlMs = p.sqlCount > 0 ? '~' + p.duration + ' ms' : '0 ms';
        const appMs = p.duration;
        return row('Total time',   '<b>' + fmtDuration(appMs) + '</b>') +
               row('Application',  fmtDuration(appMs)) +
               row('Database',     sqlMs) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=performance" style="color:#FAC68E">Performance →</a>');
    }
    function ttMemory(p) {
        const mu = p.memoryUsage;
        return row('Heap used',  fmtMemory(mu)) +
               row('Node PID',  '' + (window._wdt_pid || '—')) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=performance" style="color:#FAC68E">Performance →</a>');
    }
    function ttLogs(p) {
        var errors = p.logErrors || 0;
        var warnings = p.logWarnings || 0;
        var deprecations = p.logDeprecations || 0;
        var errVal = errors > 0 ? badge(errors, '#c0392b') : '<span style="color:#555;">0</span>';
        var warnVal = warnings > 0 ? badge(warnings, '#e67e22') : '<span style="color:#555;">0</span>';
        var deprVal = deprecations > 0 ? badge(deprecations, '#8e44ad') : '<span style="color:#555;">0</span>';
        return '<div style="padding:6px 14px 8px;font-size:10px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid #2a2a2a;">Logger</div>' +
               row('Errors', errVal) +
               row('Warnings', warnVal) +
               row('Deprecations', deprVal) +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=logs" style="color:#FAC68E">Logs →</a>');
    }
    function ttHttp() {
        if (recentProfiles.length === 0) {
            return row('Requests', 'No requests yet');
        }
        const last10 = recentProfiles.slice(0, 10);
        const rows = last10.map(function(p) {
            const m = p.method.toLowerCase();
            const sc = p.statusCode;
            const sClass = sc >= 400 ? 'http-tt-s-err' : sc >= 300 ? 'http-tt-s-redir' : 'http-tt-s-ok';
            const url = p.url.length > 38 ? p.url.slice(0, 35) + '…' : p.url;
            return '<tr>' +
                '<td><span class="http-tt-method http-tt-m-' + m + '">' + p.method + '</span></td>' +
                '<td><a href="/_debug/profiler/' + p.token + '" class="http-tt-url">' + url + '</a></td>' +
                '<td class="' + sClass + '">' + sc + '</td>' +
                '<td class="http-tt-dur">' + fmtDuration(p.duration) + '</td>' +
                '</tr>';
        }).join('');
        return '<div class="http-tt-head">' +
            '<span class="http-tt-head-title">Last ' + last10.length + ' HTTP Requests</span>' +
            '<a href="/_debug/profiler" class="http-tt-head-link">View all →</a>' +
            '</div>' +
            '<table class="http-tt-table">' +
            '<thead><tr><th>Method</th><th>URL</th><th>Status</th><th>Time</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>';
    }
    function ttRoute(p) {
        return row('Method', badge(p.method, '#1565c0')) +
               row('URL',    '<code>' + p.url + '</code>') +
               sep() +
               row('Profiler', '<a href="' + lastProfilerUrl + '?panel=routing" style="color:#FAC68E">Routing →</a>');
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
               link('#docker-compose',                        'Docker Compose', '<svg width="16" height="13" viewBox="0 0 340 268" xmlns="http://www.w3.org/2000/svg"><path fill="#2560ff" d="M334,110.1c-8.3-5.6-30.2-8-46.1-3.7-.9-15.8-9-29.2-24-40.8l-5.5-3.7-3.7,5.6c-7.2,11-10.3,25.7-9.2,39,.8,8.2,3.7,17.4,9.2,24.1-20.7,12-39.8,9.3-124.3,9.3H0c-.4,19.1,2.7,55.8,26,85.6,2.6,3.3,5.4,6.5,8.5,9.6,19,19,47.6,32.9,90.5,33,65.4,0,121.4-35.3,155.5-120.8,11.2.2,40.8,2,55.3-26,.4-.5,3.7-7.4,3.7-7.4l-5.5-3.7h0ZM85.2,92.7h-36.7v36.7h36.7v-36.7ZM132.6,92.7h-36.7v36.7h36.7v-36.7ZM179.9,92.7h-36.7v36.7h36.7v-36.7ZM227.3,92.7h-36.7v36.7h36.7v-36.7ZM37.8,92.7H1.1v36.7h36.7v-36.7ZM85.2,46.3h-36.7v36.7h36.7v-36.7ZM132.6,46.3h-36.7v36.7h36.7v-36.7ZM179.9,46.3h-36.7v36.7h36.7v-36.7ZM179.9,0h-36.7v36.7h36.7V0Z"/></svg>') +
               link('/_debug/profiler?panel=configuration',   'Env Vars',       '<svg width="16" height="13" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 600 600"><path fill="currentColor" d="M600 0v600H0V0zM273.3 397.3H171v138h105V512h-77.1v-37.6H268v-23.2h-69v-30.6h74.4zm53.7 0h-27.1v138h25.9v-90l55.6 90h28v-138h-26v92.1zm127.9 0h-30.2l49.3 138h29.8l49.4-138h-29.6l-33.8 102zM135 492H93v42h42z"/></svg>️') +
               link('http://localhost:15672',                 'RabbitMQ UI',    '<svg width="16" height="13" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#ff6600" d="M119.517 51.188H79.291a3.641 3.641 0 0 1-3.64-3.642V5.62A5.605 5.605 0 0 0 70.028 0H55.66a5.606 5.606 0 0 0-5.627 5.62v41.646a3.913 3.913 0 0 1-3.92 3.925l-13.188.047c-2.176 0-3.972-1.75-3.926-3.926l.094-41.687A5.606 5.606 0 0 0 23.467 0H9.1a5.61 5.61 0 0 0-5.626 5.625V122.99c0 2.737 2.22 5.01 5.01 5.01h111.033a5.014 5.014 0 0 0 5.008-5.011V56.195a4.975 4.975 0 0 0-5.008-5.007zM100.66 95.242a6.545 6.545 0 0 1-6.525 6.524H82.791a6.545 6.545 0 0 1-6.523-6.524V83.9a6.545 6.545 0 0 1 6.523-6.524h11.343a6.545 6.545 0 0 1 6.525 6.523zm0 0"/></svg>') +
               link('http://localhost:8025',                  'Webmail',        '📧') +
               link('http://localhost:8001',                  'Redis',          '<svg width="16" height="13" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path fill="#A41E11" d="M121.8 93.1c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.9-11.5 3.8-17.3 1S13 98.1 6.3 94.9c-3.3-1.6-5-2.9-5-4.2V78s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c0 1.3-1.5 2.7-4.9 4.4z"/><path fill="#D82C20" d="M121.8 80.5C115.1 84 80.4 98.2 73 102.1c-7.4 3.9-11.5 3.8-17.3 1-5.8-2.8-42.7-17.7-49.4-20.9C-.3 79-.5 76.8 6 74.3c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 72.5C115.1 76 80.4 90.2 73 94.1c-7.4 3.8-11.5 3.8-17.3 1C49.9 92.3 13 77.4 6.3 74.2c-3.3-1.6-5-2.9-5-4.2V57.3s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9V68c0 1.3-1.5 2.7-4.9 4.5z"/><path fill="#D82C20" d="M121.8 59.8c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 79.6 13 64.7 6.3 61.5s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.9z"/><path fill="#A41E11" d="M121.8 51c-6.7 3.5-41.4 17.7-48.8 21.6-7.4 3.8-11.5 3.8-17.3 1C49.9 70.9 13 56 6.3 52.8c-3.3-1.6-5.1-2.9-5.1-4.2V35.9s48-10.5 55.8-13.2c7.8-2.8 10.4-2.9 17-.5s46.1 9.5 52.6 11.9v12.5c.1 1.3-1.4 2.6-4.8 4.4z"/><path fill="#D82C20" d="M121.8 38.3C115.1 41.8 80.4 56 73 59.9c-7.4 3.8-11.5 3.8-17.3 1S13 43.3 6.3 40.1s-6.8-5.4-.3-7.9c6.5-2.6 43.2-17 51-19.7 7.8-2.8 10.4-2.9 17-.5s41.1 16.1 47.6 18.5c6.7 2.4 6.9 4.4.2 7.8z"/><path fill="#fff" d="M80.4 26.1l-10.8 1.2-2.5 5.8-3.9-6.5-12.5-1.1 9.3-3.4-2.8-5.2 8.8 3.4 8.2-2.7L72 23zM66.5 54.5l-20.3-8.4 29.1-4.4z"/><ellipse fill="#fff" cx="38.4" cy="35.4" rx="15.5" ry="6"/><path fill="#7A0C00" d="M93.3 27.7l17.2 6.8-17.2 6.8z"/><path fill="#AD2115" d="M74.3 35.3l19-7.6v13.6l-1.9.8z"/></svg>');

    }

    // map data-tt → builder
    const ttBuilders = {
        status:   () => lastProfile ? ttStatus(lastProfile)   : row('Status', 'No request yet'),
        duration: () => lastProfile ? ttDuration(lastProfile) : row('Duration', 'No request yet'),
        memory:   () => lastProfile ? ttMemory(lastProfile)   : row('Memory', 'No request yet'),
        logs:     () => lastProfile ? ttLogs(lastProfile)     : row('Logs', 'No request yet'),
        http:     () => ttHttp(),
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

    function updateToolbar(p, animate) {
        lastProfile     = p;
        lastProfilerUrl = '/_debug/profiler/' + p.token;

        const badge = document.getElementById('tb-status');
        if (badge) {
            badge.textContent = p.statusCode;
            badge.className   = 'tb-badge tb-badge--' + statusClass(p.statusCode);
            badge.href        = lastProfilerUrl;
        }

        const dur = document.getElementById('tb-duration');
        if (dur) {
            var durSpan = dur.querySelectorAll('span')[1];
            if (durSpan) durSpan.textContent = fmtDuration(p.duration);
            dur.href = lastProfilerUrl + '?panel=performance';
        }

        const mem = document.getElementById('tb-memory');
        if (mem) {
            var memSpan = mem.querySelector('span:last-child');
            if (memSpan) memSpan.textContent = fmtMemory(p.memoryUsage);
            mem.href = lastProfilerUrl + '?panel=performance';
        }

        const http = document.getElementById('tb-http');
        if (http) {
            const cnt = recentProfiles.length;
            const textSpan = http.querySelector('span:last-child');
            if (textSpan) textSpan.textContent = cnt + ' request' + (cnt !== 1 ? 's' : '');
            http.href = lastProfilerUrl;
        }

        const logsEl = document.getElementById('tb-logs');
        if (logsEl) {
            logsEl.href = lastProfilerUrl + '?panel=logs';
            var logsSpan = logsEl.querySelector('span:last-child');
            if (logsSpan) logsSpan.textContent = (p.logCount || 0) + ' logs';
            // error badge pill — add/update/remove based on error count
            var existingPill = logsEl.querySelector('.tb-err-pill');
            var errCount = p.logErrors || 0;
            if (errCount > 0) {
                if (!existingPill) {
                    existingPill = document.createElement('span');
                    existingPill.className = 'tb-err-pill';
                    logsEl.appendChild(existingPill);
                }
                existingPill.textContent = errCount;
            } else if (existingPill) {
                existingPill.parentNode.removeChild(existingPill);
            }
        }

        const route = document.getElementById('tb-route');
        if (route) {
            var routeSpan = route.querySelector('span:last-child');
            if (routeSpan) routeSpan.textContent = p.method + ' ' + (p.url.length > 40 ? p.url.slice(0,40)+'…' : p.url);
            route.href = lastProfilerUrl + '?panel=routing';
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

        // pulse only for new requests, not count refreshes
        if (animate) {
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
    }

    async function fetchLatest() {
        try {
            const res  = await fetch('/_debug/api/profiles');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.profiles || data.profiles.length === 0) return;
            recentProfiles = data.profiles;
            const p = data.profiles[0];
            const isNew = p.token !== lastToken;
            if (isNew) lastToken = p.token;
            // always update counts (errors may be patched in after the first fetch)
            updateToolbar(p, isNew);
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
    flex-shrink: 0;
  }
  .tb-block:hover { background: #252525; color: #fff; text-decoration: none; }
  .tb-icon { color: #666; display: flex; align-items: center; }
  .tb-block:hover .tb-icon { color: #999; }
  .tb-time-wrap { position: relative; }
  .tb-time-bar {
    position: absolute; bottom: 0; left: 0; height: 2px;
    background: #FAC68E; width: 0%; transition: width .4s;
  }
  .tb-spacer { flex: 1; }
  .tb-brand {
    display: flex; align-items: center; gap: 8px;
    padding: 0 14px; color: #ccc; text-decoration: none;
    border-left: 1px solid #2e2e2e; height: 100%; font-weight: 500;
  }
  .tb-brand:hover { background: #252525; text-decoration: none; }
  .tb-brand-icon {
    width: 20px; height: 20px; background: #FAC68E; border-radius: 4px;
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
  .tb-err-pill {
    display: inline-flex; align-items: center; justify-content: center;
    background: #c0392b; color: #fff; border-radius: 10px;
    font-size: 10px; font-weight: 700; min-width: 16px; height: 16px;
    padding: 0 4px; margin-left: 3px; flex-shrink: 0;
  }
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
    padding: 4px 14px; color: #FAC68E; font-size: 12px;
    text-decoration: none; transition: background .1s;
  }
  .tt-link:hover { background: #252525; color: #FBD4A8; }

  /* ── HTTP requests tooltip table ── */
  .http-tt-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 2px 14px 8px; border-bottom: 1px solid #2a2a2a; margin-bottom: 2px;
  }
  .http-tt-head-title { color: #888; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
  .http-tt-head-link { color: #7c98d3; font-size: 11px; text-decoration: none; }
  .http-tt-head-link:hover { text-decoration: underline; }
  .http-tt-table { width: 100%; border-collapse: collapse; }
  .http-tt-table th {
    text-align: left; padding: 4px 10px;
    color: #555; font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .3px;
    border-bottom: 1px solid #222; background: #181818;
  }
  .http-tt-table td { padding: 5px 10px; color: #bbb; border-bottom: 1px solid #1e1e1e; }
  .http-tt-table tr:last-child td { border-bottom: none; }
  .http-tt-table tr:hover td { background: #252525; }
  .http-tt-method {
    display: inline-block; padding: 1px 5px; border-radius: 3px;
    font-size: 9px; font-weight: 700; min-width: 48px; text-align: center;
  }
  .http-tt-m-get     { background: #1565c0; color: #fff; }
  .http-tt-m-post    { background: #e67e22; color: #fff; }
  .http-tt-m-put     { background: #8e44ad; color: #fff; }
  .http-tt-m-patch   { background: #16a085; color: #fff; }
  .http-tt-m-delete  { background: #c0392b; color: #fff; }
  .http-tt-m-head,
  .http-tt-m-options { background: #555; color: #fff; }
  .http-tt-s-ok    { color: #2ecc71; font-weight: 600; font-size: 11px; }
  .http-tt-s-redir { color: #3498db; font-weight: 600; font-size: 11px; }
  .http-tt-s-err   { color: #e74c3c; font-weight: 600; font-size: 11px; }
  .http-tt-url { color: #ccc; text-decoration: none; font-size: 11px; }
  .http-tt-url:hover { color: #7c98d3; }
  .http-tt-dur { color: #888; font-size: 11px; white-space: nowrap; }

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
    width: 22px; height: 22px; background: #FAC68E; border-radius: 50%;
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

  <a id="tb-http" href="/_debug/profiler" class="tb-block" data-tt="http">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span>
    <span>0 requests</span>
  </a>

  <a id="tb-route" href="/_debug/profiler" class="tb-block" data-tt="route">
    <span class="tb-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polygon points="12,5 19,5 22,9 19,13 12,13"/><polygon points="12,14 5,14 2,18 5,21 12,21"/></svg></span>
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
      <div id="wdt-mini-logo-icon" style="width:22px;height:22px;background:#FAC68E;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:#fff;flex-shrink:0;">OP</div>
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
<title>OptiCoreJs</title>
<style>
  :root {
    --bg:     #f5f5f5;
    --card:   #FFFCF7;
    --border: #E0D8CA;
    --text:   #1A1A14;
    --muted:  #7A7268;
    --accent: #FAC68E;
    --ok:     #31af05;
    --warn:   #FAC68E;
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
    padding: 48px 24px 48px;
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
    box-shadow: 0 4px 18px rgba(250,198,142,.30);
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    border: 1px solid #31af05;
    color: var(--ok);
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--ok); animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(45,106,74,.35)} 50%{opacity:.7;box-shadow:0 0 0 5px rgba(45,106,74,0)} }
  .env-pill {
    display: inline-flex; align-items: center;
    background: ${isProd ? "#FDECEA" : "#FDF3EA"};
    border: 1px solid ${isProd ? "#E57373" : "#FAC68E"};
    color: ${isProd ? "#C62828" : "#C07030"};
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
  .card:hover { border-color: #C8B8A4; box-shadow: 0 2px 12px rgba(250,198,142,.10); }
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
  .quick-link:hover { border-color: var(--accent); background: #FDF3EA; color: var(--text); box-shadow: 0 2px 10px rgba(250,198,142,.12); text-decoration: none; }
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
        <div class="card-sub">Template mysqldb</div>
      </div>
      <div class="card">
        <div class="card-label">Environment</div>
        <div class="card-value" style="color:${isProd ? "#C62828" : "#C07030"}">${environment}</div>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAC68E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polygon points="12,5 19,5 22,9 19,13 12,13"/><polygon points="12,14 5,14 2,18 5,21 12,21"/></svg>
          </div>
          <div>
            <div class="quick-link-label">Request Profiler</div>
            <div class="quick-link-desc">All captured requests</div>
          </div>
        </a>
        <a href="/_debug/toolbar" class="quick-link">
          <div class="quick-link-icon" style="background:#FDE8D4;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAC68E" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
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
      fill="#FAC68E" fill-opacity="0.38"/>
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
      fill="#FAC68E" fill-opacity="0.32"/>
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
      fill="#FAC68E" fill-opacity="0.45"/>
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
    '#150F04','#150F04','#150F04','#150F04',
    '#150F04','#150F04','#150F04','#150F04'
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
