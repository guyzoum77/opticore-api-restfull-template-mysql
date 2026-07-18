import type { Application } from "opticore-express";
import type { IRegisteredRoute } from "../view/profilerDetail.view";

let _expressApp: Application | null = null;

export function setIntrospectedApp(app: Application): void {
    _expressApp = app;
}

function getLayerPrefix(layer: any): string {
    try {
        const src: string = layer.regexp?.source ?? "";
        if (!src) return "";

        if (
            src === "^\\/?(?=\\/|$)" ||
            src === "^\\/(?=\\/|$)" ||
            src === "^\\/?$" ||
            src === "^\\/$"
        ) return "";

        let s = src.startsWith("^") ? src.slice(1) : src;

        const markers = ["\\/?(?=", "(?=\\/", "\\/?$", "(?=$)"];
        let endIdx = s.length;
        for (const m of markers) {
            const i = s.indexOf(m);
            if (i !== -1 && i < endIdx) endIdx = i;
        }
        s = s.slice(0, endIdx);

        s = s.replace(/\\\//g, "/").replace(/\\\./g, ".");
        if (s.endsWith("/?")) s = s.slice(0, -2);

        return s && s !== "/" ? s : "";
    } catch {
        return "";
    }
}

function extractRoutesFromApp(app: Application): IRegisteredRoute[] {
    const result: IRegisteredRoute[] = [];

    function traverse(stack: any[], prefix: string): void {
        for (const layer of stack ?? []) {
            if (!layer) continue;

            if (layer.route) {
                const methods: string[] = Object.keys(layer.route.methods ?? {})
                    .filter((m: string) => layer.route.methods[m])
                    .map((m: string) => m.toUpperCase());

                const routePath = String(layer.route.path ?? "");
                const fullPath = (prefix + routePath).replace(/\/+/g, "/") || "/";

                for (const method of methods) {
                    result.push({
                        method,
                        path: fullPath,
                        middlewareCount: layer.route.stack?.length ?? 1,
                    });
                }
            } else if (layer.handle && typeof layer.handle === "function" && layer.handle.stack) {
                const seg = getLayerPrefix(layer);
                traverse(layer.handle.stack, prefix + seg);
            }
        }
    }

    const router: any = (app as any)._router ?? (app as any).router;
    traverse(router?.stack ?? [], "");
    return result;
}

export function getExpressRoutes(): IRegisteredRoute[] {
    if (!_expressApp) return [];
    return extractRoutesFromApp(_expressApp);
}
