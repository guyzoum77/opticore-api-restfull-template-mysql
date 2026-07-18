import { OpticoreRoutingFactory, ICustomContext, IMultipleRouteDefinition } from "opticore-router";
import { createProfilerController } from "../controllers/profiler.controller";
import type { OpticoreProfiler } from "../middleware/profiler.middleware";

/**
 * Builds the profiler's own routes:
 *  - GET /_profiler                 list of recent profiles
 *  - GET /_profiler/stream          Server-Sent Events feed of new profiles (powers the list page's live updates)
 *  - GET /_profiler/latest          redirect to the most recent profile
 *  - GET /_profiler/wdt/:token      toolbar fragment, loaded via AJAX from the injected snippet
 *  - GET /_profiler/:token          detailed view, one panel per collector
 *
 * All mounted under `profiler.options.routePrefix` — which the profiler
 * middleware itself already excludes from profiling.
 */
export function createProfilerRouterHandler(profiler: OpticoreProfiler): IMultipleRouteDefinition {
    const controller = createProfilerController(profiler);
    const prefix = profiler.options.routePrefix;

    return OpticoreRoutingFactory.routes(
        controller,
        [
            {
                path: `${prefix}/wdt/:token`,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => controller.wdt(ctx.req, ctx.res),
            },
            {
                path: `${prefix}/stream`,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => controller.stream(ctx.req, ctx.res),
            },
            {
                path: `${prefix}/latest`,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => controller.latestRedirect(ctx.req, ctx.res),
            },
            {
                path: `${prefix}/:token`,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => controller.detail(ctx.req, ctx.res),
            },
            {
                path: prefix,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => controller.list(ctx.req, ctx.res),
            },
        ]
    );
}
