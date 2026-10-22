import { LocalLanguageLoader, loggerConfig, YamlParsing } from "opticore-webapp-core";
import { express } from "opticore-express";
import { envPath, TWebServerOptions } from "opticore-webapp";
import { getEnvironmentValue, IEnvVariables } from "opticore-env-access";
import { ILoggerConfig, LoggerCore } from "opticore-logger";


/**
 * The WebServer's options: the environment values, the project's translations loaded, the CORS policy read from its
 * YAML file (origin, methods, allowedHeaders, exposedHeaders, credentials, maxAge, preflightContinue,
 * optionsSuccessStatus) and the hot reload settings (HMR_ENABLED in config/env/.env turns it on).
 */
export const webServerOptions = (): TWebServerOptions => {
    const environment: IEnvVariables = getEnvironmentValue(envPath);
    const yamlParsing: YamlParsing = new YamlParsing(environment.defaultLocal, envPath);
    new LocalLanguageLoader(environment.defaultLocal, yamlParsing.absolutPath()).load();

    return {
        app: express(),
        corsOriginOptions: yamlParsing.readFile("config/cors/corsOptions.yaml"),
        environmentPath: envPath,
        localLanguage: environment.defaultLocal,
        loggerConfig: new LoggerCore(loggerConfig(envPath) as ILoggerConfig),
        hotReload: {
            rootDir: environment.rootDir,
            watchExtensions: environment.watchExtensions,
            ignore: environment.ignore,
            debounceMs: environment.debounceMs,
        },
    };
};
