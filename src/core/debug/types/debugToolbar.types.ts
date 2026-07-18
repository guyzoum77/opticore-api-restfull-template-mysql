import {sqlTotalTime} from "../views/helpers.view";

export interface ISqlQuery {
    sql: string;
    duration: number;
    timestamp: number;
    bindings?: unknown[];
    error?: string;
    type?: string;
}

export interface ILogEntry {
    level: "debug" | "info" | "warning" | "error" | "critical" | "deprecation";
    message: string;
    timestamp: number;
    context?: Record<string, unknown>;
}

export interface IRouteInfo {
    path: string;
    method: string;
    handler?: string;
    middlewares?: string[];
    params?: Record<string, string | string[]>;
    controller?: string;
}

export interface IRequestInfo {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, unknown>;
    body: Record<string, unknown>;
    params: Record<string, string | string[]>;
    ip: string;
    cookies?: Record<string, string>;
    protocol?: string;
    hostname?: string;
}

export interface IResponseInfo {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    contentType?: string;
    body?: unknown;
}

export interface IPerformanceEntry {
    name: string;
    duration: number;
    category: string;
    startOffset: number;
}

export interface ProfileMetrics {
    sqlTotalTime: number;
    sqlCount: number;
    logCount: number;
    logErrors: number;
    logWarnings: number;
    logDeprecations: number;
    httpCount: number;
    memoryFormatted: string;
    durationFormatted: string;
    statusClass: string;
}

export interface PanelConfig {
    id: string;
    enabled: boolean;
    label: string;
    icon: string;
    order: number;
}

export interface SecurityConfig {
    allowedDomains: string[];
    maxUrlLength: number;
}

export interface ToolbarConfig {
    position: "bottom" | "top";
    maxRequests: number;
    maxUrlLength: number;
    theme: "dark" | "light";
    panels: PanelConfig[];
    autoHide: boolean;
    security: SecurityConfig;
}

export interface IRequestProfile {
    token: string;
    timestamp: number;
    method: string;
    url: string;
    statusCode: number;
    statusMessage: string;
    duration: number;
    memoryUsage: number;
    queries: ISqlQuery[];
    logs: ILogEntry[];
    route: IRouteInfo;
    request: IRequestInfo;
    response: IResponseInfo;
    performance: IPerformanceEntry[];
    nodeVersion: string;
    appVersion: string;
    environment: string;
}

export interface IToolbarHttpRow {
    isCurrent: boolean;
    method: string;
    url: string;
    fullUrl: string;
    token: string;
    statusCode: number;
    statusClass: string;
    duration: string;
}

export interface IToolbarBarViewModel {
    statusCode: number;
    profilerUrl: string;
    statusCls: string;
    appVersion: string;
    base: string;
    duration: { formatted: string; barWidth: number };
    memory: { formatted: string };
    logs: { count: number; errors: number; warnings: number };
    route: { label: string };
    http: { count: number; rows: IToolbarHttpRow[] };
}

export type ProfilerListTab = "requests" | "commands";

export interface IProfilerListRow {
    token: string;
    tokenShort: string;
    statusCode: number;
    statusClass: "ok" | "redirect" | "error";
    method: string;
    url: string;
    dateStr: string;
    timeStr: string;
}

export interface IProfilerListViewModel {
    tab: ProfilerListTab;
    resultCount: number;
    rows: IProfilerListRow[];
    autoReload: boolean;
    filters: {
        ip: string;
        status: string;
        search: string;
        token: string;
        from: string;
        until: string;
        hasProfiles: boolean;
        methodOptions: { value: string; label: string; selected: boolean }[];
        limitOptions: { value: number; selected: boolean }[];
    };
    tabs: {
        requests: { href: string; active: boolean };
        commands: { href: string; active: boolean };
    };
}

export type Panel = "request" | "performance" | "logs" | "routing" | "configuration" | "database" | "exception" | "routes";

export interface IKvRow {
    key: string;
    value?: string;
    title?: string;
    truncate?: boolean;
    code?: boolean;
    badge?: { text: string; variant: "ok" | "warn" | "info" | "muted" };
}

export interface ISidebarItem {
    icon: string;
    label: string;
    panel: Panel;
    active: boolean;
    badge: number;
    badgeIsError: boolean;
}

export interface IRoutePathSegment { type: "text" | "param"; value: string }

export interface IRouteTableRow { methodClass: string; method: string; pathSegments: IRoutePathSegment[]; middlewareCount: number }

export interface IRoutesPanelData {
    hasRoutes: boolean;
    totalRoutes: number;
    appRoutesCount: number;
    methodCounts: { method: string; count: number }[];
    hasAppRoutes: boolean;
    appRoutesRows: IRouteTableRow[];
    hasDebugRoutes: boolean;
    debugRoutesRows: IRouteTableRow[];
}

export interface IExceptionErrorLog { levelUpper: string; message: string; contextJson: string | null }

export interface IExceptionPanelData {
    noException: boolean;
    showBanner: boolean;
    statusCode: number;
    statusMessage: string;
    method: string;
    url: string;
    errLogs: IExceptionErrorLog[];
}

export interface IConfigurationPanelData {
    appInfo: IKvRow[];
    envRows: IKvRow[];
    envCount: number;
}

export interface IRoutingPanelData {
    routeRows: IKvRow[];
    hasRouteParams: boolean;
    routeParamsRows: IKvRow[];
    hasQueryParams: boolean;
    queryParamsRows: IKvRow[];
}

export interface ILogExtra {
    showContextBtn: boolean;
    showTraceBtn: boolean;
    ctxId: string;
    stackId: string;
    ctxJson: string | null;
    stackText: string | null;
}

export interface ILogRow {
    rowClass: string;
    logType: string;
    timeStr: string;
    levelCls: string;
    level: string;
    message: string;
    source: string;
    extra: ILogExtra | null;
}

export interface ILogsPanelData {
    hasLogs: boolean;
    errCount: number;
    warnCount: number;
    deprCount: number;
    rows: ILogRow[];
}

export interface ISqlQueryRow {
    type: string;
    index: number;
    hasError: boolean;
    durationFormatted: string;
    sql: string;
    bindingsJson: string | null;
    error: string | null;
}

export interface IDatabasePanelData {
    hasQueries: boolean;
    totalCount: number;
    totalTimeFormatted: string;
    avgFormatted: string;
    queries: ISqlQueryRow[];
}

export interface ITimelineEvent { label: string; widthPct: string; color: string; durationFormatted: string }

export interface IPerformancePanelData {
    total: number;
    appTime: number;
    memoryMiB: string;
    hasEvents: boolean;
    events: ITimelineEvent[];
    hasSqlTime: boolean;
    processInfo: IKvRow[];
}

export interface IRequestPanelData {
    statusOk: boolean;
    statusCode: number;
    durationFormatted: string;
    memoryFormatted: string;
    sqlQueryCount: number;
    getParams: IKvRow[];
    postParams: IKvRow[];
    routeParams: IKvRow[];
    attributes: IKvRow[];
    requestHeaders: IKvRow[];
    responseHeaders: IKvRow[];
    hasCookies: boolean;
    cookies: IKvRow[];
    responseBodyJson: string | null;
}