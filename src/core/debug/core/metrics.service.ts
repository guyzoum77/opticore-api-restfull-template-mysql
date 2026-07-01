import { IRequestProfile, ProfileMetrics } from "../types/debugToolbar.types";
import { formatDuration, formatMemory, statusClass, sqlTotalTime } from "../views/helpers.view";

export class MetricsService {
    compute(profile: IRequestProfile, httpCount = 0): ProfileMetrics {
        return {
            sqlTotalTime:     sqlTotalTime(profile),
            sqlCount:         profile.queries.length,
            logCount:         profile.logs.length,
            logErrors:        profile.logs.filter(l => l.level === "error" || l.level === "critical").length,
            logWarnings:      profile.logs.filter(l => l.level === "warning").length,
            logDeprecations:  profile.logs.filter(l => (l.level as string) === "deprecation").length,
            httpCount,
            memoryFormatted:  formatMemory(profile.memoryUsage),
            durationFormatted: formatDuration(profile.duration),
            statusClass:      statusClass(profile.statusCode),
        };
    }
}
