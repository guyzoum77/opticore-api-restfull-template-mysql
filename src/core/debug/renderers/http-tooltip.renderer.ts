import { IRequestProfile, ToolbarConfig } from "../types/debugToolbar.types";
import { SecurityService } from "../core/security.service";
import { formatDuration } from "../views/helpers.view";

export class HttpTooltipRenderer {
    constructor(
        private readonly config: ToolbarConfig,
        private readonly security: SecurityService,
    ) {}

    render(currentToken: string, recent: IRequestProfile[]): string {
        const items = recent.slice(0, this.config.maxRequests);
        if (items.length === 0) {
            return `<div class="tb-http-tooltip">
              <div class="tb-tip-header"><span>HTTP Requests</span></div>
              <div style="padding:12px;color:#666;font-size:11px;">No requests yet.</div>
            </div>`;
        }

        const rows = items.map(p => {
            const isCurrent = p.token === currentToken;
            const url = this.security.truncateUrl(p.url);
            const sc = p.statusCode >= 400 ? "tip-s-err"
                     : p.statusCode >= 300 ? "tip-s-redir" : "tip-s-ok";
            return `<tr${isCurrent ? ' class="tip-current"' : ""}>
              <td><span class="tip-method tip-m-${p.method.toLowerCase()}">${this.security.escapeHtml(p.method)}</span></td>
              <td><a href="/_debug/profiler/${p.token}" class="tip-url-link" title="${this.security.escapeHtml(p.url)}">${this.security.escapeHtml(url)}</a></td>
              <td class="${sc}">${p.statusCode}</td>
              <td class="tip-dur">${formatDuration(p.duration)}</td>
            </tr>`;
        }).join("");

        return `<div class="tb-http-tooltip">
          <div class="tb-tip-header">
            <span>Last ${items.length} HTTP Requests</span>
            <a href="/_debug/profiler" class="tb-tip-viewall">View all &rarr;</a>
          </div>
          <table class="tb-tip-table">
            <thead><tr><th>Method</th><th>URL</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }
}
