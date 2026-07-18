import type { Profile, ProfilerStorage } from "../types";

/**
 * Circular buffer of the N most recent profiles, kept in process memory.
 * Lost on restart — pick FileStorage when profiles need to survive that.
 */
export class MemoryStorage implements ProfilerStorage {
    private readonly profiles: Map<string, Profile> = new Map();
    private readonly order: string[] = [];

    constructor(private readonly limit: number = 100) {
        if (limit < 1) throw new Error("MemoryStorage limit must be >= 1");
    }

    write(profile: Profile): void {
        if (this.profiles.has(profile.token)) {
            // Re-written profile (shouldn't normally happen — tokens are unique
            // per request) — drop the old position so it moves to "most recent".
            const idx = this.order.indexOf(profile.token);
            if (idx !== -1) this.order.splice(idx, 1);
        } else if (this.order.length >= this.limit) {
            const oldest = this.order.shift()!;
            this.profiles.delete(oldest);
        }
        this.order.push(profile.token);
        this.profiles.set(profile.token, profile);
    }

    read(token: string): Profile | undefined {
        return this.profiles.get(token);
    }

    find(limit?: number): Profile[] {
        const tokens = [...this.order].reverse();
        const sliced = limit ? tokens.slice(0, limit) : tokens;
        return sliced.map(t => this.profiles.get(t)!).filter(Boolean);
    }

    purge(olderThanMs?: number): void {
        if (!olderThanMs) return;
        const cutoff = Date.now() - olderThanMs;
        for (const token of [...this.order]) {
            const profile = this.profiles.get(token);
            if (profile && profile.time < cutoff) {
                this.profiles.delete(token);
                const idx = this.order.indexOf(token);
                if (idx !== -1) this.order.splice(idx, 1);
            }
        }
    }

    clear(): void {
        this.profiles.clear();
        this.order.length = 0;
    }

    count(): number {
        return this.order.length;
    }
}
