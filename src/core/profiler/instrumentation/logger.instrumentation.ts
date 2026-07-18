import { getActiveCollector } from "../context";
import type { LoggerCollector } from "../collectors/logger.collector";
import type { ILogEntry } from "../types";

interface ILogSuccessArg { title?: string; message?: string }
interface ILogInfoArg { title?: string; message?: string }
interface ILogWarnArg { title?: string; message: string }
interface ILogErrorArg { message: string; title?: string; errorType?: unknown; stackTrace?: unknown; httpCodeValue?: unknown }

interface LoggerCoreLike {
    success(arg: ILogSuccessArg): void;
    info(arg: ILogInfoArg): void;
    warn(arg: ILogWarnArg): void;
    error(arg: ILogErrorArg): void;
    debug(message: string): void;
}
interface LoggerCoreCtor { prototype: LoggerCoreLike }

const INSTRUMENTED = new WeakSet<object>();

function mirror(level: ILogEntry["level"], message: string, context?: Record<string, unknown>): void {
    const collector = getActiveCollector<LoggerCollector>("logger");
    if (!collector) return;
    collector.record({ level, message, context });
}

/**
 * Decorates LoggerCore's prototype so every log call the application makes
 * (through its normal `logger.info(...)`, `logger.error(...)`, etc.) is
 * mirrored into the active request's LoggerCollector, in addition to
 * whatever the logger already does (console/file/remote transports keep
 * working unchanged). Call once at bootstrap. Idempotent.
 */
export function instrumentLogger(LoggerClass: LoggerCoreCtor): void {
    const proto = LoggerClass.prototype;
    if (INSTRUMENTED.has(proto)) return;
    INSTRUMENTED.add(proto);

    const originalSuccess = proto.success;
    proto.success = function (this: LoggerCoreLike, arg: ILogSuccessArg) {
        mirror("info", arg.message ?? arg.title ?? "", arg.title ? { title: arg.title } : undefined);
        return originalSuccess.call(this, arg);
    };

    const originalInfo = proto.info;
    proto.info = function (this: LoggerCoreLike, arg: ILogInfoArg) {
        mirror("info", arg.message ?? arg.title ?? "", arg.title ? { title: arg.title } : undefined);
        return originalInfo.call(this, arg);
    };

    const originalWarn = proto.warn;
    proto.warn = function (this: LoggerCoreLike, arg: ILogWarnArg) {
        mirror("warning", arg.message, arg.title ? { title: arg.title } : undefined);
        return originalWarn.call(this, arg);
    };

    const originalError = proto.error;
    proto.error = function (this: LoggerCoreLike, arg: ILogErrorArg) {
        mirror("error", arg.message, {
            ...(arg.title ? { title: arg.title } : {}),
            ...(arg.errorType ? { errorType: arg.errorType } : {}),
            ...(arg.stackTrace ? { stack: arg.stackTrace } : {}),
        });
        return originalError.call(this, arg);
    };

    const originalDebug = proto.debug;
    proto.debug = function (this: LoggerCoreLike, message: string) {
        mirror("debug", message);
        return originalDebug.call(this, message);
    };
}
