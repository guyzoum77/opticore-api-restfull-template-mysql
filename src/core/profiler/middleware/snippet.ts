/**
 * The only thing injected into a business page's HTML: a stylesheet link and
 * a handful of lines that fetch the real toolbar markup from
 * `${routePrefix}/wdt/:token` and splice it in — the page itself never knows
 * profiling exists, and the bulk of the toolbar's HTML/CSS/JS never touches
 * the response the app rendered.
 */
export function buildToolbarSnippet(token: string, routePrefix: string): string {
    return `<link rel="stylesheet" href="${routePrefix}/assets/css/toolbar-standalone.css">
<div id="opticore-wdt-mount"></div>
<script>
(function () {
  window.__opticoreProfilerToken = "${token}";
  window.__opticoreProfilerRoutePrefix = "${routePrefix}";
  fetch("${routePrefix}/wdt/${token}", { credentials: "same-origin" })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      document.getElementById("opticore-wdt-mount").outerHTML = html;
      let s = document.createElement("script");
      s.src = "${routePrefix}/assets/js/toolbar.js";
      document.body.appendChild(s);
    })
    .catch(function () {});
})();
</script>`;
}
