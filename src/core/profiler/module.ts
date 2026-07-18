import { join } from "path";
import { express } from "opticore-express";
import type { Application, Request, Response, NextFunction } from "opticore-express";
import { OpticoreRoutingFactory } from "opticore-router";
import { configureProfilerViewEngine } from "./core/viewEngine.config";
import { setIntrospectedApp } from "./core/routeIntrospection";
import { createProfilerController } from "./controllers/profiler.controller";
import type { OpticoreProfiler } from "./middleware/profiler.middleware";

/**
 * Wires the profiler's *presentation* layer onto an Express app: the
 * Nunjucks view engine, static assets (CSS/JS) and the "/" landing page.
 * The profiler's own data routes (list/detail/wdt) are registered
 * separately via `createProfilerRouter(profiler)`, alongside the
 * application's other feature routers — see README.md for the full
 * integration example.
 *
 * Call this once, before `app.use(opticoreProfiler(...))` handles any
 * request, so the view engine and static assets are ready.
 */
export function registerProfilerViews(app: Application, profiler: OpticoreProfiler): void {
    setIntrospectedApp(app);
    configureProfilerViewEngine(app);

    // maxAge: 0 — the profiler only runs in dev, and these files change during
    // development; ETag-based revalidation (kept, so unchanged files still get
    // a cheap 304) beats a long maxAge silently serving a stale cached script
    // out of the browser's HTTP cache for up to an hour.
    app.use(`${profiler.options.routePrefix}/assets`, express.static(join(__dirname, "assets"), { maxAge: 0, etag: true }));

    const controller = createProfilerController(profiler);
    app.use(OpticoreRoutingFactory.route({
        method: "get",
        path: "/",
        handler: (async (ctx: { req: Request; res: Response }) => {
            await controller.home(ctx.req, ctx.res);
        }) as unknown as (req: Request, res: Response, next: NextFunction) => any,
    }));
}
