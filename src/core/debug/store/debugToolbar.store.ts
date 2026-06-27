import { IRequestProfile } from "../types/debugToolbar.types";

class DebugToolbarStore {
    private readonly profiles: Map<string, IRequestProfile> = new Map();
    private readonly tokens: string[] = [];
    private readonly maxSize: number = 100;

    save(profile: IRequestProfile): void {
        if (this.tokens.length >= this.maxSize) {
            const oldest = this.tokens.shift()!;
            this.profiles.delete(oldest);
        }
        this.tokens.push(profile.token);
        this.profiles.set(profile.token, profile);
    }

    get(token: string): IRequestProfile | undefined {
        return this.profiles.get(token);
    }

    getAll(): IRequestProfile[] {
        return [...this.tokens]
            .reverse()
            .map(t => this.profiles.get(t)!)
            .filter(Boolean);
    }

    getLatest(): IRequestProfile | undefined {
        const lastToken = this.tokens[this.tokens.length - 1];
        return lastToken ? this.profiles.get(lastToken) : undefined;
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
