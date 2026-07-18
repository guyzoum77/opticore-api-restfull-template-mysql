import {
    IRequestProfile,
    ISqlQuery,
    ILogEntry,
    IKvRow,
    Panel,
    IRequestPanelData,
    IPerformancePanelData, IDatabasePanelData, ILogsPanelData, IRoutingPanelData, IConfigurationPanelData,
    IExceptionPanelData, IRoutePathSegment, IRouteTableRow, IRoutesPanelData, ISidebarItem, ILogRow, ILogExtra,
    ITimelineEvent
} from "../types";
import { formatDuration, formatMemory, sqlTotalTime } from "./helpers.view";

export interface IRegisteredRoute {
    method: string;
    path: string;
    middlewareCount: number;
}

function toKvRows(obj: Record<string, unknown>): IKvRow[] {
    return Object.entries(obj).map(([key, v]) => ({
        key,
        value: typeof v === "object" && v !== null ? JSON.stringify(v, null, 2) : String(v),
    }));
}

function headersToRows(headers: Record<string, string>): IKvRow[] {
    return Object.entries(headers ?? {}).map(([key, value]) => ({ key, value }));
}

function buildRequestPanel(profile: IRequestProfile): IRequestPanelData {
    const cookies = (profile.request.cookies as Record<string, unknown>) ?? {};
    return {
        statusOk: profile.statusCode < 400,
        statusCode: profile.statusCode,
        durationFormatted: formatDuration(profile.duration),
        memoryFormatted: formatMemory(profile.memoryUsage),
        sqlQueryCount: profile.queries.length,
        getParams: toKvRows((profile.request.query as Record<string, unknown>) ?? {}),
        postParams: toKvRows((profile.request.body as Record<string, unknown>) ?? {}),
        routeParams: toKvRows((profile.request.params as Record<string, unknown>) ?? {}),
        attributes: [
            { key: "_method", value: profile.method },
            { key: "_route", value: profile.route.path },
            { key: "_controller", value: profile.route.controller ?? "unknown" },
            { key: "_ip", value: profile.request.ip },
            { key: "_hostname", value: profile.request.hostname ?? "localhost" },
            { key: "_protocol", value: profile.request.protocol ?? "http" },
        ],
        requestHeaders: headersToRows(profile.request.headers as Record<string, string>),
        responseHeaders: headersToRows(profile.response.headers as Record<string, string>),
        hasCookies: Object.keys(cookies).length > 0,
        cookies: toKvRows(cookies),
        responseBodyJson: profile.response.body ? JSON.stringify(profile.response.body, null, 2) : null,
    };
}

function buildPerformancePanel(profile: IRequestProfile): IPerformancePanelData {
    const total: number = profile.duration;
    const sqlTime: number = sqlTotalTime(profile);
    const appTime: number = Math.max(0, total - sqlTime);

    const rawEvents = [
        { label: "kernel.request  (Application)", duration: appTime, color: "#C87A3C" },
        ...(sqlTime > 0 ? [{ label: "kernel.response (Database SQL)", duration: sqlTime, color: "#2D6A4A" }] : []),
    ].filter(e => e.duration > 0);

    const events: ITimelineEvent[] = rawEvents.map(e => {
        const pct: number = total > 0 ? Math.min((e.duration / total) * 100, 100) : 0;
        return {
            label: e.label,
            widthPct: Math.max(pct, 0.5).toFixed(1),
            color: e.color,
            durationFormatted: formatDuration(e.duration),
        };
    });

    return {
        total,
        appTime,
        memoryMiB: (Math.max(0, profile.memoryUsage) / 1024 / 1024).toFixed(2),
        hasEvents: events.length > 0,
        events,
        hasSqlTime: sqlTime > 0,
        processInfo: [
            { key: "Node.js version", value: profile.nodeVersion },
            { key: "App version", value: profile.appVersion },
            { key: "Environment", badge: { text: profile.environment, variant: profile.environment === "production" ? "warn" : "info" } },
            { key: "Process PID", value: String(process.pid) },
            { key: "Platform", value: process.platform },
            { key: "Heap used", value: formatMemory(process.memoryUsage().heapUsed) },
            { key: "Heap total", value: formatMemory(process.memoryUsage().heapTotal) },
            { key: "RSS", value: formatMemory(process.memoryUsage().rss) },
            { key: "Uptime", value: `${Math.round(process.uptime())}s` },
        ],
    };
}

function sqlType(sql: string): string {
    const t = sql.trimStart().toUpperCase().slice(0, 6);
    if (t.startsWith("SELECT")) return "SELECT";
    if (t.startsWith("INSERT")) return "INSERT";
    if (t.startsWith("UPDATE")) return "UPDATE";
    if (t.startsWith("DELETE")) return "DELETE";
    return "OTHER";
}

function buildDatabasePanel(profile: IRequestProfile): IDatabasePanelData {
    const queries = profile.queries;
    const totalTime = sqlTotalTime(profile);
    return {
        hasQueries: queries.length > 0,
        totalCount: queries.length,
        totalTimeFormatted: formatDuration(totalTime),
        avgFormatted: queries.length > 0 ? formatDuration(Math.round(totalTime / queries.length)) : "0 ms",
        queries: queries.map((q: ISqlQuery, i: number) => ({
            type: sqlType(q.sql),
            index: i + 1,
            hasError: !!q.error,
            durationFormatted: formatDuration(q.duration),
            sql: q.sql,
            bindingsJson: q.bindings && q.bindings.length > 0 ? JSON.stringify(q.bindings) : null,
            error: q.error ?? null,
        })),
    };
}

function buildLogsPanel(profile: IRequestProfile): ILogsPanelData {
    const logs: ILogEntry[] = profile.logs;
    if (logs.length === 0) {
        return { hasLogs: false, errCount: 0, warnCount: 0, deprCount: 0, rows: [] };
    }

    const errCount: number = logs.filter((l: ILogEntry): boolean => l.level === "error" || l.level === "critical").length;
    const warnCount: number = logs.filter((l: ILogEntry): boolean => l.level === "warning").length;
    const deprCount: number = logs.filter((l: ILogEntry): boolean => (l.level as string) === "deprecation").length;

    function levelCls(level: string): string {
        if (level === "critical") return "log-error";
        if (level === "deprecation") return "log-deprecation";
        return `log-${level}`;
    }

    function rowBorderCls(level: string): string {
        if (level === "error" || level === "critical") return "log-row-error";
        if (level === "warning") return "log-row-warning";
        if (level === "deprecation") return "log-row-deprecation";
        return "";
    }

    function logType(level: string): string {
        if (level === "error" || level === "critical") return "error";
        if (level === "warning") return "warning";
        if (level === "deprecation") return "deprecation";
        return "other";
    }

    const rows: ILogRow[] = logs.map((l: ILogEntry, i: number) => {
        const ctx: Record<string, unknown> = l.context ?? {};
        const hasCtx: boolean = Object.keys(ctx).length > 0;
        const hasStack: boolean = hasCtx && typeof ctx.stack === "string" && (ctx.stack as string).length > 0;
        const source: string = hasCtx && typeof ctx.source === "string" ? (ctx.source as string) : "";

        const ctxId = `lctx${i}`;
        const stackId = `lstk${i}`;
        const ms: string = String(l.timestamp % 1000).padStart(3, "0");
        const timeStr: string = new Date(l.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
        }) + "." + ms;

        let extra: ILogExtra | null = null;
        if (hasStack) {
            const stack = ctx.stack as string;
            const ctxWithoutStack: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(ctx)) {
                if (k !== "stack") ctxWithoutStack[k] = v;
            }
            const hasOtherCtx: boolean = Object.keys(ctxWithoutStack).length > 0;
            extra = {
                showContextBtn: hasOtherCtx,
                showTraceBtn: true,
                ctxId, stackId,
                ctxJson: hasOtherCtx ? JSON.stringify(ctxWithoutStack, null, 2) : null,
                stackText: stack,
            };
        } else if (hasCtx) {
            extra = {
                showContextBtn: true,
                showTraceBtn: false,
                ctxId, stackId,
                ctxJson: JSON.stringify(ctx, null, 2),
                stackText: null,
            };
        }

        return {
            rowClass: rowBorderCls(l.level),
            logType: logType(l.level),
            timeStr,
            levelCls: levelCls(l.level),
            level: l.level,
            message: l.message,
            source,
            extra,
        };
    });

    return { hasLogs: true, errCount, warnCount, deprCount, rows };
}

function buildRoutingPanel(profile: IRequestProfile): IRoutingPanelData {
    const routeParams: Record<string, string | string[]> = profile.route.params ?? {};
    const queryParams: Record<string, unknown> = profile.request.query ?? {};
    return {
        routeRows: [
            { key: "Route", value: profile.route.path, code: true },
            { key: "Method", badge: { text: profile.route.method, variant: "info" } },
            { key: "Controller", value: profile.route.controller ?? "unknown" },
            { key: "Full URL", value: profile.request.url, code: true },
        ],
        hasRouteParams: Object.keys(routeParams).length > 0,
        routeParamsRows: Object.entries(routeParams).map(([key, v]) => ({ key, value: String(v), code: true })),
        hasQueryParams: Object.keys(queryParams).length > 0,
        queryParamsRows: Object.entries(queryParams).map(([key, v]) => ({ key, value: String(v), code: true })),
    };
}

function buildConfigurationPanel(profile: IRequestProfile): IConfigurationPanelData {
    const safeEnv: [string, string | undefined][] = Object.entries(process.env)
        .filter(([k]): boolean => !/(PASSWORD|SECRET|KEY|TOKEN|AUTH|PASS|PRIVATE)/i.test(k))
        .sort(([a], [b]): number => a.localeCompare(b));

    return {
        appInfo: [
            { key: "App Version", value: profile.appVersion },
            { key: "Node.js", value: profile.nodeVersion },
            { key: "Environment", badge: { text: profile.environment, variant: profile.environment === "production" ? "warn" : "info" } },
            { key: "Platform", value: `${process.platform} (${process.arch})` },
        ],
        envRows: safeEnv.map(([key, v]) => ({ key, value: v ?? "", title: v ?? "", truncate: true })),
        envCount: safeEnv.length,
    };
}

function buildExceptionPanel(profile: IRequestProfile): IExceptionPanelData {
    const errLogs: ILogEntry[] = profile.logs.filter((l: ILogEntry): boolean => l.level === "error" || l.level === "critical");
    const isError: boolean = profile.statusCode >= 500;
    const isNotFound: boolean = profile.statusCode === 404;

    return {
        noException: errLogs.length === 0 && !isError,
        showBanner: isError || isNotFound,
        statusCode: profile.statusCode,
        statusMessage: profile.statusMessage,
        method: profile.method,
        url: profile.url,
        errLogs: errLogs.map((l: ILogEntry) => ({
            levelUpper: l.level.toUpperCase(),
            message: l.message,
            contextJson: l.context ? JSON.stringify(l.context, null, 2) : null,
        })),
    };
}

function pathToSegments(path: string): IRoutePathSegment[] {
    const segments: IRoutePathSegment[] = [];
    const re = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(path)) !== null) {
        if (m.index > lastIndex) segments.push({ type: "text", value: path.slice(lastIndex, m.index) });
        segments.push({ type: "param", value: m[1] });
        lastIndex = re.lastIndex;
    }
    if (lastIndex < path.length) segments.push({ type: "text", value: path.slice(lastIndex) });
    return segments;
}

function methodClassOf(method: string): string {
    return ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].includes(method) ? `rm-${method}` : "rm-ALL";
}

function toRouteRows(routes: IRegisteredRoute[]): IRouteTableRow[] {
    return routes.map(r => ({
        methodClass: methodClassOf(r.method),
        method: r.method,
        pathSegments: pathToSegments(r.path),
        middlewareCount: r.middlewareCount,
    }));
}

function buildRoutesPanel(routes: IRegisteredRoute[]): IRoutesPanelData {
    if (routes.length === 0) {
        return {
            hasRoutes: false, totalRoutes: 0, appRoutesCount: 0, methodCounts: [],
            hasAppRoutes: false, appRoutesRows: [], hasDebugRoutes: false, debugRoutesRows: [],
        };
    }
    const methods = [...new Set(routes.map(r => r.method))].sort();
    const appRoutes = routes.filter(r => !r.path.startsWith("/_profiler") && r.path !== "/");
    const debugRoutes = routes.filter(r => r.path.startsWith("/_profiler") || r.path === "/");

    return {
        hasRoutes: true,
        totalRoutes: routes.length,
        appRoutesCount: appRoutes.length,
        methodCounts: methods.map(m => ({ method: m, count: routes.filter(r => r.method === m).length })),
        hasAppRoutes: appRoutes.length > 0,
        appRoutesRows: toRouteRows(appRoutes),
        hasDebugRoutes: debugRoutes.length > 0,
        debugRoutesRows: toRouteRows(debugRoutes),
    };
}

export function buildProfilerDetailViewModel(
    profile: IRequestProfile,
    panelName: Panel = "request",
    appRoutes: IRegisteredRoute[] = []
): Record<string, unknown> {
    const logErrors = profile.logs.filter(l => l.level === "error" || l.level === "critical").length;
    const hasException = profile.statusCode >= 400 || logErrors > 0;

    let panelData: unknown;
    switch (panelName) {
        case "performance":   panelData = buildPerformancePanel(profile); break;
        case "logs":          panelData = buildLogsPanel(profile); break;
        case "routing":       panelData = buildRoutingPanel(profile); break;
        case "configuration": panelData = buildConfigurationPanel(profile); break;
        case "database":      panelData = buildDatabasePanel(profile); break;
        case "exception":     panelData = buildExceptionPanel(profile); break;
        case "routes":        panelData = buildRoutesPanel(appRoutes); break;
        default:              panelData = buildRequestPanel(profile);
    }

    let banner: { bg: string; border: string; code: string; msg: string; isError: boolean };
    if (profile.statusCode >= 500) {
        banner = { bg: "#fcebec", border: "#e1142d", code: "#e1142d", msg: "#d98a8f", isError: true };
    } else if (profile.statusCode >= 400) {
        banner = { bg: "#fcebec", border: "#e1142d", code: "#e1142d", msg: "#d98a8f", isError: true };
    } else if (profile.statusCode >= 300) {
        banner = { bg: "#e3edf8", border: "#1565c0", code: "#1565c0", msg: "#6a9fd8", isError: false };
    } else {
        banner = { bg: "#e8f4ec", border: "#2e7d32", code: "#2e7d32", msg: "#6aaa6a", isError: false };
    }

    const panelLabel: Record<Panel, string> = {
        request: "Request / Response", performance: "Performance",
        logs: "Log Messages", routing: "Routing", configuration: "Configuration",
        database: "Database", exception: "Exception", routes: "Routes",
    };

    const appRoutesForBadge = appRoutes.filter(r => !r.path.startsWith("/_profiler") && r.path !== "/").length;

    const sidebarItems: ISidebarItem[] = [
        { icon: "route", label: "Request / Response", panel: "request", active: panelName === "request", badge: 0, badgeIsError: false },
        { icon: "perf", label: "Performance", panel: "performance", active: panelName === "performance", badge: 0, badgeIsError: false },
        {
            icon: "exception", label: "Exception", panel: "exception", active: panelName === "exception",
            badge: hasException ? (profile.statusCode >= 400 ? 1 : logErrors) : 0, badgeIsError: true,
        },
        {
            icon: "log", label: "Logs", panel: "logs", active: panelName === "logs",
            badge: profile.logs.length, badgeIsError: logErrors > 0,
        },
        {
            icon: "map", label: "Routes", panel: "routes", active: panelName === "routes",
            badge: appRoutesForBadge, badgeIsError: false,
        },
        { icon: "route", label: "Routing", panel: "routing", active: panelName === "routing", badge: 0, badgeIsError: false },
        {
            icon: "db", label: "Database", panel: "database", active: panelName === "database",
            badge: profile.queries.length, badgeIsError: false,
        },
        { icon: "config", label: "Configuration", panel: "configuration", active: panelName === "configuration", badge: 0, badgeIsError: false },
    ];

    return {
        profile: {
            method: profile.method,
            url: profile.url,
            statusCode: profile.statusCode,
            statusMessage: profile.statusMessage,
            ip: profile.request.ip,
            date: new Date(profile.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            time: new Date(profile.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            token6: profile.token.slice(0, 6),
        },
        banner,
        sidebarItems,
        panelName,
        panelLabel: panelLabel[panelName],
        panelData,
    };
}
