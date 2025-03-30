import { OpticoreRegisterRouter } from "opticore-router";
import { TFeatureRoutes } from "opticore-webapp";

export const registerRouter: () => TFeatureRoutes[] = (): TFeatureRoutes[] => {
    return new OpticoreRegisterRouter().registered([
    ]);
}