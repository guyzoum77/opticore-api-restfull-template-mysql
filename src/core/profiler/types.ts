import type { Request, Response } from "opticore-express";

/**
 * ---------------------------------------------------------------------------
 * Phase 1 — Collection
 * ---------------------------------------------------------------------------
 * A DataCollector observes one facet of a request/response cycle. Collectors
 * never see or alter business code: they are wired up once, at bootstrap, via
 * decoration (DB client, logger) or via the profiler middleware's own hooks
 * (res.on('finish'), Express error middleware). `collect()` is called exactly
 * once per profiled request, after the response has been sent.
 */
export interface CollectorContext {
    token: string;
    req: Request;
    res: Response;
    /** Date.now() captured when the profiler middleware started handling this request. */
    startTime: number;
    /** process.hrtime.bigint() captured at the same instant, for sub-ms precision. */
    startHrTime: bigint;
    /** process.memoryUsage().heapUsed captured at the same instant. */
    heapUsedBefore: number;
}

export interface DataCollector<T = unknown> {
    /** Unique, stable identifier — also the key under which data is stored in Profile.collectors. */
    getName(): string;
    /** Called once, after the response has finished sending. May be async (e.g. flushing buffers). */
    collect(ctx: CollectorContext, error?: Error | null): void | Promise<void>;
    /** Returns the JSON-serializable data gathered by this collector. */
    getData(): T;
    /** Restores the collector to its initial state. Registry creates one instance per request, so
     *  reset() mainly matters for collectors that are reused (e.g. tests). */
    reset(): void;
}

export type CollectorFactory = () => DataCollector;

/**
 * ---------------------------------------------------------------------------
 * Phase 2 — Persistence
 * ---------------------------------------------------------------------------
 */
export interface Profile {
    token: string;
    ip: string;
    method: string;
    url: string;
    statusCode: number;
    /** Unix ms timestamp — when the request started. */
    time: number;
    /** Total request duration in ms — convenience mirror of the "time" collector's data. */
    duration: number;
    /** Response Content-Type — convenience mirror of the "request" collector's data, kept at the top level (like duration) so lightweight index entries (FileStorage.find(), which never load collector payloads) can still tell an HTML page navigation apart from a JSON/API response. */
    contentType?: string;
    /** collector name -> collector.getData() */
    collectors: Record<string, unknown>;
}

export interface ProfilerStorage {
    write(profile: Profile): Promise<void> | void;
    read(token: string): Promise<Profile | undefined> | Profile | undefined;
    /** Most recent profiles first. */
    find(limit?: number): Promise<Profile[]> | Profile[];
    /** Removes profiles older than `olderThanMs` (relative to Date.now()). No-op if omitted from options. */
    purge(olderThanMs?: number): Promise<void> | void;
    clear(): Promise<void> | void;
}

/**
 * ---------------------------------------------------------------------------
 * Phase 3 — Display
 * ---------------------------------------------------------------------------
 */
export interface SecurityConfig {
    /** Header/body/query keys that get masked before being persisted or displayed (case-insensitive). */
    sensitiveKeys: string[];
    maxUrlLength: number;
}

export interface ProfilerOptions {
    /** Master switch. Defaults to false — must be explicitly enabled (e.g. NODE_ENV === 'development'). */
    enabled: boolean;
    /** URL prefix under which the profiler UI/API is mounted. Requests under this prefix are never profiled. */
    routePrefix: string;
    storage: ProfilerStorage;
    /** Collector factories to run for every profiled request. Defaults to the 6 built-in collectors. */
    collectors?: CollectorFactory[];
    /** Retention window in ms for automatic purge (0 disables automatic purge). */
    retentionMs?: number;
    security?: Partial<SecurityConfig>;
    /** Max number of AJAX/main requests remembered in the toolbar's HTTP list. */
    maxRequests?: number;
    /**
     * Paths never profiled — no token, no toolbar injection, no entry in the
     * list/SSE/toolbar HTTP-requests table. Exact match or a trailing "/*"
     * prefix match (e.g. "/.well-known/*"). Defaults to the browser-noise
     * requests every site gets for free (favicon, Chrome DevTools probe) so
     * the HTTP-requests table only ever shows requests the app actually
     * handles as business logic.
     */
    excludePaths?: string[];
}

export const DEFAULT_EXCLUDE_PATHS: readonly string[] = ["/favicon.ico", "/.well-known/*"];

export const DEFAULT_SENSITIVE_KEYS: readonly string[] = [
    "authorization", "cookie", "set-cookie", "x-api-key", "session",
    "password", "passwd", "secret", "token", "access_token",
    "refresh_token", "api_key", "apikey", "private_key",
];

/* ---------------------------------------------------------------------------
 * Legacy flat projection — the existing views (toolbar/list/detail) and their
 * njk templates were built against this shape. Rather than rewrite that
 * (already-styled) rendering layer, the new Profile is flattened back into
 * this shape by view/legacyAdapter.ts. Kept here, verbatim, from the previous
 * debugToolbar.types.ts.
 * ------------------------------------------------------------------------- */
export interface ISqlQuery {
    sql: string;
    duration: number;
    timestamp: number;
    bindings?: unknown[];
    error?: string;
    type?: string;
    /** Origin call site, captured non-intrusively at the DB client decoration point. */
    stack?: string;
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

export interface ToolbarConfig {
    position: "bottom" | "top";
    maxRequests: number;
    maxUrlLength: number;
    theme: "dark" | "light";
    panels: PanelConfig[];
    autoHide: boolean;
    security: { allowedDomains: string[]; maxUrlLength: number };
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
    performance: unknown[];
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
    statusMessage: string;
    profilerUrl: string;
    statusCls: string;
    appVersion: string;
    nodeVersion: string;
    environment: string;
    method: string;
    url: string;
    token: string;
    base: string;
    duration: { formatted: string; barWidth: number; appFormatted: string; dbFormatted: string };
    memory: { formatted: string };
    logs: { count: number; errors: number; warnings: number; deprecations: number };
    route: { label: string; method: string };
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
    /** Raw request duration in ms — used by the toolbar's live SSE subscriber to render an HTTP-requests row identically to a client-tracked AJAX one. */
    duration: number;
    /** Response Content-Type — lets the toolbar's live SSE subscriber tell an API call apart from an HTML page navigation (see toolbar.view.ts's isApiRequest). */
    contentType?: string;
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
