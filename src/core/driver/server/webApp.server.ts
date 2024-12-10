import {CoreApplication, express, YamlParsing} from "opticore-core-module";
import {dbConnection} from "../../databaseConnection";
import {registerRouter} from "../../router/register.router";

/**
 * Express instance
 */
const appXpr = express();

/**
 * Parsing yaml data as an Javascript Object
 */
const yamlParse: YamlParsing = new YamlParsing();

/**
 * returning all Features modules routers
 */
const routers = registerRouter();

/**
 * YAML file returning as a Javascript Object contain some keys and values as
 * following : origin, methods, allowedHeaders, exposedHeaders,
 * credentials, maxAge, preflightContinue, optionsSuccessStatus.
 */
const corsOptions = yamlParse.readFile("config/corsOptions.yaml");

/**
 * Instantiate application bootstrap.
 */
const app: CoreApplication = new CoreApplication(appXpr, corsOptions);

/**
 * Running Server and loading routes register of all features modules.
 */
const server = app.onStartServer(routers);

/**
 * listening all events triggered on server.
 */
app.onListeningOnServerEvent(server, app.kernelModules(registerRouter(), dbConnection));

/**
 * listening all requested request on server.
 */
app.onRequestOnServerEvent(server);