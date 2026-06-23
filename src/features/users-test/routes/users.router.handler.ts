import { OpticoreRoutingFactory, ICustomContext, IMultipleRouteDefinition } from "opticore-router";
import { UsersController } from "../controllers/users.controller";

export const UsersTestHandlerRouter: () => IMultipleRouteDefinition = () => {
    return OpticoreRoutingFactory.routes(
        UsersController,
        [
            {
                path: `/users`,
                method: "get",
                middlewares: [],
                handler: async () => await UsersController.findAll()
            },
            {
                path: `/users/:id`,
                method: "get",
                middlewares: [],
                handler: async (ctx: ICustomContext) => await UsersController.findById(ctx.req)
            },
            {
                path: `/add-users`,
                method: "post",
                middlewares: [],
                handler: async (ctx: ICustomContext) => await UsersController.create(ctx.req, ctx.res)
            },
            {
                path: `/users/:id`,
                method: "put",
                middlewares: [],
                handler: async (ctx: ICustomContext) => await UsersController.update(ctx.req)
            },
            {
                path: `/users/:id`,
                method: "delete",
                middlewares: [],
                handler: async (ctx: ICustomContext) => await UsersController.delete(ctx.req)
            }
        ]
    );
};