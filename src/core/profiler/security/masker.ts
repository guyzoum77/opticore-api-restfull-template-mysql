import { DEFAULT_SENSITIVE_KEYS } from "../types";

const REDACTED = "••••••••";

/**
 * Masks sensitive values before they are persisted or rendered. Applied to
 * headers, cookies, query and body objects captured by RequestCollector —
 * masking happens at collection time (not at render time) so redacted data
 * never even reaches disk in FileStorage.
 */
export class Masker {
    private readonly keys: Set<string>;

    constructor(sensitiveKeys: readonly string[] = DEFAULT_SENSITIVE_KEYS) {
        this.keys = new Set(sensitiveKeys.map(k => k.toLowerCase()));
    }

    isSensitive(key: string): boolean {
        const k = key.toLowerCase();
        for (const sensitive of this.keys) {
            if (k === sensitive || k.includes(sensitive)) return true;
        }
        return false;
    }

    /** Shallow-masks a flat object (headers, query, cookies, single-level body). */
    maskShallow<T extends Record<string, unknown>>(obj: T | undefined | null): T {
        const result = {} as T;
        for (const [key, value] of Object.entries(obj ?? {})) {
            (result as Record<string, unknown>)[key] = this.isSensitive(key) ? REDACTED : value;
        }
        return result;
    }

    /** Recursively masks nested objects/arrays (request/response bodies). */
    maskDeep(value: unknown, depth = 0): unknown {
        if (depth > 8 || value === null || typeof value !== "object") return value;

        if (Array.isArray(value)) {
            return value.map(v => this.maskDeep(v, depth + 1));
        }

        const out: Record<string, unknown> = {};
        for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
            out[key] = this.isSensitive(key) ? REDACTED : this.maskDeep(v, depth + 1);
        }
        return out;
    }
}
