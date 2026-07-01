import { SecurityConfig } from "../types/debugToolbar.types";

export class SecurityService {
    constructor(private readonly config: SecurityConfig) {}

    escapeHtml(str: unknown): string {
        return String(str ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    encodeUrl(url: string): string {
        if (url.startsWith("/_debug") || url.startsWith("/")) return url;
        return "#";
    }

    sanitizeToken(token: string): string {
        // Tokens are 12 hex chars (randomBytes(6).toString("hex"))
        if (!/^[a-f0-9]{12}$/i.test(token)) throw new Error("Invalid token format");
        return token;
    }

    truncateUrl(url: string, maxLen?: number): string {
        const max = maxLen ?? this.config.maxUrlLength;
        if (url.length <= max) return url;
        return url.slice(0, max - 1) + "…";
    }
}
