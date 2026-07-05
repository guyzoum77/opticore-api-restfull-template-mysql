(function() {
    let CFG = window.__WDT_CONFIG || {};
    let lastToken = null;
    let lastProfile = null;
    let lastProfilerUrl = '/_debug/profiler';
    let recentProfiles = [];
    let isCollapsed = false;

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

    const TT  = document.getElementById('wdt-tt');
    let ttTimer = null;

    function wdtTtShow(anchor, html) {
        clearTimeout(ttTimer);
        TT.innerHTML = html;
        TT.style.display = 'block';

        const rect = anchor.getBoundingClientRect();
        const ttRect = TT.getBoundingClientRect();
        let left = rect.left;
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

    TT.addEventListener('mouseenter', () => clearTimeout(ttTimer));
    TT.addEventListener('mouseleave', wdtTtHide);

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
        let errors = p.logErrors || 0;
        let warnings = p.logWarnings || 0;
        let deprecations = p.logDeprecations || 0;
        let errVal = errors > 0 ? badge(errors, '#c0392b') : '<span style="color:#555;">0</span>';
        let warnVal = warnings > 0 ? badge(warnings, '#e67e22') : '<span style="color:#555;">0</span>';
        let deprVal = deprecations > 0 ? badge(deprecations, '#8e44ad') : '<span style="color:#555;">0</span>';
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
        const env = CFG.environment;
        const envOk = env !== 'production';
        return row('OptiCoreJs',  badge('v' + CFG.appVersion, '#3D1E08')) +
               row('Node.js',     badge(CFG.nodeVersion, '#1b3d1a')) +
               row('npm',         badge('v' + CFG.npmVersion, '#3d2200')) +
               row('Environment', badge(env, envOk ? '#1a3320' : '#3d0a0a')) +
               sep() +
               link('/_debug/profiler', 'Open Profiler', '📊') +
               link('https://github.com/guyzoum77/opticore-api-restfull-template-mysql', 'Documentation', '📖') +
               link('https://github.com/guyzoum77/opticore-api-restfull-template-mysql/issues', 'Help & Support', '❓');
    }

    // hover sur "Server" → runtime + status packages + services
    function ttServer() {
        const env = CFG.environment;
        const envOk = env !== 'production';
        const cacheOk   = CFG.cacheInstalled;
        const gatewayOk = CFG.gatewayInstalled;
        const pkgBadge  = (ok) => ok
            ? '<span class="tt-badge" style="background:#2e7d32">Enabled</span>'
            : '<span class="tt-badge" style="background:#444;color:#888">not installed</span>';
        return row('Node.js',             badge(CFG.nodeVersion, '#1b3d1a')) +
               row('npm',                 badge('v' + CFG.npmVersion, '#3d2200')) +
               row('Environment',         badge(env, envOk ? '#1a3320' : '#3d0a0a')) +
               sep() +
               link('/_debug/profiler',   'Opticore Profiler',   '📊') +
               row('Opticore Cache',       pkgBadge(cacheOk)) +
               row('Opticore API Gateway', pkgBadge(gatewayOk)) +
               sep() +
               '<div style="padding:4px 14px 2px;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.8px;">Services</div>' +
               link('#docker-compose',                        'Docker Compose', '<svg width="16" height="13" viewBox="0 0 340 268" xmlns="http://www.w3.org/2000/svg"><path fill="#2560ff" d="M334,110.1c-8.3-5.6-30.2-8-46.1-3.7-.9-15.8-9-29.2-24-40.8l-5.5-3.7-3.7,5.6c-7.2,11-10.3,25.7-9.2,39,.8,8.2,3.7,17.4,9.2,24.1-20.7,12-39.8,9.3-124.3,9.3H0c-.4,19.1,2.7,55.8,26,85.6,2.6,3.3,5.4,6.5,8.5,9.6,19,19,47.6,32.9,90.5,33,65.4,0,121.4-35.3,155.5-120.8,11.2.2,40.8,2,55.3-26,.4-.5,3.7-7.4,3.7-7.4l-5.5-3.7h0ZM85.2,92.7h-36.7v36.7h36.7v-36.7ZM132.6,92.7h-36.7v36.7h36.7v-36.7ZM179.9,92.7h-36.7v36.7h36.7v-36.7ZM227.3,92.7h-36.7v36.7h36.7v-36.7ZM37.8,92.7H1.1v36.7h36.7v-36.7ZM85.2,46.3h-36.7v36.7h36.7v-36.7ZM132.6,46.3h-36.7v36.7h36.7v-36.7ZM179.9,46.3h-36.7v36.7h36.7v-36.7ZM179.9,0h-36.7v36.7h36.7V0Z"/></svg>') +
               link('/_debug/profiler?panel=configuration',   'Env lets',       '<svg width="16" height="13" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 600 600"><path fill="currentColor" d="M600 0v600H0V0zM273.3 397.3H171v138h105V512h-77.1v-37.6H268v-23.2h-69v-30.6h74.4zm53.7 0h-27.1v138h25.9v-90l55.6 90h28v-138h-26v92.1zm127.9 0h-30.2l49.3 138h29.8l49.4-138h-29.6l-33.8 102zM135 492H93v42h42z"/></svg>️') +
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

    // attach hover listeners to all [data-tt] elements
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
            let durSpan = dur.querySelectorAll('span')[1];
            if (durSpan) durSpan.textContent = fmtDuration(p.duration);
            dur.href = lastProfilerUrl + '?panel=performance';
        }

        const mem = document.getElementById('tb-memory');
        if (mem) {
            let memSpan = mem.querySelector('span:last-child');
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
            let logsSpan = logsEl.querySelector('span:last-child');
            if (logsSpan) logsSpan.textContent = (p.logCount || 0) + ' logs';
            // error badge pill — add/update/remove based on error count
            let existingPill = logsEl.querySelector('.tb-err-pill');
            let errCount = p.logErrors || 0;
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
            let routeSpan = route.querySelector('span:last-child');
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
