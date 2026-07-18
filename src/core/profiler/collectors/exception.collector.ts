import type { CollectorContext, DataCollector } from "../types";

export interface ExceptionData {
    name: string;
    message: string;
    stack: string;
}

export interface ExceptionCollectorData {
    error: ExceptionData | null;
}

/**
 * Captures the error that made a request fail, if any. Fed by:
 *  - middleware/errorHandler.middleware.ts, an Express error-handling
 *    middleware the app mounts after its routes (standard Express wiring —
 *    not a change to business logic, same as mounting any other middleware).
 *  - the process-level uncaughtException/unhandledRejection fallback, for
 *    errors that escape Express's error-handling chain entirely.
 */
export class ExceptionCollector implements DataCollector<ExceptionCollectorData> {
    private error: ExceptionData | null = null;

    getName(): string {
        return "exception";
    }

    setError(err: Error): void {
        // Keep the first error recorded — later ones (e.g. a second failure
        // during error handling) are usually noise obscuring the real cause.
        if (this.error) return;
        this.error = {
            name: err.name || "Error",
            message: err.message,
            stack: err.stack ?? "",
        };
    }

    collect(_ctx: CollectorContext, error?: Error | null): void {
        if (error) this.setError(error);
    }

    getData(): ExceptionCollectorData {
        return { error: this.error };
    }

    reset(): void {
        this.error = null;
    }
}
