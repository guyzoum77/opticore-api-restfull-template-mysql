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