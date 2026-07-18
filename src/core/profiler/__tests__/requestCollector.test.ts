import { RequestCollector } from "../collectors/request.collector";
import { Masker } from "../security/masker";
import type { CollectorContext } from "../types";

function makeCtx(overrides: { req?: any; res?: any } = {}): CollectorContext {
    const req = {
        method: "POST",
        originalUrl: "/users/42?x=1",
        url: "/users/42?x=1",
        headers: { authorization: "Bearer secret-token", "content-type": "application/json" },
        query: { x: "1" },
        body: { name: "Ada", password: "hunter2" },
        params: { id: "42" },
        ip: "10.0.0.1",
        cookies: { session: "abc", theme: "dark" },
        protocol: "http",
        hostname: "localhost",
        route: { path: "/users/:id", stack: [{ name: "updateUser" }] },
        socket: { remoteAddress: "10.0.0.1" },
        ...overrides.req,
    };
    const headers: Record<string, string> = { "content-type": "application/json" };
    const res = {
        statusCode: 200,
        getHeaders: () => headers,
        getHeader: (name: string) => headers[name],
        ...overrides.res,
    };
    return {
        token: "tok00001",
        req,
        res,
        startTime: Date.now(),
        startHrTime: process.hrtime.bigint(),
        heapUsedBefore: 0,
    } as unknown as CollectorContext;
}

describe("RequestCollector", () => {
    it("throws if getData() is called before collect()", () => {
        const collector = new RequestCollector();
        expect(() => collector.getData()).toThrow();
    });

    it("captures method, url, status and route info", () => {
        const collector = new RequestCollector();
        collector.collect(makeCtx());
        const data = collector.getData();

        expect(data.method).toBe("POST");
        expect(data.url).toBe("/users/42?x=1");
        expect(data.statusCode).toBe(200);
        expect(data.statusMessage).toBe("OK");
        expect(data.route.path).toBe("/users/:id");
        expect(data.route.controller).toBe("updateUser");
        expect(data.request.ip).toBe("10.0.0.1");
    });

    it("masks sensitive headers, cookies and body fields by default", () => {
        const collector = new RequestCollector();
        collector.collect(makeCtx());
        const data = collector.getData();

        expect(data.request.headers.authorization).not.toBe("Bearer secret-token");
        expect(data.request.headers["content-type"]).toBe("application/json");
        expect((data.request.body as Record<string, unknown>).password).not.toBe("hunter2");
        expect((data.request.body as Record<string, unknown>).name).toBe("Ada");
        expect(data.request.cookies?.session).not.toBe("abc");
        expect(data.request.cookies?.theme).toBe("dark");
    });

    it("respects a custom sensitive-key list", () => {
        const collector = new RequestCollector(new Masker(["x-custom-secret"]));
        collector.collect(makeCtx({ req: { headers: { "x-custom-secret": "shh", authorization: "Bearer visible" } } }));
        const data = collector.getData();

        expect(data.request.headers["x-custom-secret"]).not.toBe("shh");
        // authorization is no longer in the custom list, so it passes through untouched.
        expect(data.request.headers.authorization).toBe("Bearer visible");
    });

    it("falls back to statusMessage 'Unknown' for unmapped codes", () => {
        const collector = new RequestCollector();
        collector.collect(makeCtx({ res: { statusCode: 599 } }));
        expect(collector.getData().statusMessage).toBe("Unknown");
    });

    it("reset() clears previously collected data", () => {
        const collector = new RequestCollector();
        collector.collect(makeCtx());
        collector.reset();
        expect(() => collector.getData()).toThrow();
    });

    it("getName() returns a stable identifier", () => {
        expect(new RequestCollector().getName()).toBe("request");
    });
});
