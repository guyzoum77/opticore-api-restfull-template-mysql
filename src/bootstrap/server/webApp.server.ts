import { LocalLanguageLoader, loggerConfig, YamlParsing } from "opticore-webapp-core";
import { express } from "opticore-express";
import { WebServer, envPath } from "opticore-webapp";
import { getEnvironmentValue, IEnvVariables } from "opticore-env-access";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { ILoggerConfig, LoggerCore} from "opticore-logger";
import { registerRouter } from "../../app/router/register.router";
import { dependenciesProvider } from "../../helpers/providers/dependencies.provider";
import { registerDebugToolbar } from "../../core/debug/debugToolbar.module";



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
        rootDir: "src",
        watchExtensions: [".ts", ".js", ".json"],
        hotReloadExtensions: [".json"],
        ignore: ["uploads", "tmp", "node_modules"],
        debounceMs: 300,
    }
});

/**
 * Register debug toolbar on WebServer's internal Express app before routes are set up.
 */
registerDebugToolbar((app as any).expressApp);

/**
 * Running Server and loading routes register of all features modules.
 */
const server = app.onStartServer(
    registerRouter(),
    () => new OptiCoreMySQLDriver(environment, environment.defaultLocal),
    dependenciesProvider
);

/**
 * listening to all events triggered on server.
 */
app.onListeningOnServerEvent(server!);

/**
 * listening to all requested requests on server.
 */
app.onRequestOnServerEvent(server!);