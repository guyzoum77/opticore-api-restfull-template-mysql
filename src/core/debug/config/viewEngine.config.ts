import { join } from "path";
import nunjucks from "nunjucks";
import type { Application } from "opticore-express";

let configured = false;

export function configureDebugViewEngine(app: Application): void {
    if (configured) return;
    configured = true;

    const viewsDir = join(__dirname, "..", "views", "templates");
    nunjucks.configure(viewsDir, {
        autoescape: true,
        express: app,
        noCache: process.env.NODE_ENV !== "production",
    });
    app.set("views", viewsDir);
}
