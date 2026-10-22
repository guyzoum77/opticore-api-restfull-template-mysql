import { envPath, IWebServerConfig } from "opticore-webapp";
import { getEnvironmentValue, IEnvVariables } from "opticore-env-access";
import { LoggerCore } from "opticore-logger";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { FileStorage, instrumentLogger, instrumentMySQL } from "opticore-profiler";
import { registerRouter } from "../../app/router/register.router";
import { dependenciesProvider } from "../../helpers/providers/dependencies.provider";
import { webServerOptions } from "../providers/webServerOptions.provider";
import { connectMySQL } from "../providers/database.provider";


const environment: IEnvVariables = getEnvironmentValue(envPath);

/**
 * The startup configuration of the web server, run by `bootstrapWebServer()` — references only.
 *
 * Only `server` and `routers` are required. Add the other keys when the project needs them, each one with the
 * project's own functions: guards, bodyParsers, preMiddlewares, postMiddlewares, eventSubscribers, startupTasks,
 * scheduledJobs (defineScheduledJobs), intervals, workers, serverAttachments (real-time / WebSocket), serverEvents,
 * shutdown.
 */
export const appConfig: IWebServerConfig = {
    server: webServerOptions,
    /** The DB driver and the logger decorated once for the profiler; business code is never touched. */
    instrumentation: [
        (): void => { instrumentMySQL(OptiCoreMySQLDriver); },
        (): void => { instrumentLogger(LoggerCore); },
    ],
    /** Symfony-like profiler, gated by PROFILE_WEB_TOOL_BAR in config/env/.env — wired by the WebServer. */
    profiler: { enabled: environment.profileWebToolbar, storage: new FileStorage(environment.profileCachePath) },
    routers: registerRouter(),
    database: connectMySQL,
    dependencies: dependenciesProvider,
};
