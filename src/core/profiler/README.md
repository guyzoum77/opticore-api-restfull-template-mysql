# OptiCore Profiler

A Symfony WebProfilerBundle-style profiler for the OptiCore Express stack:
**collect → persist by token → display deferred**. Replaces the previous
`src/core/debug` web debug toolbar (see [Migration](#migration) below).

## Architecture

```
src/core/profiler/
├── index.ts                       Public API barrel
├── types.ts                       DataCollector, Profile, ProfilerStorage, ProfilerOptions...
├── token.ts                       Short alphanumeric token generator
├── context.ts                     AsyncLocalStorage request context
├── registry.ts                    CollectorRegistry
├── security/
│   ├── masker.ts                  Sensitive-key redaction
│   └── escape.ts                  HTML escaping
├── collectors/                    Phase 1 — Collection
│   ├── request.collector.ts
│   ├── time.collector.ts
│   ├── memory.collector.ts
│   ├── database.collector.ts
│   ├── logger.collector.ts
│   └── exception.collector.ts
├── instrumentation/                Non-intrusive decoration, wired once at bootstrap
│   ├── mysql.instrumentation.ts    decorates OptiCoreMySQLDriver.prototype.makeQuery
│   └── logger.instrumentation.ts   decorates LoggerCore.prototype.{info,warn,error,debug,success}
├── storage/                       Phase 2 — Persistence
│   ├── memory.storage.ts          circular buffer, lost on restart
│   └── file.storage.ts            JSON files under a directory + index
├── middleware/
│   ├── profiler.middleware.ts     opticoreProfiler() — the one integration point
│   ├── errorHandler.middleware.ts profilerErrorHandler() + process-level fallback
│   ├── htmlInjector.ts            buffers HTML responses to splice the toolbar snippet in
│   └── snippet.ts                 the few lines injected before </body>
├── view/                          Flattens a Profile back into the legacy view shape
│   ├── legacyAdapter.ts           (kept so the existing njk templates/CSS never changed)
│   ├── toolbar.view.ts, profilerList.view.ts, profilerDetail.view.ts, helpers.view.ts
├── controllers/profiler.controller.ts
├── routes/                        Phase 3 — Display
│   ├── profiler.router.ts
│   └── profiler.router.handler.ts
├── views/templates/               Same CSS/HTML as before, minus the full-page toolbar doc
└── __tests__/
```

### The 4 principles, and where they live

1. **Collectors observe, they never intrude.** `DataCollector` (`types.ts`)
   defines `collect(ctx, error?) / getName() / getData() / reset()`.
   `RequestCollector`/`TimeCollector`/`MemoryCollector` read only from the
   `req`/`res` objects the middleware already has. `DatabaseCollector` and
   `LoggerCollector` are fed by **decorating** `OptiCoreMySQLDriver.prototype.makeQuery`
   and `LoggerCore.prototype.{info,warn,error,debug,success}` **once, at
   bootstrap** (`instrumentMySQL`/`instrumentLogger`) — business code keeps
   calling `db.query(...)` / `logger.info(...)` completely unmodified, and
   unaware profiling exists. The link between "a query just ran" and "which
   request is that for" is `AsyncLocalStorage` (`context.ts`), the Node
   analogue of what a DI container gives Symfony's collectors implicitly.
   Register custom collectors on the registry the middleware exposes:
   `profiler.registry.register(() => new MyCollector())`.

2. **Persistence is decoupled from collection, keyed by token.** Every
   profiled request gets a short token (`token.ts`, 6–8 alphanumeric chars).
   On `res.on('finish')` — i.e. **after** the response has already been sent,
   so this adds zero perceived latency — every collector's `getData()` is
   assembled into a `Profile` and handed to a `ProfilerStorage`
   (`MemoryStorage` or `FileStorage`, under `src/core/cache/profiler/` by
   default). `X-Debug-Token` and `X-Debug-Token-Link` headers are set on
   every profiled response. Automatic purge runs after each write
   (`retentionMs`, default 24h).

3. **Display is deferred and AJAX-loaded, not embedded.** The middleware
   never renders a toolbar into the page it's decorating. It buffers HTML
   responses (`middleware/htmlInjector.ts`) and, only when the response is
   `text/html`, splices a handful of lines before `</body>`
   (`middleware/snippet.ts`): a stylesheet `<link>` and a `<script>` that
   fetches `GET ${routePrefix}/wdt/:token` and swaps it in. That fragment,
   plus `GET ${routePrefix}` (list) and `GET ${routePrefix}/:token` (detail,
   one panel per collector), are the only 3 profiler routes — all excluded
   from profiling themselves. `assets/js/toolbar.js` also wraps `fetch` and
   `XMLHttpRequest` client-side so AJAX calls the page itself makes (which
   carry the same `X-Debug-Token` header, since they're profiled requests
   too) show up live in the toolbar's HTTP list.

4. **Ephemeral by default, safe by construction.** `enabled` defaults to
   `false` — must be explicitly turned on (`NODE_ENV === 'development'`).
   `RequestCollector` masks configurable sensitive keys (`security/masker.ts`,
   default list in `DEFAULT_SENSITIVE_KEYS`: `authorization`, `cookie`,
   `password`, `token`, `session`, ...) in headers/cookies/query/body
   **before** the data is ever persisted. Nunjucks' `autoescape: true` covers
   template output; `security/escape.ts` and `toolbar.js`'s own
   `escapeHtml()` cover the two spots that build HTML by hand. `profiler.clear()`
   purges everything on demand.

## Integration example

```ts
import { express } from "opticore-express";
import { OptiCoreMySQLDriver } from "opticore-mysqldb";
import { LoggerCore } from "opticore-logger";
import {
    opticoreProfiler,
    profilerErrorHandler,
    registerProfilerViews,
    createProfilerRouter,
    instrumentMySQL,
    instrumentLogger,
    FileStorage,
} from "./core/profiler";

const app = express();

// Decorate infrastructure once, at bootstrap — never touches business code.
instrumentMySQL(OptiCoreMySQLDriver);
instrumentLogger(LoggerCore);

const profiler = opticoreProfiler({
    enabled: process.env.NODE_ENV === "development",
    storage: new FileStorage("src/core/cache/profiler"),
});

app.use(profiler);                        // 1. collection + token + deferred display
registerProfilerViews(app, profiler);      // 2. view engine, static assets, "/" page

app.use(/* ...your feature routers, including createProfilerRouter(profiler)... */);

app.use(profilerErrorHandler());           // 3. after routes: feeds ExceptionCollector
app.use(yourOwnErrorHandler);              //    your app's error handling is untouched
```

Registering a custom collector:

```ts
class CacheHitCollector implements DataCollector<{ hits: number; misses: number }> {
    private hits = 0;
    private misses = 0;
    getName() { return "cache"; }
    recordHit() { this.hits++; }
    recordMiss() { this.misses++; }
    collect() {}
    getData() { return { hits: this.hits, misses: this.misses }; }
    reset() { this.hits = 0; this.misses = 0; }
}

profiler.registry.register(() => new CacheHitCollector());
```

Elsewhere, from your cache layer (decorated once, same pattern as the DB driver):

```ts
getActiveCollector<CacheHitCollector>("cache")?.recordHit();
```

## Migration

The previous `src/core/debug` module (routes under `/_debug/*`, a
poll/SSE-refreshed toolbar embedded directly in `home.njk`) has been removed
and replaced entirely — this was a full architectural rewrite, not an
additive one, per the request that motivated it.

| Before (`/_debug`) | After (`/_profiler`) |
|---|---|
| `GET /_debug/profiler` | `GET /_profiler` |
| `GET /_debug/profiler/:token` | `GET /_profiler/:token` |
| `GET /_debug/toolbar` (full page) | `GET /_profiler/wdt/:token` (AJAX fragment) |
| `GET /_debug/api/profiles` (polled every 2s) | removed — the toolbar is loaded once per page and grows via client-side `fetch`/`XHR` interception |
| `registerDebugToolbar(app)` | `app.use(opticoreProfiler(options))` + `registerProfilerViews(app, profiler)` |
| `debugStore` (in-memory only) | `MemoryStorage` or `FileStorage`, pluggable via `ProfilerStorage` |
| SQL/log collectors populated only if you called `sqlCollector.record(...)` / `logCollector.record(...)` manually | `DatabaseCollector`/`LoggerCollector` populate automatically once `instrumentMySQL`/`instrumentLogger` run at bootstrap |

CSS and HTML markup are unchanged (`toolbar-standalone.css`, `profiler-list.njk`,
`profiler-detail.njk`, the panel templates) — only `toolbar-live.njk` /
`toolbar-live.css` / `toolbar-live.js` (the old embedded, polling toolbar)
were dropped, superseded by the single AJAX-loaded `toolbar-wdt.njk` +
`toolbar.js`.
