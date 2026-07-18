import type { CollectorContext, DataCollector } from "../types";
import { getActiveProfilingState } from "../context";

export interface TimePhase {
    name: string;
    /** ms elapsed since the request started. */
    offset: number;
}

export interface TimeCollectorData {
    startedAt: number;
    duration: number;
    phases: TimePhase[];
}

/**
 * Total wall-clock duration plus any named checkpoints other code marks
 * along the way (e.g. "middleware.done", "handler.done") via mark().
 * mark() is looked up through the request's AsyncLocalStorage-scoped
 * collector instance (context.getActiveCollector), so it never requires
 * threading a token through business code.
 */
export class TimeCollector implements DataCollector<TimeCollectorData> {
    private data: TimeCollectorData | null = null;
    private readonly phases: TimePhase[] = [];

    getName(): string {
        return "time";
    }

    /** Records a named checkpoint at the current elapsed time, relative to the active request's start. */
    mark(name: string): void {
        const startHr = getActiveProfilingState()?.startHrTime;
        if (!startHr) return;
        const elapsedNs = process.hrtime.bigint() - startHr;
        this.phases.push({ name, offset: Number(elapsedNs / 1_000_000n) });
    }

    collect(ctx: CollectorContext): void {
        const durationNs = process.hrtime.bigint() - ctx.startHrTime;
        this.data = {
            startedAt: ctx.startTime,
            duration: Number(durationNs / 1_000_000n),
            phases: [...this.phases],
        };
    }

    getData(): TimeCollectorData {
        if (!this.data) {
            throw new Error("TimeCollector.getData() called before collect()");
        }
        return this.data;
    }

    reset(): void {
        this.data = null;
        this.phases.length = 0;
    }
}
