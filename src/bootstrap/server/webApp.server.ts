import { LocalLanguageLoader, loggerConfig, YamlParsing } from "opticore-webapp-core";
import { express } from "opticore-express";
import { WebServer, envPath } from "opticore-webapp";
import { getEnvironmentValue, IEnvVariables } from "opticore-env-access";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { ILoggerConfig, LoggerCore} from "opticore-logger";
import { registerRouter } from "../../app/router/register.router";
import { dependenciesProvider } from "../../helpers/providers/dependencies.provider";
import {
    opticoreProfiler,
    profilerErrorHandler,
    registerProfilerViews,
    createProfilerRouter,
    instrumentMySQL,
    instrumentLogger,
    FileStorage,
} from "opticore-profiler";



/**
 * All Environment values
 */
const environment: IEnvVariables = getEnvironmentValue(envPath);

/**
 * YAML file returning as a JavaScript Object contains some keys and values as
 * following: origin, methods, allowedHeaders, exposedHeaders,
 * credentials, maxAge, preflightContinue, optionsSuccessStatus.
 */
const yamlParsing: YamlParsing = new YamlParsing(environment.defaultLocal, envPath);

/**
 * Loading a project local translation
 */
new LocalLanguageLoader(environment.defaultLocal, yamlParsing.absolutPath()).load();

/**
 * Instantiate application bootstrap.
 */
const app: WebServer = new WebServer({
    app: express(),
    corsOriginOptions: yamlParsing.readFile("config/cors/corsOptions.yaml"),
    environmentPath: envPath,
    localLanguage: environment.defaultLocal,
    loggerConfig: new LoggerCore(loggerConfig(envPath) as ILoggerConfig),
    hotReload: {
        rootDir: getEnvironmentValue(envPath).rootDir,
        watchExtensions: getEnvironmentValue(envPath).watchExtensions,
        hotReloadExtensions: getEnvironmentValue(envPath).hotReloadExtensions,
        ignore: getEnvironmentValue(envPath).ignore,
        debounceMs: getEnvironmentValue(envPath).debounceMs,
    }
});

/**
 * Decorate the DB driver and logger *once*, at bootstrap — this is the only
 * place profiling touches infrastructure code, and it never touches business
 * code: every `db.query(...)` / `logger.info(...)` call anywhere in the app
 * keeps working exactly as written.
 */
instrumentMySQL(OptiCoreMySQLDriver);
instrumentLogger(LoggerCore);

/**
 * The profiler: collection -> token-based persistence -> deferred AJAX
 * display, modeled on Symfony's WebProfilerBundle. Gated by
 * PROFILE_WEB_TOOL_BAR in config/env/.env (loaded into process.env by
 * getEnvironmentValue() above) — the same flag the previous debug toolbar
 * used. Defaults to disabled if the flag is missing or not "true".
 */
const profiler = opticoreProfiler({
    enabled: process.env.PROFILE_WEB_TOOL_BAR === "true",
    storage: new FileStorage(process.env.PROFILE_CACHE_PATH),
});

/**
 * Mount the profiler middleware and its views on WebServer's internal
 * Express app before routes are set up — registerProfilerViews() also
 * registers the "/" landing page early, ahead of the static "public/template"
 * middleware WebServer's onStartServer() adds, so that middleware never
 * shadows it.
 */
(app as any).expressApp.use(profiler);
registerProfilerViews((app as any).expressApp, profiler);

/**
 * Running Server and loading routes register of all features modules.
 */
const server = app.onStartServer(
    registerRouter([createProfilerRouter(profiler)]),
    () => new OptiCoreMySQLDriver(environment, environment.defaultLocal),
    dependenciesProvider
);

/**
 * Error-handling middleware must be mounted after every route — appended
 * here, once routes exist, so ExceptionCollector sees errors the app's own
 * handlers forward via next(err). It only records; it never responds itself.
 */
(app as any).expressApp.use(profilerErrorHandler());

/**
 * listening to all events triggered on server.
 */
app.onListeningOnServerEvent(server!);


/**
 * listening to all requested requests on server.
 */
app.onRequestOnServerEvent(server!);