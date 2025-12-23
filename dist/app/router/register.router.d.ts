import { TFeatureRoutes } from "opticore-router";
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
export declare const registerRouter: () => TFeatureRoutes[];
