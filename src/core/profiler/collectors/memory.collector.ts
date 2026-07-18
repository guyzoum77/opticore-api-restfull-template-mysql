import type { CollectorContext, DataCollector } from "../types";

export interface MemoryCollectorData {
    heapUsedBefore: number;
    heapUsedAfter: number;
    delta: number;
}

/** Heap usage before the request started vs. right after the response finished. */
export class MemoryCollector implements DataCollector<MemoryCollectorData> {
    private data: MemoryCollectorData | null = null;

    getName(): string {
        return "memory";
    }

    collect(ctx: CollectorContext): void {
        const heapUsedAfter = process.memoryUsage().heapUsed;
        this.data = {
            heapUsedBefore: ctx.heapUsedBefore,
            heapUsedAfter,
            delta: heapUsedAfter - ctx.heapUsedBefore,
        };
    }

    getData(): MemoryCollectorData {
        if (!this.data) {
            throw new Error("MemoryCollector.getData() called before collect()");
        }
        return this.data;
    }

    reset(): void {
        this.data = null;
    }
}
