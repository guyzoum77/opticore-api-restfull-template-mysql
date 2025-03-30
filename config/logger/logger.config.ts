import { getEnvironnementValue, IEnvVariables } from "opticore-env-access";

/**
 *
 * @param envDir
 */
export const loggerConfig = (envDir: any) => {
    const getEnvAccess: IEnvVariables = getEnvironnementValue(envDir);
    return {
        logLevels: [
            getEnvAccess.logLevelInfo,
            getEnvAccess.logLevelWarning,
            getEnvAccess.logLevelSuccess,
            getEnvAccess.logLevelError,
            getEnvAccess.logLevelDebug,
        ],
        transports: {
            file: {
                enabled: getEnvAccess.logFileEnabled,
                maxSizeMB: getEnvAccess.logFileMaxSize,
                rotate: getEnvAccess.logFileRotate,
            },
            console: {
                enabled: getEnvAccess.logConsoleEnabled,
            },
            remote: {
                enabled: getEnvAccess.logRemoteEnabled,
                endpoint: getEnvAccess.logRemoteEndPoint,
            },
        }
    };
}