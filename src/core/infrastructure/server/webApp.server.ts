import { LocalLanguageLoader, loggerConfig, YamlParsing } from "opticore-webapp-core";
import { express } from "opticore-express";
import { WebServer, envPath } from "opticore-webapp";
import { getEnvironnementValue } from "opticore-env-access";
import { registerRouter } from "../router/register.router";
import { ILoggerConfig, LoggerCore} from "opticore-logger";
import { dependenciesProvider } from "../../providers/dependencies.provider";

/**
 * YAML file returning as a JavaScript Object contains some keys and values as
 * following: origin, methods, allowedHeaders, exposedHeaders,
 * credentials, maxAge, preflightContinue, optionsSuccessStatus.
 */
const yamlParsing: YamlParsing = new YamlParsing(getEnvironnementValue(envPath).defaultLocal, envPath);

/**
 * Loading a project local translation
 */
new LocalLanguageLoader(getEnvironnementValue(envPath).defaultLocal, yamlParsing.absolutPath()).load();


/**
 * Instantiate application bootstrap.
 */
console.log("getEnvironnementValue(envPath).defaultLocal is : ", getEnvironnementValue(envPath).defaultLocal)
const app: WebServer = new WebServer(
    express(),
    new LoggerCore(loggerConfig(envPath) as ILoggerConfig),
    getEnvironnementValue(envPath).defaultLocal,
    envPath,
    yamlParsing.readFile("config/cors/corsOptions.yaml")
);

/**
 * Running Server and loading routes register of all features modules.
 */
const server: any = app.onStartServer(registerRouter(), dependenciesProvider);

/**
 * listening to all events triggered on server.
 */
app.onListeningOnServerEvent(server);

/**
 * listening to all requested requests on server.
 */
app.onRequestOnServerEvent(server);