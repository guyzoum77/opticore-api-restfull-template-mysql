import {IRequestProfile, IToolbarBarViewModel, IToolbarHttpRow, ProfileMetrics} from "../types/debugToolbar.types";
import { debugStore } from "../store/debugToolbar.store";
import { defaultToolbarConfig } from "../config/toolbar.config";
import { SecurityService } from "../core/security.service";
import { MetricsService } from "../core/metrics.service";
import { formatDuration } from "./helpers.view";

const security = new SecurityService(defaultToolbarConfig.security);
const metricsService = new MetricsService();

export function buildToolbarBarViewModel(profile: IRequestProfile): IToolbarBarViewModel {
    const recentProfiles: IRequestProfile[] = debugStore.getAll();
    const metrics: ProfileMetrics = metricsService.compute(profile, recentProfiles.length);
    const base = `/_debug/profiler/${profile.token}`;

    const httpRows: IToolbarHttpRow[] = recentProfiles
        .slice(0, defaultToolbarConfig.maxRequests)
        .map(p => ({
            isCurrent: p.token === profile.token,
            method: p.method,
            url: security.truncateUrl(p.url),
            fullUrl: p.url,
            token: p.token,
            statusCode: p.statusCode,
            statusClass: p.statusCode >= 400 ? "tip-s-err" : p.statusCode >= 300 ? "tip-s-redir" : "tip-s-ok",
            duration: formatDuration(p.duration),
        }));

    return {
        statusCode: profile.statusCode,
        profilerUrl: base,
        statusCls: metrics.statusClass,
        appVersion: profile.appVersion,
        base,
        duration: { formatted: metrics.durationFormatted, barWidth: Math.min(metrics.sqlTotalTime / 2, 100) },
        memory: { formatted: metrics.memoryFormatted },
        logs: { count: metrics.logCount, errors: metrics.logErrors, warnings: metrics.logWarnings },
        route: { label: profile.route.path || profile.url },
        http: { count: metrics.httpCount, rows: httpRows },
    };
}