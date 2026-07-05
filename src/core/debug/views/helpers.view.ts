import { IRequestProfile } from "../types/debugToolbar.types";

export function statusClass(code: number): string {
    if (code >= 500) return "s-error";
    if (code >= 400) return "s-warn";
    if (code >= 300) return "s-redirect";
    return "s-ok";
}

export function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function formatMemory(bytes: number): string {
    return `${(Math.max(0, bytes) / 1024 / 1024).toFixed(1)} MiB`;
}

export function sqlTotalTime(profile: IRequestProfile): number {
    return profile.queries.reduce((sum, q) => sum + q.duration, 0);
}
