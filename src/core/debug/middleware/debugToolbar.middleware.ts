import { Request, Response, NextFunction } from "opticore-express";
import { randomBytes } from "crypto";
import { debugStore } from "../store/debugToolbar.store";
import { sqlCollector } from "../collectors/sql.collector";
import { logCollector } from "../collectors/log.collector";
import { IRequestProfile } from "../types/debugToolbar.types";

const HTTP_STATUS_MESSAGES: Record<number, string> = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable"
};

function statusMessage(code: number): string {
    return HTTP_STATUS_MESSAGES[code] ?? "Unknown";
}

export function debugToolbarMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.url.startsWith("/_debug") || req.url === "/" || req.url === "") {
        return next();
    }

    const token = randomBytes(6).toString("hex");
    const startTime = Date.now();
    const startHrTime = process.hrtime.bigint();

    (req as any).__debugToken = token;

    sqlCollector.startRequest(token);
    logCollector.startRequest(token);

    res.setHeader("X-Debug-Token", token);
    res.setHeader("X-Debug-Token-Link", `/_debug/profiler/${token}`);

    res.on("finish", () => {
        const durationNs = process.hrtime.bigint() - startHrTime;
        const duration = Number(durationNs / 1_000_000n);
        const memoryUsage = process.memoryUsage().heapUsed;

        const queries = sqlCollector.flush(token);
        const logs = logCollector.flush(token);

        const profile: IRequestProfile = {
            token,
            timestamp: startTime,
            method: req.method,
            url: req.originalUrl || req.url,
            statusCode: res.statusCode,
            statusMessage: statusMessage(res.statusCode),
            duration,
            memoryUsage,
            queries,
            logs,
            route: {
                path: (req as any).route?.path ?? req.url,
                method: req.method,
                params: req.params ?? {},
                controller: (req as any).route?.stack?.[0]?.name,
            },
            request: {
                method: req.method,
                url: req.originalUrl || req.url,
                headers: req.headers as Record<string, string>,
                query: (req.query ?? {}) as Record<string, unknown>,
                body: req.body ?? {},
                params: req.params ?? {},
                ip: req.ip ?? req.socket.remoteAddress ?? "unknown",
                cookies: req.cookies ?? {},
                protocol: req.protocol,
                hostname: req.hostname,
            },
            response: {
                statusCode: res.statusCode,
                statusMessage: statusMessage(res.statusCode),
                headers: res.getHeaders() as Record<string, string>,
                contentType: res.getHeader("content-type") as string | undefined,
                body: undefined,
            },
            performance: [],
            nodeVersion: process.version,
            appVersion: process.env.npm_package_version ?? "1.0.0",
            environment: process.env.NODE_ENV ?? "development",
        };

        debugStore.save(profile);
    });

    next();
}
