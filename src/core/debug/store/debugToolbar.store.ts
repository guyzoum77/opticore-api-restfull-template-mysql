import { EventEmitter } from "events";
import { IRequestProfile, ILogEntry } from "../types/debugToolbar.types";


class DebugToolbarStore extends EventEmitter {
    private readonly profiles: Map<string, IRequestProfile> = new Map();
    private readonly tokens: string[] = [];
    private readonly maxSize: number = 100;

    constructor() {
        super();
        this.setMaxListeners(0);
    }

    save(profile: IRequestProfile): void {
        if (this.tokens.length >= this.maxSize) {
            const oldest: string = this.tokens.shift()!;
            this.profiles.delete(oldest);
        }
        this.tokens.push(profile.token);
        this.profiles.set(profile.token, profile);
        this.emit("profile", profile);
    }

    patchLatestLogs(entry: ILogEntry): void {
        const lastToken: string = this.tokens[this.tokens.length - 1];
        if (!lastToken) return;
        const profile: IRequestProfile | undefined = this.profiles.get(lastToken);
        if (profile) {
            profile.logs.push(entry);
        }
    }

    get(token: string): IRequestProfile | undefined {
        return this.profiles.get(token);
    }

    getAll(): IRequestProfile[] {
        return [...this.tokens]
            .reverse()
            .map((t: string): IRequestProfile => this.profiles.get(t)!)
            .filter(Boolean);
    }

    getLatest(): IRequestProfile | undefined {
        const lastToken: string = this.tokens[this.tokens.length - 1];

        return lastToken
            ? this.profiles.get(lastToken)
            : undefined;
    }

    clear(): void {
        this.profiles.clear();
        this.tokens.length = 0;
    }

    count(): number {
        return this.tokens.length;
    }
}

export const debugStore = new DebugToolbarStore();