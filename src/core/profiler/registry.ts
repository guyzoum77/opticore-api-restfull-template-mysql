import type { CollectorFactory, DataCollector } from "./types";

/**
 * Central registry of collector factories. The profiler middleware asks the
 * registry for a fresh set of collector *instances* at the start of every
 * profiled request (never reusing instances across requests — that would
 * leak data between unrelated requests running concurrently).
 *
 * Applications register custom collectors the same way built-ins are
 * registered: `registry.register(() => new MyCollector())`.
 */
export class CollectorRegistry {
    private readonly factories = new Map<string, CollectorFactory>();

    register(factory: CollectorFactory): void {
        const probe = factory();
        const name = probe.getName();
        if (!name) {
            throw new Error("DataCollector.getName() must return a non-empty string");
        }
        this.factories.set(name, factory);
    }

    unregister(name: string): void {
        this.factories.delete(name);
    }

    has(name: string): boolean {
        return this.factories.has(name);
    }

    names(): string[] {
        return [...this.factories.keys()];
    }

    /** Builds one fresh instance per registered factory, keyed by collector name. */
    createAll(): Map<string, DataCollector> {
        const instances = new Map<string, DataCollector>();
        for (const [name, factory] of this.factories) {
            instances.set(name, factory());
        }
        return instances;
    }
}
