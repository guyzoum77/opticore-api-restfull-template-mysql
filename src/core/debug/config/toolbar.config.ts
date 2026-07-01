import { ToolbarConfig } from "../types/debugToolbar.types";

const DEFAULT_CONFIG: ToolbarConfig = {
    position: "bottom",
    maxRequests: 10,
    maxUrlLength: 42,
    theme: "dark",
    autoHide: false,
    panels: [
        { id: "performance", enabled: true, label: "Performance", icon: "perf",  order: 1 },
        { id: "logs",        enabled: true, label: "Logs",        icon: "log",   order: 2 },
        { id: "database",    enabled: true, label: "Database",    icon: "db",    order: 3 },
        { id: "routing",     enabled: true, label: "Routing",     icon: "route", order: 4 },
        { id: "http",        enabled: true, label: "HTTP",        icon: "http",  order: 5 },
    ],
    security: {
        allowedDomains: ["localhost", "127.0.0.1"],
        maxUrlLength: 42,
    },
};

export class ToolbarConfigBuilder {
    private config: ToolbarConfig;

    constructor(overrides: Partial<ToolbarConfig> = {}) {
        this.config = JSON.parse(JSON.stringify({ ...DEFAULT_CONFIG, ...overrides }));
    }

    setPosition(position: "bottom" | "top"): this {
        this.config.position = position;
        return this;
    }

    setMaxRequests(max: number): this {
        this.config.maxRequests = Math.max(1, Math.min(50, max));
        return this;
    }

    setMaxUrlLength(length: number): this {
        this.config.maxUrlLength = Math.max(10, length);
        this.config.security.maxUrlLength = this.config.maxUrlLength;
        return this;
    }

    enablePanel(id: string): this {
        const panel = this.config.panels.find(p => p.id === id);
        if (panel) panel.enabled = true;
        return this;
    }

    disablePanel(id: string): this {
        const panel = this.config.panels.find(p => p.id === id);
        if (panel) panel.enabled = false;
        return this;
    }

    build(): Readonly<ToolbarConfig> {
        return Object.freeze(JSON.parse(JSON.stringify(this.config)));
    }
}

export const defaultToolbarConfig: Readonly<ToolbarConfig> = new ToolbarConfigBuilder().build();
