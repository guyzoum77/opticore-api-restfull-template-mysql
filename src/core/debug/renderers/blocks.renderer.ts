import { IRequestProfile, ProfileMetrics, ToolbarConfig } from "../types/debugToolbar.types";
import { SecurityService } from "../core/security.service";
import {
    ICON_CLOCK, ICON_MEMORY, ICON_LOG,
    ICON_USER, ICON_HTTP, ICON_ROUTE,
} from "../views/helpers.view";

export class BlocksRenderer {
    constructor(
        private readonly config: ToolbarConfig,
        private readonly security: SecurityService,
    ) {}

    renderAll(
        profile: IRequestProfile,
        metrics: ProfileMetrics,
        httpTooltipHtml: string,
    ): string {
        const base = `/_debug/profiler/${profile.token}`;
        return [
            this.renderDuration(base, metrics),
            this.renderMemory(base, metrics),
            this.renderLogs(base, metrics),
            this.renderUser(base),
            this.renderHttp(metrics, httpTooltipHtml),
            this.renderRoute(profile, base),
        ].join("\n");
    }

    private renderDuration(base: string, metrics: ProfileMetrics): string {
        const barWidth = Math.min(metrics.sqlTotalTime / 2, 100);
        return `<a href="${base}?panel=performance" class="tb-block" style="position:relative;">
            <span class="tb-icon">${ICON_CLOCK}</span>
            <span class="tb-label tb-underline">${metrics.durationFormatted}</span>
            <span class="tb-time-bar" style="width:${barWidth}%"></span>
        </a>`;
    }

    private renderMemory(base: string, metrics: ProfileMetrics): string {
        return `<a href="${base}?panel=performance" class="tb-block">
            <span class="tb-icon">${ICON_MEMORY}</span>
            <span class="tb-label">${metrics.memoryFormatted}</span>
        </a>`;
    }

    private renderLogs(base: string, metrics: ProfileMetrics): string {
        const errBadge = metrics.logErrors > 0
            ? `<span class="tb-badge-pill">${metrics.logErrors}</span>` : "";
        const warnBadge = metrics.logWarnings > 0
            ? `<span class="tb-badge-pill tb-badge-pill--warn">${metrics.logWarnings}</span>` : "";
        return `<a href="${base}?panel=logs" class="tb-block">
            <span class="tb-icon">${ICON_LOG}</span>
            <span class="tb-label">${metrics.logCount}</span>
            ${errBadge}${warnBadge}
        </a>`;
    }

    private renderUser(base: string): string {
        return `<a href="${base}" class="tb-block">
            <span class="tb-icon">${ICON_USER}</span>
            <span class="tb-label">n/a</span>
        </a>`;
    }

    private renderHttp(metrics: ProfileMetrics, tooltipHtml: string): string {
        const count = metrics.httpCount;
        return `<div class="tb-block tb-http-block">
            <span class="tb-icon">${ICON_HTTP}</span>
            <span class="tb-label">${count} request${count !== 1 ? "s" : ""}</span>
            ${tooltipHtml}
        </div>`;
    }

    private renderRoute(profile: IRequestProfile, base: string): string {
        const label = this.security.escapeHtml(profile.route.path || profile.url);
        return `<a href="${base}?panel=routing" class="tb-block">
            <span class="tb-icon">${ICON_ROUTE}</span>
            <span class="tb-label">${label}</span>
        </a>`;
    }
}
