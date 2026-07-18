(function () {
    var ROUTE_PREFIX = window.__opticoreProfilerRoutePrefix || "/_profiler";
    var OWN_TOKEN = window.__opticoreProfilerToken || null;
    var MAX_ROWS = 10;
    // A request reaches addAjaxRow at most once even though two independent
    // sources feed it: the fetch/XHR instrumentation (for calls this page's
    // own JS makes) and the SSE stream (for every request the server
    // profiles, including this page's own — both fire for the same token).
    var seenTokens = {};

    // collapse the full bar down to the bottom-right mini pill (does NOT close it)
    window.wdtCollapse = function () {
        var bar = document.getElementById("wdt");
        var mini = document.getElementById("wdt-mini");
        if (bar) bar.style.display = "none";
        if (mini) mini.style.display = "flex";
    };
    window.wdtExpand = function () {
        var bar = document.getElementById("wdt");
        var mini = document.getElementById("wdt-mini");
        if (mini) mini.style.display = "none";
        if (bar) bar.style.display = "flex";
    };

    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function statusClass(code) {
        if (code >= 400) return "tip-s-err";
        if (code >= 300) return "tip-s-redir";
        return "tip-s-ok";
    }

    function fmtDuration(ms) {
        return ms < 1000 ? Math.round(ms) + " ms" : (ms / 1000).toFixed(2) + " s";
    }

    function truncateUrl(url, max) {
        max = max || 38;
        return url.length > max ? url.slice(0, max - 1) + "…" : url;
    }

    /** Same rule as the server's isApiRequest() (toolbar.view.ts): an HTML
     * response is a page navigation, not a business/API call — keep those
     * out of the "HTTP requests" panel. */
    function isApiContentType(contentType) {
        return !contentType || contentType.toLowerCase().indexOf("text/html") !== 0;
    }

    function isProfilerUrl(url) {
        try {
            var path = new URL(url, window.location.origin).pathname;
            return path.indexOf(ROUTE_PREFIX) === 0;
        } catch (e) {
            return false;
        }
    }

    /**
     * Records one AJAX request the current page made, mirroring what the
     * server already knows about it (X-Debug-Token / X-Debug-Token-Link
     * headers, present on every profiled response) into the toolbar's
     * "HTTP requests" list — client-side, without polling the server.
     */
    function addAjaxRow(entry) {
        if (seenTokens[entry.token]) return;
        seenTokens[entry.token] = true;

        var table = document.getElementById("wdt-ajax-table");
        var countEl = document.getElementById("wdt-ajax-count");
        var emptyEl = document.getElementById("wdt-ajax-empty");
        if (!table) return;

        var tbody = table.querySelector("tbody");
        if (!tbody) return;

        if (emptyEl) emptyEl.style.display = "none";

        var row = document.createElement("tr");
        row.innerHTML =
            '<td><span class="tip-method tip-m-' + escapeHtml(entry.method.toLowerCase()) + '">' + escapeHtml(entry.method) + "</span></td>" +
            '<td><a href="' + escapeHtml(ROUTE_PREFIX + "/" + entry.token) + '" class="tip-url-link" title="' + escapeHtml(entry.url) + '">' + escapeHtml(truncateUrl(entry.url)) + "</a></td>" +
            '<td class="' + statusClass(entry.statusCode) + '">' + entry.statusCode + "</td>" +
            '<td class="tip-dur">' + fmtDuration(entry.duration) + "</td>";
        tbody.insertBefore(row, tbody.firstChild);

        while (tbody.children.length > MAX_ROWS) {
            tbody.removeChild(tbody.lastChild);
        }

        if (countEl) {
            countEl.textContent = tbody.children.length;
        }
    }

    function fromHeaders(method, url, statusCode, duration, getHeader) {
        var token = getHeader("x-debug-token");
        if (!token || isProfilerUrl(url)) return;
        if (!isApiContentType(getHeader("content-type"))) return;
        addAjaxRow({ method: method, url: url, token: token, statusCode: statusCode, duration: duration });
    }

    function instrumentFetch() {
        if (typeof window.fetch !== "function" || window.fetch.__opticoreProfilerWrapped) return;

        var originalFetch = window.fetch;
        var wrapped = function (input, init) {
            var method = (init && init.method) || (input && input.method) || "GET";
            var url = typeof input === "string" ? input : (input && input.url) || "";
            var start = performance.now();

            return originalFetch.apply(this, arguments).then(function (response) {
                fromHeaders(method, url || response.url, response.status, performance.now() - start, function (h) {
                    return response.headers.get(h);
                });
                return response;
            });
        };
        wrapped.__opticoreProfilerWrapped = true;
        window.fetch = wrapped;
    }

    function instrumentXhr() {
        var proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
        if (!proto || proto.open.__opticoreProfilerWrapped) return;

        var originalOpen = proto.open;
        var originalSend = proto.send;

        proto.open = function (method, url) {
            this.__opticoreMethod = method;
            this.__opticoreUrl = url;
            return originalOpen.apply(this, arguments);
        };
        proto.open.__opticoreProfilerWrapped = true;

        proto.send = function () {
            var start = performance.now();
            this.addEventListener("loadend", function () {
                fromHeaders(
                    this.__opticoreMethod || "GET",
                    this.__opticoreUrl || "",
                    this.status,
                    performance.now() - start,
                    function (h) { return this.getResponseHeader(h); }.bind(this)
                );
            });
            return originalSend.apply(this, arguments);
        };
    }

    /**
     * Keeps the toolbar's HTTP-requests counter and table in sync with
     * requests the *server* profiles — including ones this page's own JS
     * never made (another tab, curl, Postman...) — by subscribing to the
     * same SSE feed that already powers the profiler list page's live
     * updates, instead of leaving the toolbar frozen at its page-load
     * snapshot until a manual reload.
     */
    function connectLiveUpdates() {
        if (typeof EventSource === "undefined") return;

        var es = new EventSource(ROUTE_PREFIX + "/stream");
        es.addEventListener("profile", function (evt) {
            var row = JSON.parse(evt.data);
            if (OWN_TOKEN && row.token === OWN_TOKEN) return;
            if (!isApiContentType(row.contentType)) return;
            addAjaxRow({
                method: row.method,
                url: row.url,
                token: row.token,
                statusCode: row.statusCode,
                duration: row.duration,
            });
        });
    }

    instrumentFetch();
    instrumentXhr();
    connectLiveUpdates();
})();
