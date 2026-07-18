import { EventEmitter } from "events";
import type { NextFunction, Request, RequestHandler, Response } from "opticore-express";
import { generateToken } from "../token";
import { runWithProfilerContext } from "../context";
import { CollectorRegistry } from "../registry";
import { createBuiltinCollectorFactories } from "../collectors";
import { installHtmlInjection } from "./htmlInjector";
import { buildToolbarSnippet } from "./snippet";
import { registerProcessErrorCapture } from "./errorHandler.middleware";
import { DEFAULT_EXCLUDE_PATHS, DEFAULT_SENSITIVE_KEYS, type Profile, type ProfilerOptions, type SecurityConfig } from "../types";

export interface OpticoreProfiler extends RequestHandler {
    registry: CollectorRegistry;
    options: Readonly<Required<Pick<ProfilerOptions, "enabled" | "routePrefix" | "storage" | "retentionMs" | "maxRequests" | "excludePaths">> & { security: SecurityConfig }>;
    /** Purges every stored profile. */
    clear(): Promise<void> | void;
    /**
     * Emits a "profile" event, with the lightweight IndexEntry-shaped
     * summary, right after every profile is persisted — the push side of the
     * profiler list's live updates (GET /_profiler/stream), so the list page
     * never has to poll the server.
     */
    events: EventEmitter;
}

const DEFAULT_ROUTE_PREFIX = "/_profiler";
const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_RETENTION_MS = 24 * 60 * 60 * 1000;

function isUnderPrefix(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}/`);
}

/** Exact match, or a trailing "/*" entry matched as a prefix (e.g. "/.well-known/*"). */
function isExcludedPath(path: string, excludePaths: readonly string[]): boolean {
    return excludePaths.some(pattern =>
        pattern.endsWith("/*") ? path.startsWith(pattern.slice(0, -1)) : path === pattern
    );
}

/**
 * Builds the profiler middleware. This is the single integration point an
 * application needs: `app.use(opticoreProfiler({ storage }))`.
 *
 * Per request (when enabled and outside routePrefix):
 *  1. generates a token and a fresh set of collector instances,
 *  2. runs the rest of the request inside an AsyncLocalStorage context so
 *     instrumented code (DB driver, logger) can reach those collectors,
 *  3. on res.on('finish'), asks every collector for its data, assembles a
 *     Profile and hands it to `storage.write()` — after the response has
 *     already been sent, so this adds no perceived latency,
 *  4. optionally rewrites an HTML response to inject the toolbar loader
 *     snippet before `</body>`.
 */
export function opticoreProfiler(options: Partial<ProfilerOptions> & { storage: ProfilerOptions["storage"] }): OpticoreProfiler {
    const enabled = options.enabled ?? false;
    const routePrefix = options.routePrefix ?? DEFAULT_ROUTE_PREFIX;
    const storage = options.storage;
    const retentionMs = options.retentionMs ?? DEFAULT_RETENTION_MS;
    const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
    const excludePaths = options.excludePaths ?? [...DEFAULT_EXCLUDE_PATHS];
    const security: SecurityConfig = {
        sensitiveKeys: options.security?.sensitiveKeys ?? [...DEFAULT_SENSITIVE_KEYS],
        maxUrlLength: options.security?.maxUrlLength ?? 100,
    };

    const events = new EventEmitter();
    events.setMaxListeners(0); // one listener per open SSE connection — no fixed cap

    const registry = new CollectorRegistry();

    if (options.collectors) {
        for (const factory of options.collectors) registry.register(factory);
    } else {
        for (const factory of createBuiltinCollectorFactories(security)) registry.register(factory);
    }

    if (enabled) registerProcessErrorCapture();

    const middleware = function opticoreProfilerMiddleware(req: Request, res: Response, next: NextFunction): void {
        if (!enabled || isUnderPrefix(req.path, routePrefix) || isExcludedPath(req.path, excludePaths)) {
            next();
            return;
        }

        const token = generateToken(8);
        const startTime = Date.now();
        const startHrTime = process.hrtime.bigint();
        const heapUsedBefore = process.memoryUsage().heapUsed;
        const collectors = registry.createAll();

        res.setHeader("X-Debug-Token", token);
        res.setHeader("X-Debug-Token-Link", `${routePrefix}/${token}`);

        installHtmlInjection(res, () => buildToolbarSnippet(token, routePrefix));

        res.on("finish", () => {
            void (async () => {
                for (const collector of collectors.values()) {
                    try {
                        await collector.collect({ token, req, res, startTime, startHrTime, heapUsedBefore });
                    } catch {
                        // A broken custom collector must never affect the app or other collectors.
                    }
                }

                const requestData = collectors.get("request")?.getData() as
                    | { method: string; url: string; request: { ip: string } }
                    | undefined;
                const timeData = collectors.get("time")?.getData() as { duration: number } | undefined;

                const profile: Profile = {
                    token,
                    ip: requestData?.request.ip ?? req.ip ?? "unknown",
                    method: requestData?.method ?? req.method,
                    url: requestData?.url ?? req.originalUrl ?? req.url,
                    statusCode: res.statusCode,
                    time: startTime,
                    duration: timeData?.duration ?? Date.now() - startTime,
                    contentType: res.getHeader("content-type") as string | undefined,
                    collectors: Object.fromEntries([...collectors].map(([name, c]) => [name, c.getData()])),
                };

                try {
                    await storage.write(profile);
                    events.emit("profile", profile);
                    if (retentionMs > 0) await storage.purge(retentionMs);
                } catch {
                    // Persistence failures must never surface to the client — the response is long gone.
                }
            })();
        });

        runWithProfilerContext({ token, collectors, startTime, startHrTime }, () => next());
    } as OpticoreProfiler;

    middleware.registry = registry;
    middleware.options = Object.freeze({ enabled, routePrefix, storage, retentionMs, maxRequests, excludePaths, security });
    middleware.clear = () => storage.clear();
    middleware.events = events;

    return middleware;
}
