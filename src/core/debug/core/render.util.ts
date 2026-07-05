import type { Response } from "opticore-express";

/**
 * Renders a Nunjucks view and sends it, wrapping Express's callback-style
 * res.render() in a Promise so the caller can safely `await` it — this
 * guarantees res.headersSent is true before the route handler returns,
 * which the OpticoreRoutingFactory wrapper relies on to skip its own
 * auto-json response.
 */
export function renderView(res: Response, view: string, data: object = {}): Promise<void> {
    return new Promise((resolve, reject) => {
        res.render(view, data, (err: Error | null, html?: string) => {
            if (err) {
                reject(err);
                return;
            }
            res.setHeader("Cache-Control", "no-store");
            res.send(html);
            resolve();
        });
    });
}
