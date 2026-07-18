import type { CollectorContext, DataCollector, IRequestInfo, IResponseInfo, IRouteInfo } from "../types";
import { Masker } from "../security/masker";

const HTTP_STATUS_MESSAGES: Record<number, string> = {
    100: "Continue", 101: "Switching Protocols",
    200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
    301: "Moved Permanently", 302: "Found", 304: "Not Modified",
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
    405: "Method Not Allowed", 409: "Conflict", 422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable",
};

function statusMessage(code: number): string {
    return HTTP_STATUS_MESSAGES[code] ?? "Unknown";
}

export interface RequestCollectorData {
    method: string;
    url: string;
    statusCode: number;
    statusMessage: string;
    request: IRequestInfo;
    response: IResponseInfo;
    route: IRouteInfo;
}

/**
 * Observes the request/response objects purely by reading their already-public
 * properties inside collect() — nothing here touches how the application
 * builds its request or sends its response.
 */
export class RequestCollector implements DataCollector<RequestCollectorData> {
    private data: RequestCollectorData | null = null;

    constructor(private readonly masker: Masker = new Masker()) {}

    getName(): string {
        return "request";
    }

    collect(ctx: CollectorContext): void {
        const { req, res } = ctx;
        const statusCode = res.statusCode;

        this.data = {
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode,
            statusMessage: statusMessage(statusCode),
            request: {
                method: req.method,
                url: req.originalUrl || req.url,
                headers: this.masker.maskShallow(req.headers as Record<string, unknown>) as IRequestInfo["headers"],
                query: this.masker.maskDeep(req.query ?? {}) as Record<string, unknown>,
                body: this.masker.maskDeep(req.body ?? {}) as Record<string, unknown>,
                params: (req.params ?? {}) as Record<string, string | string[]>,
                ip: req.ip ?? req.socket?.remoteAddress ?? "unknown",
                cookies: this.masker.maskShallow((req as unknown as { cookies?: Record<string, string> }).cookies ?? {}),
                protocol: req.protocol,
                hostname: req.hostname,
            },
            response: {
                statusCode,
                statusMessage: statusMessage(statusCode),
                headers: this.masker.maskShallow(res.getHeaders() as Record<string, unknown>) as Record<string, string>,
                contentType: res.getHeader("content-type") as string | undefined,
                body: undefined,
            },
            route: {
                path: (req as unknown as { route?: { path?: string } }).route?.path ?? req.url,
                method: req.method,
                params: (req.params ?? {}) as Record<string, string | string[]>,
                controller: (req as unknown as { route?: { stack?: { name?: string }[] } }).route?.stack?.[0]?.name,
            },
        };
    }

    getData(): RequestCollectorData {
        if (!this.data) {
            throw new Error("RequestCollector.getData() called before collect()");
        }
        return this.data;
    }

    reset(): void {
        this.data = null;
    }
}
