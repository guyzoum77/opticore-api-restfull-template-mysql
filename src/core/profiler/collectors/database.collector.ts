import type { CollectorContext, DataCollector, ISqlQuery } from "../types";

/**
 * Holds the SQL queries recorded for one request. Instances are never
 * populated by business code directly — see instrumentation/mysql.instrumentation.ts,
 * which decorates the DB driver once at bootstrap and pushes into whichever
 * DatabaseCollector is active on the current AsyncLocalStorage context.
 */
export class DatabaseCollector implements DataCollector<ISqlQuery[]> {
    private readonly queries: ISqlQuery[] = [];

    getName(): string {
        return "database";
    }

    record(query: Omit<ISqlQuery, "timestamp">): void {
        this.queries.push({ ...query, timestamp: Date.now() });
    }

    collect(_ctx: CollectorContext): void {
        // Queries are pushed in real time via record(); nothing to do at collect time.
    }

    getData(): ISqlQuery[] {
        return [...this.queries];
    }

    reset(): void {
        this.queries.length = 0;
    }
}
