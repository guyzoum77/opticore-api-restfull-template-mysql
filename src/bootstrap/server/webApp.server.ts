import { bootstrapWebServer } from "opticore-webapp";
import { appConfig } from "../config/app.config";


/**
 * Starts the web server from its startup configuration (bootstrap/config/app.config.ts): the routes, the database,
 * the profiler, the server's events — in the order the WebServer sets.
 */
bootstrapWebServer(appConfig);
