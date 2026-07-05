import { OpticoreRoutingFactory, ICustomContext, IMultipleRouteDefinition } from "opticore-router";
import { DebugToolbarController } from "../controllers/debugToolbar.controller";

export const DebugToolbarHandlerRouter: () => IMultipleRouteDefinition = () => {
    return OpticoreRoutingFactory.routes(
        DebugToolbarController,
        [
            {
                path: "/_debug/toolbar",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.toolbarLatest(ctx.req, ctx.res)
            },
            {
                path: "/_debug/toolbar/:token",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.toolbarByToken(ctx.req, ctx.res)
            },
            {
                path: "/_debug/profiler",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.profilerList(ctx.req, ctx.res)
            },
            {
                path: "/_debug/profiler/latest",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.profilerLatestRedirect(ctx.req, ctx.res)
            },
            {
                path: "/_debug/profiler/:token",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.profilerDetail(ctx.req, ctx.res)
            },
            {
                path: "/_debug/api/profiles",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.apiProfiles(ctx.req, ctx.res)
            },
            {
                path: "/_debug/api/profiles/:token",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.apiProfileByToken(ctx.req, ctx.res)
            },
            {
                path: "/_debug/api/profiles",
                method: "delete",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.clearProfiles(ctx.req, ctx.res)
            },
            {
                path: "/_debug",
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => DebugToolbarController.debugIndexRedirect(ctx.req, ctx.res)
            }
        ]
    );
};
