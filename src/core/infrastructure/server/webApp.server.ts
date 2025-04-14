import {LocalLanguageLoader, loggerConfig, YamlParsing} from "opticore-webapp-core";
import { express } from "opticore-express";
import { TFeatureRoutes, WebServer, envPath } from "opticore-webapp";
import { getEnvironnementValue, IEnvVariables} from "opticore-env-access";
import { registerRouter } from "../router/register.router";
import { LoggerConfigInterface, LoggerCore } from "opticore-logger";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { dependenciesProvider } from "../../providers/dependencies.provider";
import {TranslationLoader} from "opticore-translator";
import * as path from "node:path";
import * as process from "node:process";

/**
 * Express instance
 */
const appXpr = express();

/**
 * Loads environment variables from an .env file located in a specific folder.
 */
const getEnvVariablePath: IEnvVariables = getEnvironnementValue(envPath);

/**
 * set a default local language
 */
const localLanguage: string = getEnvVariablePath.defaultLocal;

/**
 * Loading a project local translation
 */
const localLang = new LocalLanguageLoader(localLanguage, path.join(process.cwd(), "src", "utils", "translations"));

/**
 * YAML file returning as a JavaScript Object contains some keys and values as
 * following: origin, methods, allowedHeaders, exposedHeaders,
 * credentials, maxAge, preflightContinue, optionsSuccessStatus.
 */
const yamlParsing: YamlParsing = new YamlParsing(localLanguage, envPath);

/**
 * Instantiate database to use his method
 */
const mySQL: OptiCoreMySQLDriver = new OptiCoreMySQLDriver(getEnvVariablePath, localLanguage);

/**
 * returning all Features modules routers
 */
const routers: TFeatureRoutes[] = registerRouter();


/**
 * Load cors options by YAML file
 */
const corsOptions: Promise<void> = yamlParsing.readFile("config/cors/corsOptions.yaml");

/**
 * Logger file configuration
 */
const logger: LoggerCore = new LoggerCore(loggerConfig(envPath) as LoggerConfigInterface);

/**
 * Instantiate application bootstrap.
 */
const app: WebServer = new WebServer(appXpr, logger, localLanguage, envPath, corsOptions);

/**
 * Running Server and loading routes register of all features modules.
 */
const server: any = app.onStartServer(
    routers,
    mySQL.databaseConnexionChecker(getEnvVariablePath, getEnvVariablePath.argumentsDatabaseConnection) as unknown as () => void,
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