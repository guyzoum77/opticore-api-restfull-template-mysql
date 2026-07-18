import { execSync } from "child_process";
import type { Request, Response } from "opticore-express";
import type { OpticoreProfiler } from "../middleware/profiler.middleware";
import { renderView } from "../core/render.util";
import { getExpressRoutes } from "../core/routeIntrospection";
import { toLegacyProfile } from "../view/legacyAdapter";
import { buildToolbarBarViewModel } from "../view/toolbar.view";
import { buildProfilerListViewModel, toProfilerListRow, ProfilerListTab } from "../view/profilerList.view";
import { buildProfilerDetailViewModel, Panel } from "../view/profilerDetail.view";
import type { IRequestProfile, Profile } from "../types";

const SSE_HEARTBEAT_MS = 15_000;

const PANELS: readonly Panel[] = [
    "request", "performance", "logs", "routing", "configuration", "database", "exception", "routes",
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

/**
 * Builds the profiler's HTTP handlers, bound to a specific opticoreProfiler()
 * instance (its storage, route prefix, security config...). One controller
 * is created per profiler in routes/profiler.router.handler.ts.
 */
export function createProfilerController(profiler: OpticoreProfiler) {
    const { storage, routePrefix, security, maxRequests, enabled } = profiler.options;

    async function recentLegacyProfiles(limit: number): Promise<IRequestProfile[]> {
        const profiles = await storage.find(limit);
        return profiles.map(toLegacyProfile);
    }

    return {
        async home(_req: Request, res: Response): Promise<void> {
            const appVersion = process.env.npm_package_version ?? "1.0.0";
            const nodeVersion = process.version;
            const npmVersion = getNpmVersion();
            const environment = process.env.NODE_ENV ?? "development";

            await renderView(res, "home.njk", {
                appVersion,
                nodeVersion,
                environment,
                port: process.env.APP_PORT ?? "4200",
                host: process.env.APP_HOST ?? "localhost",
                showToolbar: enabled,
                isProd: environment === "production",
            });
        },

        async wdt(req: Request, res: Response): Promise<void> {
            const raw = await storage.read(req.params.token as string);
            if (!raw) {
                res.status(404).send("");
                return;
            }
            const profile = toLegacyProfile(raw);
            const recent = await recentLegacyProfiles(maxRequests);
            const vm = buildToolbarBarViewModel(profile, recent, security, routePrefix, maxRequests);
            await renderView(res, "toolbar-wdt.njk", { ...vm, profilerBase: routePrefix });
        },

        async list(req: Request, res: Response): Promise<void> {
            const qs = req.query;
            const str = (k: string) => (typeof qs[k] === "string" ? (qs[k] as string) : "");
            const search = str("search");
            const method = str("method");
            const status = str("status");
            const ip = str("ip");
            const token = str("token");
            const from = str("from");
            const until = str("until");
            const limitRaw = typeof qs.limit === "string" ? parseInt(qs.limit as string, 10) : 10;
            const limit = [10, 25, 50, 100].includes(limitRaw) ? limitRaw : 10;
            const tab: ProfilerListTab = qs.tab === "commands" ? "commands" : "requests";

            const all = await recentLegacyProfiles(1000);
            await renderView(res, "profiler-list.njk", buildProfilerListViewModel(
                all, search, method, status, limit, ip, token, from, until, tab
            ));
        },

        /**
         * Server-Sent Events stream: pushes one "profile" event per request
         * the server finishes profiling, formatted exactly like a
         * profiler-list.njk row. Replaces the old `setTimeout(location.reload)`
         * polling on the list page — the client only re-renders when the
         * server actually has something new, nothing is polled.
         */
        stream(req: Request, res: Response): void {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");
            res.flushHeaders?.();

            const send = (event: string, data: unknown): void => {
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };

            const onProfile = (profile: Profile): void => {
                send("profile", toProfilerListRow(toLegacyProfile(profile)));
            };
            profiler.events.on("profile", onProfile);

            const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), SSE_HEARTBEAT_MS);

            req.on("close", () => {
                clearInterval(heartbeat);
                profiler.events.off("profile", onProfile);
            });
        },

        async latestRedirect(_req: Request, res: Response): Promise<void> {
            const [latest] = await storage.find(1);
            if (!latest) {
                res.redirect(routePrefix);
                return;
            }
            res.redirect(`${routePrefix}/${latest.token}`);
        },

        async detail(req: Request, res: Response): Promise<void> {
            const raw = await storage.read(req.params.token as string);
            if (!raw) {
                await renderView(res, "message.njk", {
                    title: "Profile Not Found",
                    heading: "Profile not found",
                    message: `Token <code>${req.params.token}</code> does not exist or has expired.`,
                    link: { href: routePrefix, label: "← Back to profiler list" },
                });
                return;
            }
            const profile = toLegacyProfile(raw);
            const rawPanel = req.query.panel;
            const panel: Panel = isValidPanel(rawPanel) ? rawPanel : "request";
            await renderView(res, "profiler-detail.njk", buildProfilerDetailViewModel(profile, panel, getExpressRoutes()));
        },
    };
}
