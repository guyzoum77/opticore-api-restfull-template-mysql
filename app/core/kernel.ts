import {express} from "opticore-core-module";
import {registerRoutes} from "../router/register.route";
import {dbConnection} from "../../config/database.config";

/**
 * kernel app
 */
export const Kernel = (): [express.Router[], () => void] => {
    return [
        registerRoutes(),
        dbConnection
    ];
}