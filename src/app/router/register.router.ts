import { OpticoreRegisterRouter, TFeatureRoutes } from "opticore-router";
import { UsersTestRouter } from "../../features/users-test/routes/users.router";


/**
 * Feature routers registration function
 *
 * This function centralizes the registration of all application feature routers.
 * It uses the OpticoreRegisterRouter class to initialize and register
 * the various routes for application features.
 *
 * @param extraRoutes - Feature routers assembled by the caller (e.g. the
 * profiler router, built from the same `opticoreProfiler()` instance mounted
 * as middleware — see webApp.server.ts).
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
 * Example : UsersTestRouter is It' only just for test, remove it when you will start to dev
 */
export const registerRouter: (extraRoutes?: TFeatureRoutes[]) => TFeatureRoutes[] = (extraRoutes = []): TFeatureRoutes[] => {

    return new OpticoreRegisterRouter().registered([
        ...extraRoutes,
        UsersTestRouter,
        // Add new features here as they are developed
    ]);
}