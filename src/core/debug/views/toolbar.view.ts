import { IRequestProfile, ProfileMetrics } from "../types/debugToolbar.types";
import { debugStore } from "../store/debugToolbar.store";
import { defaultToolbarConfig } from "../config/toolbar.config";
import { SecurityService } from "../core/security.service";
import { MetricsService } from "../core/metrics.service";
import { HttpTooltipRenderer } from "../renderers/http-tooltip.renderer";
import { BlocksRenderer } from "../renderers/blocks.renderer";
import { ToolbarTemplate } from "../templates/toolbar.template";
import { formatDuration, ICON_CLOCK, ICON_MEMORY, ICON_DB, ICON_ROUTE, ICON_LOG } from "./helpers.view";

const security        = new SecurityService(defaultToolbarConfig.security);
const metricsService  = new MetricsService();
const tooltipRenderer = new HttpTooltipRenderer(defaultToolbarConfig, security);
const blocksRenderer  = new BlocksRenderer(defaultToolbarConfig, security);
const template        = new ToolbarTemplate();

export function renderToolbarBar(profile: IRequestProfile): string {
    const recentProfiles: IRequestProfile[] = debugStore.getAll();
    const metrics: ProfileMetrics = metricsService.compute(profile, recentProfiles.length);
    const tooltipHtml: string = tooltipRenderer.render(profile.token, recentProfiles);
    const blocksHtml: string = blocksRenderer.renderAll(profile, metrics, tooltipHtml);

    return template.render({
        statusCode:  profile.statusCode,
        profilerUrl: `/_debug/profiler/${profile.token}`,
        statusCls:   metrics.statusClass,
        appVersion:  security.escapeHtml(profile.appVersion),
        blocks:      blocksHtml,
    });
}

export function renderToolbarBarFragment(profile: IRequestProfile): string {
    const metrics: ProfileMetrics = metricsService.compute(profile);
    const base = `/_debug/profiler/${profile.token}`;

    return `<div class="sf-toolbar" id="sfwdt${profile.token}">
  <div class="sf-toolbar-block sf-toolbar-status sf-toolbar-status-${metrics.statusClass}">
    <a href="${base}" title="Open profiler">${profile.statusCode}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_CLOCK} <a href="${base}?panel=performance">${metrics.durationFormatted}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_MEMORY} ${metrics.memoryFormatted}
  </div>
  <div class="sf-toolbar-block">
    ${ICON_LOG} <a href="${base}?panel=logs">${metrics.logCount}${metrics.logWarnings > 0 ? ` <sup>${metrics.logWarnings}</sup>` : ""}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_DB} <a href="${base}?panel=database">${metrics.sqlCount} / ${formatDuration(metrics.sqlTotalTime)}</a>
  </div>
  <div class="sf-toolbar-block">
    ${ICON_ROUTE} <a href="${base}?panel=routing">${profile.method} ${profile.route.path}</a>
  </div>
</div>`;
}