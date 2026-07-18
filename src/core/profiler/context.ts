import { AsyncLocalStorage } from "async_hooks";
import type { DataCollector } from "./types";

/**
 * The request-scoped state a Symfony-style DI container would hand to a
 * collector implicitly. Node has no such container, so AsyncLocalStorage is
 * the mechanism that lets code deep inside business logic (a DB driver call,
 * a logger call) find "the collector for the request currently in flight"
 * without that business code being passed a token or knowing profiling
 * exists at all.
 */
export interface RequestProfilingState {
    token: string;
    collectors: Map<string, DataCollector>;
    startTime: number;
    startHrTime: bigint;
}

export const profilerContext = new AsyncLocalStorage<RequestProfilingState>();

export function runWithProfilerContext<T>(state: RequestProfilingState, fn: () => T): T {
    return profilerContext.run(state, fn);
}

export function getActiveProfilingState(): RequestProfilingState | undefined {
    return profilerContext.getStore();
}

/**
 * Looks up the named collector for the request currently being handled on
 * this async chain. Returns undefined outside of a profiled request (e.g.
 * profiling disabled, or the call happened outside any HTTP request) —
 * callers must treat that as "do nothing", never throw.
 */
export function getActiveCollector<T extends DataCollector>(name: string): T | undefined {
    return profilerContext.getStore()?.collectors.get(name) as T | undefined;
}
