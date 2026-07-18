import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import type { Profile, ProfilerStorage } from "../types";

type IndexEntry = Pick<Profile, "token" | "ip" | "method" | "url" | "statusCode" | "time" | "duration" | "contentType">;

/**
 * Persists profiles as JSON files under `<dir>/<token>.json`, plus a single
 * `<dir>/index.json` holding lightweight metadata (no collector payloads)
 * for the last N profiles, most-recent-first — reading the index to list
 * profiles never has to open every per-token file, mirroring Symfony's
 * FileProfilerStorage split between index and full data.
 */
export class FileStorage implements ProfilerStorage {
    private readonly indexPath: string;

    constructor(private readonly dir: string = "src/core/cache/profiler", private readonly maxIndexSize: number = 100) {
        if (maxIndexSize < 1) throw new Error("FileStorage maxIndexSize must be >= 1");
        this.indexPath = join(this.dir, "index.json");
        this.ensureDir();
    }

    private ensureDir(): void {
        if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
    }

    private profilePath(token: string): string {
        return join(this.dir, `${token}.json`);
    }

    private readIndex(): IndexEntry[] {
        if (!existsSync(this.indexPath)) return [];
        try {
            return JSON.parse(readFileSync(this.indexPath, "utf8")) as IndexEntry[];
        } catch {
            return [];
        }
    }

    private writeIndex(entries: IndexEntry[]): void {
        writeFileSync(this.indexPath, JSON.stringify(entries), "utf8");
    }

    write(profile: Profile): void {
        this.ensureDir();
        writeFileSync(this.profilePath(profile.token), JSON.stringify(profile), "utf8");

        const index = this.readIndex().filter(e => e.token !== profile.token);
        index.unshift({
            token: profile.token,
            ip: profile.ip,
            method: profile.method,
            url: profile.url,
            statusCode: profile.statusCode,
            time: profile.time,
            duration: profile.duration,
            contentType: profile.contentType,
        });

        while (index.length > this.maxIndexSize) {
            const dropped = index.pop()!;
            this.deleteFile(dropped.token);
        }
        this.writeIndex(index);
    }

    read(token: string): Profile | undefined {
        const path = this.profilePath(token);
        if (!existsSync(path)) return undefined;
        try {
            return JSON.parse(readFileSync(path, "utf8")) as Profile;
        } catch {
            return undefined;
        }
    }

    find(limit?: number): Profile[] {
        const entries = this.readIndex();
        const sliced = limit ? entries.slice(0, limit) : entries;
        return sliced.map(e => ({ ...e, collectors: {} }));
    }

    purge(olderThanMs?: number): void {
        if (!olderThanMs) return;
        const cutoff = Date.now() - olderThanMs;
        const index = this.readIndex();
        const kept = index.filter(e => {
            if (e.time >= cutoff) return true;
            this.deleteFile(e.token);
            return false;
        });
        if (kept.length !== index.length) this.writeIndex(kept);
    }

    clear(): void {
        for (const entry of this.readIndex()) {
            this.deleteFile(entry.token);
        }
        this.writeIndex([]);
    }

    private deleteFile(token: string): void {
        const path = this.profilePath(token);
        if (existsSync(path)) {
            try { unlinkSync(path); } catch { /* best-effort cleanup */ }
        }
    }
}
