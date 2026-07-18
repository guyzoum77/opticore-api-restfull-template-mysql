import type { NextFunction, Request, Response } from "opticore-express";
import { getActiveCollector } from "../context";
import type { ExceptionCollector } from "../collectors/exception.collector";

/**
 * Express error-handling middleware (4-arg signature) that records the error
 * into the current request's ExceptionCollector, then forwards it unchanged
 * via next(err) — it never sends a response itself, so the application's own
 * error handling (JSON error responses, custom error pages, ...) behaves
 * exactly as if the profiler weren't there. Mount it after all routes, same
 * as any other Express error middleware:
 *
 *   app.use(...routes)
 *   app.use(profilerErrorHandler())
 *   app.use(myAppErrorHandler)
 */
export function profilerErrorHandler() {
    return function (err: Error, _req: Request, _res: Response, next: NextFunction): void {
        getActiveCollector<ExceptionCollector>("exception")?.setError(err);
        next(err);
    };
}

let processHandlersRegistered = false;

/**
 * Fallback for errors that never reach Express's error-handling chain at all
 * (a synchronous throw in a detached callback, an unhandled promise
 * rejection). Read-only observers — they never alter Node's default crash
 * behaviour. Registered once per process.
 */
export function registerProcessErrorCapture(): void {
    if (processHandlersRegistered) return;
    processHandlersRegistered = true;

    (process as unknown as { on(event: "uncaughtExceptionMonitor", listener: (err: Error) => void): void })
        .on("uncaughtExceptionMonitor", (err: Error) => {
            try {
                getActiveCollector<ExceptionCollector>("exception")?.setError(err);
            } catch { /* never let the observer crash the process */ }
        });

    process.on("unhandledRejection", (reason: unknown) => {
        try {
            const err = reason instanceof Error ? reason : new Error(String(reason));
            getActiveCollector<ExceptionCollector>("exception")?.setError(err);
        } catch { /* never let the observer crash the process */ }
    });
}
