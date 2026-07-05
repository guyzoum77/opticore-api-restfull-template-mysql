import { join } from "path";
import { express } from "opticore-express";
import type { Application, Request, Response, NextFunction } from "opticore-express";
import { OpticoreRoutingFactory } from "opticore-router";
import { debugToolbarMiddleware } from "./middleware/debugToolbar.middleware";
import { configureDebugViewEngine } from "./config/viewEngine.config";
import { debugStore } from "./store/debugToolbar.store";
import { DebugToolbarController } from "./controllers/debugToolbar.controller";
import type { ILogEntry } from "./types/debugToolbar.types";


export interface IRegisteredRoute {
    method: string;
    path: string;
    middlewareCount: number;
}

// Holds the Express app reference once registerDebugToolbar() is called.
// Routes are read lazily (after all app routes have been registered).
let _expressApp: Application | null = null;

function getLayerPrefix(layer: any): string {
    try {
        const src: string = layer.regexp?.source ?? "";
        if (!src) return "";

        // Root / catch-all patterns → no prefix
        if (
            src === "^\\/?(?=\\/|$)" ||
            src === "^\\/(?=\\/|$)"  ||
            src === "^\\/?$"         ||
            src === "^\\/$"
        ) return "";

        // Express 4 encodes path /foo as: ^\/foo\/?(?=\/|$)
        // Strip ^ prefix, then cut off at the first end-marker
        let s = src.startsWith("^") ? src.slice(1) : src;

        // Find the earliest occurrence of any Express end-marker
        const markers = ["\\/?(?=", "(?=\\/", "\\/?$", "(?=$)"];
        let endIdx = s.length;
        for (const m of markers) {
            const i = s.indexOf(m);
            if (i !== -1 && i < endIdx) endIdx = i;
        }
        s = s.slice(0, endIdx);

        // Unescape \/ → /  and  \. → .
        s = s.replace(/\\\//g, "/").replace(/\\\./g, ".");
        // Strip trailing /?
        if (s.endsWith("/?")) s = s.slice(0, -2);

        return s && s !== "/" ? s : "";
    } catch {
        return "";
    }
}

function extractRoutesFromApp(app: Application): IRegisteredRoute[] {
    const result: IRegisteredRoute[] = [];

    function traverse(stack: any[], prefix: string): void {
        for (const layer of stack ?? []) {
            if (!layer) continue;

            if (layer.route) {
                const methods: string[] = Object.keys(layer.route.methods ?? {})
                    .filter((m: string) => layer.route.methods[m])
                    .map((m: string) => m.toUpperCase());

                const routePath = String(layer.route.path ?? "");
                const fullPath  = (prefix + routePath).replace(/\/+/g, "/") || "/";

                for (const method of methods) {
                    result.push({
                        method,
                        path: fullPath,
                        middlewareCount: layer.route.stack?.length ?? 1,
                    });
                }
            } else if (layer.handle && typeof layer.handle === "function" && layer.handle.stack) {
                const seg = getLayerPrefix(layer);
                traverse(layer.handle.stack, prefix + seg);
            }
        }
    }

    const router: any = (app as any)._router ?? (app as any).router;
    traverse(router?.stack ?? [], "");
    return result;
}

export function getExpressRoutes(): IRegisteredRoute[] {
    if (!_expressApp) return [];
    return extractRoutesFromApp(_expressApp);
}

function createHomeRoute() {
    // Mounted directly (not via registerRouter()/TFeatureRoutes) so it is registered
    // before WebServer's onStartServer() adds its "public/template" static middleware —
    // otherwise a public/template/index.html would shadow this route at "/".
    return OpticoreRoutingFactory.route({
        method: "get",
        path: "/",
        handler: (async (ctx: { req: Request; res: Response }) => {
            await DebugToolbarController.home(ctx.req, ctx.res);
        }) as unknown as (req: Request, res: Response, next: NextFunction) => any,
    });
}

let _errorCaptureRegistered = false;

function extractFirstFrame(stack: string): string {
    if (!stack) return "";
    for (const line of stack.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("at ")) continue;
        if (t.startsWith("at node:") || t.includes("(node:") || t.includes("node:internal")) continue;
        if (t.includes("(<anonymous>)")) continue;
        const m = t.match(/\((.+:\d+:\d+)\)$/) ?? t.match(/at (.+:\d+:\d+)$/);
        if (m) return m[1];
    }
    return "";
}

function buildErrorLogEntry(
    err: Error,
    type: "UncaughtException" | "UnhandledRejection"
): ILogEntry {
    const source = extractFirstFrame(err.stack ?? "");
    const context: Record<string, unknown> = {
        type,
        name: err.name ?? "Error",
        stack: err.stack ?? "",
    };
    if (source) context.source = source;
    return {
        level: "error",
        message: `${err.name ?? "Error"}: ${err.message}`,
        timestamp: Date.now(),
        context,
    };
}

function registerGlobalErrorCapture(): void {
    if (_errorCaptureRegistered) return;
    _errorCaptureRegistered = true;

    // uncaughtExceptionMonitor fires before any uncaughtException handler —
    // read-only: does not prevent the default behaviour or other listeners.
    (process as any).on("uncaughtExceptionMonitor", (err: Error) => {
        try {
            debugStore.patchLatestLogs(buildErrorLogEntry(err, "UncaughtException"));
        } catch { /* never let observer crash the process */ }
    });

    process.on("unhandledRejection", (reason: unknown) => {
        try {
            const err = reason instanceof Error
                ? reason
                : new Error(String(reason));
            debugStore.patchLatestLogs(buildErrorLogEntry(err, "UnhandledRejection"));
        } catch { /* never let observer crash the process */ }
    });
}

export function registerDebugToolbar(app: Application): void {
    _expressApp = app;
    registerGlobalErrorCapture();
    configureDebugViewEngine(app);
    app.use(debugToolbarMiddleware);
    app.use("/_debug/assets", express.static(join(__dirname, "assets"), { maxAge: "1h" }));
    app.use(createHomeRoute());
}

export { sqlCollector } from "./collectors/sql.collector";
export { logCollector } from "./collectors/log.collector";
export { debugStore } from "./store/debugToolbar.store";
export { ToolbarConfigBuilder, defaultToolbarConfig } from "./config/toolbar.config";
export { SecurityService } from "./core/security.service";
export { MetricsService } from "./core/metrics.service";
export type { IRequestProfile, ISqlQuery, ILogEntry, ToolbarConfig, ProfileMetrics } from "./types/debugToolbar.types";
