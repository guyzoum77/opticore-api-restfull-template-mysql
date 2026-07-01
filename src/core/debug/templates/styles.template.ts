export class StyleTemplate {
    getCss(): string {
        return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 12px;
  }
  .toolbar {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 36px;
    background: #1b1b1b;
    border-top: 1px solid #2e2e2e;
    display: flex;
    align-items: stretch;
    z-index: 99999;
    box-shadow: 0 -2px 8px rgba(0,0,0,.4);
    overflow: hidden;
  }
  .tb-badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 10px;
    font-weight: 700; font-size: 12px; color: #fff;
    text-decoration: none; height: 100%;
    transition: opacity .15s;
  }
  .tb-badge:hover { opacity: .85; }
  .tb-badge--s-ok       { background: #2e7d32; }
  .tb-badge--s-warn     { background: #c0392b; }
  .tb-badge--s-error    { background: #c0392b; }
  .tb-badge--s-redirect { background: #1565c0; }
  .tb-block {
    display: flex; align-items: center; gap: 5px;
    padding: 0 10px; color: #ccc; text-decoration: none;
    height: 100%; white-space: nowrap;
    transition: background .15s; cursor: pointer;
  }
  .tb-block:hover { background: #252525; color: #fff; }
  .tb-icon { color: #888; display: flex; align-items: center; }
  .tb-block:hover .tb-icon { color: #aaa; }
  .tb-label { font-size: 12px; }
  .tb-underline { border-bottom: 2px solid #e74c3c; }
  .tb-spacer { flex: 1; }
  .tb-brand {
    display: flex; align-items: center; gap: 6px;
    padding: 0 12px; color: #ccc; text-decoration: none;
    border-left: 1px solid #2e2e2e; height: 100%; font-weight: 500;
  }
  .tb-brand:hover { background: #252525; }
  .tb-brand-icon {
    width: 20px; height: 20px; background: #C87A3C;
    border-radius: 4px; display: flex; align-items: center;
    justify-content: center; font-size: 10px; font-weight: 900;
    color: #fff; flex-shrink: 0;
  }
  .tb-version {
    display: flex; align-items: center; padding: 0 10px;
    color: #888; font-size: 11px;
    border-left: 1px solid #2e2e2e; height: 100%; white-space: nowrap;
  }
  .tb-close {
    display: flex; align-items: center; justify-content: center;
    padding: 0 10px; color: #666; text-decoration: none;
    border-left: 1px solid #2e2e2e; height: 100%; cursor: pointer;
    background: none; border-top: none; border-right: none; border-bottom: none;
    font-size: 16px; transition: color .15s, background .15s;
  }
  .tb-close:hover { background: #c0392b; color: #fff; }
  .tb-badge-pill {
    display: inline-flex; align-items: center; justify-content: center;
    background: #c0392b; color: #fff; border-radius: 10px;
    font-size: 10px; font-weight: 700; min-width: 16px; height: 16px;
    padding: 0 4px; margin-left: 2px;
  }
  .tb-badge-pill--warn { background: #e67e22; }
  .tb-badge-pill--ok   { background: #2e7d32; }
  .tb-time-bar {
    width: 100%; height: 2px; background: #e74c3c;
    position: absolute; bottom: 0; left: 0;
  }
  /* HTTP requests tooltip */
  .tb-http-block { position: relative; }
  .tb-http-tooltip {
    display: none;
    position: absolute; bottom: calc(100% + 4px); left: 0;
    background: #1e1e1e; border: 1px solid #333; border-radius: 6px;
    min-width: 500px; z-index: 100000;
    box-shadow: 0 -4px 20px rgba(0,0,0,.7); overflow: hidden;
  }
  .tb-http-block:hover .tb-http-tooltip { display: block; }
  .tb-tip-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; background: #161616; border-bottom: 1px solid #333;
    font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .5px;
  }
  .tb-tip-viewall { color: #7c98d3; text-decoration: none; font-size: 11px; }
  .tb-tip-viewall:hover { text-decoration: underline; }
  .tb-tip-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .tb-tip-table th {
    text-align: left; padding: 5px 10px;
    color: #666; font-weight: 600; font-size: 10px;
    text-transform: uppercase; letter-spacing: .4px;
    border-bottom: 1px solid #2a2a2a; background: #1a1a1a;
  }
  .tb-tip-table td { padding: 5px 10px; color: #bbb; border-bottom: 1px solid #252525; }
  .tb-tip-table tr:last-child td { border-bottom: none; }
  .tb-tip-table tr:hover td { background: #262626; }
  .tip-current td { background: #1e2a1e !important; }
  .tip-method {
    display: inline-block; padding: 1px 6px; border-radius: 3px;
    font-size: 10px; font-weight: 700; min-width: 52px; text-align: center;
  }
  .tip-m-get     { background: #1565c0; color: #fff; }
  .tip-m-post    { background: #e67e22; color: #fff; }
  .tip-m-put     { background: #8e44ad; color: #fff; }
  .tip-m-patch   { background: #16a085; color: #fff; }
  .tip-m-delete  { background: #c0392b; color: #fff; }
  .tip-m-head,
  .tip-m-options { background: #555; color: #fff; }
  .tip-s-ok    { color: #2ecc71; font-weight: 600; }
  .tip-s-redir { color: #3498db; font-weight: 600; }
  .tip-s-err   { color: #e74c3c; font-weight: 600; }
  .tip-dur  { color: #888; white-space: nowrap; }
  .tip-url-link { color: #ccc; text-decoration: none; }
  .tip-url-link:hover { color: #7c98d3; }`;
    }
}
