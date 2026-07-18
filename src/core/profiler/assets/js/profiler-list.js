(function () {
    function escapeHtml(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function rowHtml(row) {
        return (
            '<tr class="pl-row" onclick="location.href=\'/_profiler/' + escapeHtml(row.token) + '\'">' +
            '<td class="pl-cell"><span class="pl-status-badge pl-status-badge--' + escapeHtml(row.statusClass) + '">' + row.statusCode + "</span></td>" +
            '<td class="pl-cell">' + escapeHtml(row.method) + "</td>" +
            '<td class="pl-cell pl-cell-url" title="' + escapeHtml(row.url) + '">' + escapeHtml(row.url) + "</td>" +
            '<td class="pl-cell pl-cell-date">' + escapeHtml(row.dateStr) + '<br><span class="pl-cell-time">' + escapeHtml(row.timeStr) + "</span></td>" +
            '<td class="pl-cell"><a href="/_profiler/' + escapeHtml(row.token) + '" onclick="event.stopPropagation()" class="pl-token-link">' + escapeHtml(row.tokenShort) + "</a></td>" +
            "</tr>"
        );
    }

    function limitFromUrl() {
        var limit = parseInt(new URLSearchParams(location.search).get("limit") || "10", 10);
        return [10, 25, 50, 100].indexOf(limit) !== -1 ? limit : 10;
    }

    /**
     * Live-updates the results table as the server profiles new requests —
     * replaces the previous `setTimeout(() => location.reload(), 5000)`
     * polling: the page only re-renders when the server actually pushes a
     * new profile over SSE, never on a blind timer.
     */
    function connectLiveUpdates() {
        if (typeof EventSource === "undefined") return;

        var table = document.querySelector(".pl-table tbody");
        var heading = document.querySelector(".pl-section-heading");
        var limit = limitFromUrl();
        var count = table ? table.querySelectorAll(".pl-row").length : 0;

        var es = new EventSource("/_profiler/stream");
        es.addEventListener("profile", function (evt) {
            if (!table) return;
            var row = JSON.parse(evt.data);

            var emptyRow = table.querySelector(".pl-empty-row");
            if (emptyRow) emptyRow.closest("tr").remove();

            table.insertAdjacentHTML("afterbegin", rowHtml(row));
            count++;

            while (table.querySelectorAll(".pl-row").length > limit) {
                table.removeChild(table.lastElementChild);
            }

            if (heading) {
                var shown = Math.min(count, limit);
                heading.textContent = shown + " result" + (shown !== 1 ? "s" : "") + " found";
            }
        });
    }

    if (document.body.dataset.autoreload === "1") {
        connectLiveUpdates();
    }

    document.addEventListener("keydown", e => {
        if (e.key === "r" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT") {
            location.reload();
        }
    });
})();
