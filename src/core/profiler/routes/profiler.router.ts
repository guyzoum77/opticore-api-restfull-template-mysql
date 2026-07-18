import type { TFeatureRoutes } from "opticore-router";
import { createProfilerRouterHandler } from "./profiler.router.handler";
import type { OpticoreProfiler } from "../middleware/profiler.middleware";

export function createProfilerRouter(profiler: OpticoreProfiler): TFeatureRoutes {
    const def = createProfilerRouterHandler(profiler);
    return { routes: [{ path: def.path, handler: def.handler }] };
}
