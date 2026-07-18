import type { CollectorFactory, SecurityConfig } from "../types";
import { Masker } from "../security/masker";
import { RequestCollector } from "./request.collector";
import { TimeCollector } from "./time.collector";
import { MemoryCollector } from "./memory.collector";
import { DatabaseCollector } from "./database.collector";
import { LoggerCollector } from "./logger.collector";
import { ExceptionCollector } from "./exception.collector";

export { RequestCollector } from "./request.collector";
export { TimeCollector } from "./time.collector";
export { MemoryCollector } from "./memory.collector";
export { DatabaseCollector } from "./database.collector";
export { LoggerCollector } from "./logger.collector";
export { ExceptionCollector } from "./exception.collector";

export function createBuiltinCollectorFactories(security: SecurityConfig): CollectorFactory[] {
    const masker = new Masker(security.sensitiveKeys);
    return [
        () => new RequestCollector(masker),
        () => new TimeCollector(),
        () => new MemoryCollector(),
        () => new DatabaseCollector(),
        () => new LoggerCollector(),
        () => new ExceptionCollector(),
    ];
}
