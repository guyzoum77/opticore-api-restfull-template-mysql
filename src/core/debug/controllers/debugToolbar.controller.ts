import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { Request, Response } from "opticore-express";
import { debugStore } from "../store/debugToolbar.store";
import { getExpressRoutes } from "../debugToolbar.module";
import { renderView } from "../core/render.util";
import { buildToolbarBarViewModel } from "../views/toolbar.view";
import { buildProfilerListViewModel, ProfilerListTab } from "../views/profilerList.view";
import { buildProfilerDetailViewModel, Panel } from "../views/profilerDetail.view";
import {ResponseHandler} from "opticore-http-response";
import { IRequestProfile } from "../types/debugToolbar.types";

const SSE_HEARTBEAT_MS = 15000;

function toProfileSummary(p: IRequestProfile) {
    return {
        token: p.token,
        timestamp: p.timestamp,
        method: p.method,
        url: p.url,
        statusCode: p.statusCode,
        duration: p.duration,
        memoryUsage: p.memoryUsage,
        sqlCount: p.queries.length,
        logCount: p.logs.length,
        logErrors: p.logs.filter(l => l.level === "error" || l.level === "critical").length,
        logWarnings: p.logs.filter(l => l.level === "warning").length,
        logDeprecations: p.logs.filter(l => (l.level as string) === "deprecation").length,
    };
}


const PANELS: readonly Panel[] = [
    "request",
    "performance",
    "logs",
    "routing",
    "configuration",
    "database",
    "exception",
    "routes"
];

function isValidPanel(p: unknown): p is Panel {
    return typeof p === "string" && (PANELS as readonly string[]).includes(p as Panel);
}

function getNpmVersion(): string {
    try {
        return execSync("npm --version", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
        return "—";
    }
}

function isPackageInstalled(name: string): boolean {
    return existsSync(join(process.cwd(), "node_modules", name, "package.json"));
}

function isToolbarEnabled(): boolean {
    return process.env.PROFILE_WEB_TOOL_BAR === "true";
}

export class DebugToolbarController {
    static basePath = "";

    static async home(_req: Request, res: Response): Promise<void> {
        const appVersion = process.env.npm_package_version ?? "1.0.0";
        const nodeVersion = process.version;
        const npmVersion = getNpmVersion();
        const environment = process.env.NODE_ENV ?? "development";
        const showToolbar = isToolbarEnabled();

        await renderView(res, "home.njk", {
            appVersion,
            nodeVersion,
            environment,
            port: process.env.APP_PORT ?? "4200",
            host: process.env.APP_HOST ?? "localhost",
            showToolbar,
            isProd: environment === "production",
            toolbarConfig: {
                appVersion,
                nodeVersion,
                npmVersion,
                environment,
                cacheInstalled: isPackageInstalled("opticore-cache"),
                gatewayInstalled: isPackageInstalled("opticore-api-gateway"),
            },
        });
    }

    static async toolbarLatest(_req: Request, res: Response): Promise<void> {
        const profile = debugStore.getLatest();
        if (!profile) {
            await renderView(res, "message.njk", {
                title: "Debug Toolbar",
                message: "No requests profiled yet. Make a request then " +
                    "<a href=\"/_debug/toolbar\">refresh</a>.",
            });
            return;
        }
        await renderView(res, "toolbar-standalone.njk", buildToolbarBarViewModel(profile));
    }

    static async toolbarByToken(req: Request, res: Response): Promise<void> {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) {
            res.status(404).send("Profile not found");
            return;
        }
        await renderView(res, "toolbar-standalone.njk", buildToolbarBarViewModel(profile));
    }

    static async profilerList(req: Request, res: Response): Promise<void> {
        const qs = req.query;
        const str = (k: string) => typeof qs[k] === "string" ? (qs[k] as string) : "";
        const search = str("search");
        const method = str("method");
        const status = str("status");
        const ip     = str("ip");
        const token  = str("token");
        const from   = str("from");
        const until  = str("until");
        const limitRaw = typeof qs.limit === "string"
            ? parseInt(qs.limit as string, 10)
            : 10;
        const limit = [10, 25, 50, 100].includes(limitRaw) ? limitRaw : 10;
        const tab: ProfilerListTab = qs.tab === "commands" ? "commands" : "requests";
        await renderView(res, "profiler-list.njk", buildProfilerListViewModel(
            debugStore.getAll(), search, method, status, limit, ip, token, from, until, tab
        ));
    }

    static profilerLatestRedirect(_req: Request, res: Response): void {
        const latest = debugStore.getLatest();
        if (!latest) {
            res.redirect("/_debug/profiler");
            return;
        }
        res.redirect("/_debug/profiler/" + latest.token);
    }

    static async profilerDetail(req: Request, res: Response): Promise<void> {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) {
            await renderView(res, "message.njk", {
                title: "Profile Not Found",
                heading: "Profile not found",
                message: `Token <code>${req.params.token}</code> does not exist or has expired.`,
                link: { href: "/_debug/profiler", label: "← Back to profiler list" },
            });
            return;
        }
        const rawPanel = req.query.panel;
        const panel: Panel = isValidPanel(rawPanel) ? rawPanel : "request";
        await renderView(res, "profiler-detail.njk", buildProfilerDetailViewModel(profile, panel, getExpressRoutes()));
    }

    static apiProfiles(_req: Request, res: Response): void {
        const profiles = debugStore.getAll().map(toProfileSummary);
        res.json({ count: profiles.length, profiles });
    }

    static streamProfiles(req: Request, res: Response): void {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        res.flushHeaders?.();

        const send = (event: string, data: unknown): void => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        const latest = debugStore.getAll().slice(0, 10).map(toProfileSummary);
        send("snapshot", { count: latest.length, profiles: latest });

        const onProfile = (profile: IRequestProfile): void => {
            send("profile", toProfileSummary(profile));
        };
        debugStore.on("profile", onProfile);

        const heartbeat = setInterval(() => {
            res.write(": heartbeat\n\n");
        }, SSE_HEARTBEAT_MS);

        req.on("close", () => {
            clearInterval(heartbeat);
            debugStore.off("profile", onProfile);
        });
    }

    static apiProfileByToken(req: Request, res: Response): void {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }
        res.json(profile);
    }

    static clearProfiles(_req: Request, res: Response): void {
        debugStore.clear();
        res.json({ cleared: true });
    }

    static debugIndexRedirect(_req: Request, res: Response): void {
        res.redirect("/_debug/profiler");
    }
}