"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRouter = void 0;
const opticore_router_1 = require("opticore-router");
const testError_1 = require("../../features/tests/unit/mocks/testError");
/**
 * Feature routers registration function
 *
 * This function centralizes the registration of all application feature routers.
 * It uses the OpticoreRegisterRouter class to initialize and register
 * the various routes for application features.
 *
 * @returns {TFeatureRoutes[]} - Array containing all registered routes
 *
 *
 * @see TFeatureRoutes - Type defining the structure of a feature route
 * @see OpticoreRegisterRouter - Class responsible for route registration
 * @see testFeatureRoutes - Example of registered feature route
 *
 * @remarks
 * This function follows the Factory pattern for route creation
 * and allows easy extensibility by adding new features
 * in the registered() array
 */
const registerRouter = () => {
    return new opticore_router_1.OpticoreRegisterRouter().registered([
        testError_1.testFeatureRoutes, // It' only just for test, remove it when you will start to dev
        // Add new features here as they are developed
    ]);
};
exports.registerRouter = registerRouter;
//# sourceMappingURL=register.router.js.map