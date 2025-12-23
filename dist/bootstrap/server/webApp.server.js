"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const opticore_webapp_core_1 = require("opticore-webapp-core");
const opticore_express_1 = require("opticore-express");
const opticore_webapp_1 = require("opticore-webapp");
const opticore_env_access_1 = require("opticore-env-access");
const opticore_logger_1 = require("opticore-logger");
const register_router_1 = require("../../app/router/register.router");
const dependencies_provider_1 = require("../../helpers/providers/dependencies.provider");
/**
 * All Environment values
 */
const environment = (0, opticore_env_access_1.getEnvironnementValue)(opticore_webapp_1.envPath);
/**
 * YAML file returning as a JavaScript Object contains some keys and values as
 * following: origin, methods, allowedHeaders, exposedHeaders,
 * credentials, maxAge, preflightContinue, optionsSuccessStatus.
 */
const yamlParsing = new opticore_webapp_core_1.YamlParsing(environment.defaultLocal, opticore_webapp_1.envPath);
/**
 * Loading a project local translation
 */
new opticore_webapp_core_1.LocalLanguageLoader(environment.defaultLocal, yamlParsing.absolutPath()).load();
/**
 * Instantiate application bootstrap.
 */
const app = new opticore_webapp_1.WebServer({
    app: (0, opticore_express_1.express)(),
    corsOriginOptions: yamlParsing.readFile("config/cors/corsOptions.yaml"),
    environmentPath: opticore_webapp_1.envPath,
    localLanguage: environment.defaultLocal,
    loggerConfig: new opticore_logger_1.LoggerCore((0, opticore_webapp_core_1.loggerConfig)(opticore_webapp_1.envPath))
});
/**
 * Running Server and loading routes register of all features modules.
 */
app.onStartServer((0, register_router_1.registerRouter)(), undefined, dependencies_provider_1.dependenciesProvider);
//# sourceMappingURL=webApp.server.js.map