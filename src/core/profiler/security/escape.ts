/**
 * Escapes a value for safe interpolation into HTML. Every piece of profiled
 * data (headers, query params, body, SQL bindings, log messages...) can
 * originate from untrusted user input, so nothing profiled reaches a
 * template without going through this — the njk views also autoescape by
 * default, but panel data assembled as pre-built HTML strings (view.ts
 * builders) escapes explicitly at the source.
 */
export function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
