import { LocalLanguageLoader, loggerConfig, YamlParsing } from "opticore-webapp-core";
import { express } from "opticore-express";
import { WebServer, envPath } from "opticore-webapp";
import { getEnvironnementValue, IEnvVariables } from "opticore-env-access";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { ILoggerConfig, LoggerCore} from "opticore-logger";
import { registerRouter } from "../../app/router/register.router";
import { dependenciesProvider } from "../../helpers/providers/dependencies.provider";


/**
 * All Environment values
 */
const environment: IEnvVariables = getEnvironnementValue(envPath);

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
const app: WebServer = new WebServer(
    express(),
    new LoggerCore(loggerConfig(envPath) as ILoggerConfig),
    environment.defaultLocal,
    envPath,
    yamlParsing.readFile("config/cors/corsOptions.yaml")
);

/**
 * Running Server and loading routes register of all features modules.
 */
const server: any = app.onStartServer(
    registerRouter(),
    ((): void => new OptiCoreMySQLDriver(environment, environment.defaultLocal).connect()),
    dependenciesProvider
);

/**
 * listening to all events triggered on server.
 */
app.onListeningOnServerEvent(server);

/**
 * listening to all requested requests on server.
 */
app.onRequestOnServerEvent(server);