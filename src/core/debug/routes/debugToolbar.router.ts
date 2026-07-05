import { DebugToolbarHandlerRouter } from "./debugToolbar.router.handler";
import { TFeatureRoutes } from "opticore-router";

export const DebugToolbarRouter: TFeatureRoutes = {
    routes: [
        {
            path: DebugToolbarHandlerRouter().path,
            handler: DebugToolbarHandlerRouter().handler
        }
    ]
};
