import type { Response } from "opticore-express";

/**
 * Buffers the entire response body and, if it ends up being `text/html` and
 * contains a closing `</body>`, splices `snippet` right before it. Buffering
 * (rather than streaming through) is what lets us make that html/non-html
 * decision after the fact, from the Content-Type the app actually set —
 * exactly how Symfony's toolbar listener rewrites `$response->getContent()`
 * on `kernel.response`. This never adds latency the client can perceive:
 * the client still gets the (now slightly larger) body in the same response,
 * nothing is deferred to after the response is sent.
 */
export function installHtmlInjection(res: Response, buildSnippet: () => string): void {
    const chunks: Buffer[] = [];
    let intercepting = true;

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    function toBuffer(chunk: unknown, encoding?: unknown): Buffer | null {
        if (chunk === undefined || chunk === null) return null;
        if (Buffer.isBuffer(chunk)) return chunk;
        const enc = typeof encoding === "string" ? (encoding as BufferEncoding) : "utf8";
        return Buffer.from(chunk as string, enc);
    }

    (res as unknown as { write: unknown }).write = function (chunk: unknown, ...rest: unknown[]): boolean {
        if (!intercepting) return originalWrite(chunk as never, ...(rest as never[]));
        const buf = toBuffer(chunk, rest[0]);
        if (buf) chunks.push(buf);
        return true;
    };

    (res as unknown as { end: unknown }).end = function (chunk?: unknown, ...rest: unknown[]): Response {
        if (!intercepting) return originalEnd(chunk as never, ...(rest as never[]));
        intercepting = false;

        const buf = toBuffer(chunk, rest[0]);
        if (buf) chunks.push(buf);

        const contentType = String(res.getHeader("content-type") ?? "");
        const isHtml = contentType.includes("text/html");
        let body = Buffer.concat(chunks);

        if (isHtml && !res.headersSent) {
            const text = body.toString("utf8");
            if (/<\/body>/i.test(text)) {
                const injected = text.replace(/<\/body>/i, `${buildSnippet()}\n</body>`);
                body = Buffer.from(injected, "utf8");
                res.setHeader("Content-Length", Buffer.byteLength(body));
            }
        }

        return originalEnd(body);
    };
}
