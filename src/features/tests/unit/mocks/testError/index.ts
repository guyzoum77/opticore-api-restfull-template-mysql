// src/app/features/test/index.ts

import testRouter from "./routes/test.routes";
import { TFeatureRoutes,  ICustomContext } from "opticore-router";
import { TestErrorController } from "./controller/testErrorController";

export const testFeatureRoutes: TFeatureRoutes = {
    routes: [
        {
            path: '/api/test',
            handler: testRouter
        },
        // 2nd way to use handler, you can set a controller method like you see.
        {
            path: '/test-hot-reload',
            handler: async(context: ICustomContext) => TestErrorController.testUncaughtException(context.res)
        }
    ]
};