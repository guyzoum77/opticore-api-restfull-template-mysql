"use strict";
// src/app/features/test/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFeatureRoutes = void 0;
const tslib_1 = require("tslib");
const test_routes_1 = tslib_1.__importDefault(require("./routes/test.routes"));
const testErrorController_1 = require("./controller/testErrorController");
exports.testFeatureRoutes = {
    routes: [
        {
            path: '/api/test',
            handler: test_routes_1.default
        },
        // 2nd way to use handler, you can set a controller method like you see.
        {
            path: '/test-hot-reload',
            handler: async (context) => testErrorController_1.TestErrorController.testUncaughtException(context.res)
        }
    ]
};
//# sourceMappingURL=index.js.map