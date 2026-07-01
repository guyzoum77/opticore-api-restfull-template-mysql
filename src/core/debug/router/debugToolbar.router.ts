import { express } from "opticore-express";
import type { Request, Response, Router } from "opticore-express";
import { debugStore } from "../store/debugToolbar.store";
import { getExpressRoutes } from "../debugToolbar.module";
import { renderToolbarBar } from "../views/toolbar.view";
import { renderProfilerList } from "../views/profilerList.view";
import { renderProfilerDetail } from "../views/profilerDetail.view";

const PANELS = ["request", "performance", "logs", "routing", "configuration", "database", "exception", "routes"] as const;
type Panel = typeof PANELS[number];

function isValidPanel(p: unknown): p is Panel {
    return typeof p === "string" && (PANELS as readonly string[]).includes(p);
}

function html(res: Response, body: string): void {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.send(body);
}

export function createDebugRouter(): Router {
    const router = express.Router();

    // GET /_debug/toolbar — shows bar for most recent request
    router.get("/toolbar", (_req: Request, res: Response) => {
        const profile = debugStore.getLatest();
        if (!profile) {
            html(res, `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Debug Toolbar</title>
<style>body{background:#1b1b1b;color:#666;font-family:monospace;font-size:13px;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
a{color:#7c98d3;}</style></head>
<body><div>No requests profiled yet. Make a request then <a href="/_debug/toolbar">refresh</a>.</div></body></html>`);
            return;
        }
        html(res, renderToolbarBar(profile));
    });

    // GET /_debug/toolbar/:token
    router.get("/toolbar/:token", (req: Request, res: Response) => {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) { res.status(404).send("Profile not found"); return; }
        html(res, renderToolbarBar(profile));
    });

    // GET /_debug/profiler — list all profiled requests
    router.get("/profiler", (req: Request, res: Response) => {
        const qs = req.query;
        const str = (k: string) => typeof qs[k] === "string" ? (qs[k] as string) : "";
        const search = str("search");
        const method = str("method");
        const status = str("status");
        const ip     = str("ip");
        const token  = str("token");
        const from   = str("from");
        const until  = str("until");
        const limitRaw = typeof qs.limit === "string" ? parseInt(qs.limit as string, 10) : 10;
        const limit = [10, 25, 50, 100].includes(limitRaw) ? limitRaw : 10;
        const tab = qs.tab === "commands" ? "commands" : "requests";
        html(res, renderProfilerList(debugStore.getAll(), search, method, status, limit, ip, token, from, until, tab));
    });

    // GET /_debug/profiler/latest — redirect to most recent profile
    router.get("/profiler/latest", (_req: Request, res: Response) => {
        const latest = debugStore.getLatest();
        if (!latest) {
            res.redirect("/_debug/profiler");
            return;
        }
        res.redirect("/_debug/profiler/" + latest.token);
    });

    // GET /_debug/profiler/:token — full profiler detail
    router.get("/profiler/:token", (req: Request, res: Response) => {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) {
            html(res, `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Profile Not Found</title>
<style>body{background:#1a1a1a;color:#666;font-family:monospace;font-size:13px;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0;
flex-direction:column;gap:12px;}a{color:#7c98d3;}</style></head>
<body>
  <div style="font-size:18px;color:#e74c3c;">Profile not found</div>
  <div>Token <code style="color:#aaa;">${req.params.token}</code> does not exist or has expired.</div>
  <a href="/_debug/profiler">← Back to profiler list</a>
</body></html>`);
            return;
        }
        const rawPanel = req.query.panel;
        const panel: Panel = isValidPanel(rawPanel) ? rawPanel : "request";
        html(res, renderProfilerDetail(profile, panel, getExpressRoutes()));
    });

    // GET /_debug/api/profiles — JSON list
    router.get("/api/profiles", (_req: Request, res: Response) => {
        const profiles = debugStore.getAll().map(p => ({
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
        }));
        res.json({ count: profiles.length, profiles });
    });

    // GET /_debug/api/profiles/:token — JSON detail
    router.get("/api/profiles/:token", (req: Request, res: Response) => {
        const profile = debugStore.get(req.params.token as string);
        if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
        res.json(profile);
    });

    // DELETE /_debug/api/profiles — clear all
    router.delete("/api/profiles", (_req: Request, res: Response) => {
        debugStore.clear();
        res.json({ cleared: true });
    });

    // Redirect /_debug/ → /_debug/profiler
    router.get("/", (_req: Request, res: Response) => {
        res.redirect("/_debug/profiler");
    });

    return router;
}
