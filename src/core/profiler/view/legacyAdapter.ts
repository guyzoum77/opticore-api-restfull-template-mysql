import type { Profile, IRequestProfile, ISqlQuery, ILogEntry } from "../types";
import type { RequestCollectorData } from "../collectors/request.collector";
import type { TimeCollectorData } from "../collectors/time.collector";
import type { MemoryCollectorData } from "../collectors/memory.collector";
import type { ExceptionCollectorData } from "../collectors/exception.collector";

/**
 * The list/detail/toolbar views (view/*.view.ts + their njk templates) were
 * built — and are kept as-is per the "same CSS/HTML" requirement — against a
 * single flat IRequestProfile shape. Collectors now produce independent,
 * per-collector data instead. This adapter is the one place that reassembles
 * a Profile's `collectors` map back into that flat shape, so the view layer
 * never has to change.
 */
export function toLegacyProfile(profile: Profile): IRequestProfile {
    const requestData = profile.collectors.request as RequestCollectorData | undefined;
    const timeData = profile.collectors.time as TimeCollectorData | undefined;
    const memoryData = profile.collectors.memory as MemoryCollectorData | undefined;
    const queries = (profile.collectors.database as ISqlQuery[] | undefined) ?? [];
    const logs = [...((profile.collectors.logger as ILogEntry[] | undefined) ?? [])];

    // The exception/logs panel builders (kept as-is) derive "is there an
    // exception" purely from error-level log entries — mirror the captured
    // exception in there so it surfaces even when the app never logged it.
    const exceptionData = profile.collectors.exception as ExceptionCollectorData | undefined;
    if (exceptionData?.error) {
        logs.push({
            level: "critical",
            message: `${exceptionData.error.name}: ${exceptionData.error.message}`,
            timestamp: profile.time,
            context: { stack: exceptionData.error.stack },
        });
    }

    return {
        token: profile.token,
        timestamp: profile.time,
        method: requestData?.method ?? profile.method,
        url: requestData?.url ?? profile.url,
        statusCode: requestData?.statusCode ?? profile.statusCode,
        statusMessage: requestData?.statusMessage ?? "",
        duration: timeData?.duration ?? profile.duration,
        memoryUsage: memoryData?.heapUsedAfter ?? 0,
        queries,
        logs,
        route: requestData?.route ?? { path: profile.url, method: profile.method, params: {} },
        request: requestData?.request ?? {
            method: profile.method, url: profile.url, headers: {}, query: {}, body: {}, params: {}, ip: profile.ip,
        },
        response: requestData?.response ?? { statusCode: profile.statusCode, statusMessage: "", headers: {}, contentType: profile.contentType },
        performance: [],
        nodeVersion: process.version,
        appVersion: process.env.npm_package_version ?? "1.0.0",
        environment: process.env.NODE_ENV ?? "development",
    };
}
