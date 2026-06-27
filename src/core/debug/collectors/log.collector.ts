import { ILogEntry } from "../types/debugToolbar.types";

class LogCollector {
    private readonly logs: Map<string, ILogEntry[]> = new Map();

    startRequest(token: string): void {
        this.logs.set(token, []);
    }

    record(token: string, entry: Omit<ILogEntry, "timestamp">): void {
        const list = this.logs.get(token);
        if (list) {
            list.push({ ...entry, timestamp: Date.now() });
        }
    }

    flush(token: string): ILogEntry[] {
        const list = this.logs.get(token) ?? [];
        this.logs.delete(token);
        return list;
    }

    peek(token: string): ILogEntry[] {
        return this.logs.get(token) ?? [];
    }
}

export const logCollector = new LogCollector();
