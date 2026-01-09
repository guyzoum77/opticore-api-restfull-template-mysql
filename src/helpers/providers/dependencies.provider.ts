import { TDependency } from "opticore-dependency-inject";
import { LoggerCore } from "opticore-logger";
import { OpticoreLogger } from "opticore-server-logger";

export const dependenciesProvider: TDependency[] = [
    {
        key: "LoggerCore",
        factory: (): LoggerCore => new LoggerCore(),
        scope: "singleton"
    },
    {
        key: "OpticoreLogger",
        factory: (): OpticoreLogger => new OpticoreLogger(),
        scope: "singleton"
    },
];