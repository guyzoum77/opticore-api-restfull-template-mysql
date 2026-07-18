import { sep } from "path";
import { getActiveCollector } from "../context";
import type { DatabaseCollector } from "../collectors/database.collector";

type SqlArg = string | { sql: string; [key: string]: unknown };
type MakeQueryFn = (sql: SqlArg, values?: unknown[], callback?: (...args: unknown[]) => void) => Promise<unknown>;
interface MySQLDriverCtor { prototype: { makeQuery: MakeQueryFn } }

const INSTRUMENTED = new WeakSet<object>();

function extractSql(sql: SqlArg): string {
    return typeof sql === "string" ? sql : sql.sql;
}

/**
 * Grabs the call site inside application code that triggered this query,
 * skipping frames that belong to the driver internals or this instrumentation
 * wrapper — mirrors what an ORM's query logger reports as "origin".
 */
function captureCallSite(): string {
    const probe = { stack: "" };
    Error.captureStackTrace(probe, captureCallSite);
    const lines = probe.stack.split("\n").slice(1);
    const appFrame = lines.find(
        l => !l.includes("mysql.instrumentation") && !l.includes(`${sep}opticore-mysqldb${sep}`)
    );
    return (appFrame ?? lines[0] ?? "").trim();
}

/**
 * Decorates a MySQL driver's prototype so every query it runs is timed and
 * recorded against the request currently active on the profiler's
 * AsyncLocalStorage context — application code that calls `db.query(...)`
 * or `db.makeQuery(...)` is completely unaware this happens. Call once at
 * bootstrap, before any request is handled. Idempotent: safe to call more
 * than once (e.g. under hot reload) — re-wrapping is a no-op.
 */
export function instrumentMySQL(DriverClass: MySQLDriverCtor): void {
    const proto = DriverClass.prototype;
    if (INSTRUMENTED.has(proto)) return;
    INSTRUMENTED.add(proto);

    const original = proto.makeQuery;

    proto.makeQuery = async function (this: unknown, sql: SqlArg, values?: unknown[], callback?: (...args: unknown[]) => void) {
        const collector = getActiveCollector<DatabaseCollector>("database");
        if (!collector) {
            return original.call(this, sql, values, callback);
        }

        const sqlText = extractSql(sql);
        const stack = captureCallSite();
        const start = process.hrtime.bigint();

        try {
            const result = await original.call(this, sql, values, callback);
            collector.record({
                sql: sqlText,
                bindings: values,
                duration: Number((process.hrtime.bigint() - start) / 1_000_000n),
                stack,
            });
            return result;
        } catch (err) {
            collector.record({
                sql: sqlText,
                bindings: values,
                duration: Number((process.hrtime.bigint() - start) / 1_000_000n),
                stack,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    };
}
