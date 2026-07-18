import type { CollectorContext, DataCollector, ILogEntry } from "../types";

/**
 * Holds the log entries emitted for one request, grouped implicitly by level
 * (the view layer groups/counts them). Like DatabaseCollector, entries are
 * pushed in real time by instrumentation/logger.instrumentation.ts — business
 * code keeps calling `logger.info(...)` / `logger.error(...)` unmodified.
 */
export class LoggerCollector implements DataCollector<ILogEntry[]> {
    private readonly logs: ILogEntry[] = [];

    getName(): string {
        return "logger";
    }

    record(entry: Omit<ILogEntry, "timestamp">): void {
        this.logs.push({ ...entry, timestamp: Date.now() });
    }

    collect(_ctx: CollectorContext): void {
        // Entries are pushed in real time via record(); nothing to do at collect time.
    }

    getData(): ILogEntry[] {
        return [...this.logs];
    }

    byLevel(level: ILogEntry["level"]): ILogEntry[] {
        return this.logs.filter(l => l.level === level);
    }

    reset(): void {
        this.logs.length = 0;
    }
}
