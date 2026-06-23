import { UsersTestHandlerRouter } from "./users.router.handler";
import { TFeatureRoutes } from "opticore-router";

export const UsersTestRouter: TFeatureRoutes = {
    routes: [
        {
            path: UsersTestHandlerRouter().path,
            handler: UsersTestHandlerRouter().handler
        }
    ]
};