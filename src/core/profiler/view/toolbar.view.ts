import { IRequestProfile, IToolbarBarViewModel, IToolbarHttpRow, ProfileMetrics, SecurityConfig } from "../types";
import { formatDuration, formatMemory, statusClass, sqlTotalTime } from "./helpers.view";

function computeMetrics(profile: IRequestProfile, httpCount: number): ProfileMetrics {
    return {
        sqlTotalTime: sqlTotalTime(profile),
        sqlCount: profile.queries.length,
        logCount: profile.logs.length,
        logErrors: profile.logs.filter(l => l.level === "error" || l.level === "critical").length,
        logWarnings: profile.logs.filter(l => l.level === "warning").length,
        logDeprecations: profile.logs.filter(l => (l.level as string) === "deprecation").length,
        httpCount,
        memoryFormatted: formatMemory(profile.memoryUsage),
        durationFormatted: formatDuration(profile.duration),
        statusClass: statusClass(profile.statusCode),
    };
}

function truncateUrl(url: string, maxLen: number): string {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen - 1) + "…";
}

/**
 * The toolbar's "HTTP requests" panel is meant to log business/API calls
 * (POST /add-users, ...), not the page navigation that rendered the toolbar
 * itself — an HTML page load isn't "a request the app made", it's the
 * request that's currently showing this very toolbar. Response Content-Type
 * is what tells the two apart, since it's set by the app itself regardless
 * of how the request got here (Postman, another tab, the page's own JS).
 */
function isApiRequest(profile: IRequestProfile): boolean {
    return !(profile.response.contentType ?? "").toLowerCase().startsWith("text/html");
}

/**
 * Builds the view model for the toolbar fragment (GET /_profiler/wdt/:token).
 * `recentProfiles` are lightweight legacy-shaped profiles (from
 * storage.find()) used only for the HTTP requests tooltip list.
 */
export function buildToolbarBarViewModel(
    profile: IRequestProfile,
    recentProfiles: IRequestProfile[],
    security: SecurityConfig,
    routePrefix: string,
    maxRequests: number
): IToolbarBarViewModel {
    const apiProfiles = recentProfiles.filter(isApiRequest);
    const metrics = computeMetrics(profile, apiProfiles.length);
    const base = `${routePrefix}/${profile.token}`;

    const httpRows: IToolbarHttpRow[] = apiProfiles
        .slice(0, maxRequests)
        .map(p => ({
            isCurrent: p.token === profile.token,
            method: p.method,
            url: truncateUrl(p.url, security.maxUrlLength),
            fullUrl: p.url,
            token: p.token,
            statusCode: p.statusCode,
            statusClass: p.statusCode >= 400 ? "tip-s-err" : p.statusCode >= 300 ? "tip-s-redir" : "tip-s-ok",
            duration: formatDuration(p.duration),
        }));

    return {
        statusCode: profile.statusCode,
        statusMessage: profile.statusMessage,
        profilerUrl: base,
        statusCls: metrics.statusClass,
        appVersion: profile.appVersion,
        nodeVersion: profile.nodeVersion,
        environment: profile.environment,
        method: profile.method,
        url: profile.url,
        token: profile.token,
        base,
        duration: {
            formatted: metrics.durationFormatted,
            barWidth: Math.min(metrics.sqlTotalTime / 2, 100),
            appFormatted: metrics.durationFormatted,
            dbFormatted: metrics.sqlCount > 0 ? formatDuration(metrics.sqlTotalTime) : "0 ms",
        },
        memory: { formatted: metrics.memoryFormatted },
        logs: { count: metrics.logCount, errors: metrics.logErrors, warnings: metrics.logWarnings, deprecations: metrics.logDeprecations },
        route: { label: profile.route.path || profile.url, method: profile.route.method || profile.method },
        http: { count: metrics.httpCount, rows: httpRows },
    };
}
