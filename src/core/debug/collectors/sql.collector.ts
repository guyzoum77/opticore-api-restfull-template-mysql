import { ISqlQuery } from "../types/debugToolbar.types";

class SqlCollector {
    private readonly queries: Map<string, ISqlQuery[]> = new Map();

    startRequest(token: string): void {
        this.queries.set(token, []);
    }

    record(token: string, query: Omit<ISqlQuery, "timestamp">): void {
        const list = this.queries.get(token);
        if (list) {
            list.push({ ...query, timestamp: Date.now() });
        }
    }

    flush(token: string): ISqlQuery[] {
        const list = this.queries.get(token) ?? [];
        this.queries.delete(token);
        return list;
    }

    peek(token: string): ISqlQuery[] {
        return this.queries.get(token) ?? [];
    }
}

export const sqlCollector = new SqlCollector();