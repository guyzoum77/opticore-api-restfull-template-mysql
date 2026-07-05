function filterTable(input) {
    const q = input.value.toLowerCase();
    const wrap = input.closest(".table-wrap");
    if (!wrap) return;
    wrap.querySelectorAll("tbody tr").forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
    });
}

function toggleLogCtx(id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    var shown = el.style.display === 'block';
    el.style.display = shown ? 'none' : 'block';
    btn.textContent = shown ? 'Show context' : 'Hide context';
}

(function() {
    var tabs = document.querySelectorAll('#log-tabs .log-tab');
    var rows = document.querySelectorAll('#log-tbody .log-row');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var f = this.getAttribute('data-ltab');
            tabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            rows.forEach(function(row) {
                row.style.display = (f === 'all' || row.getAttribute('data-ltype') === f) ? '' : 'none';
            });
        });
    });
})();

document.addEventListener("keydown", e => {
    if (e.key === "Escape") location.href = "/_debug/profiler";
});
