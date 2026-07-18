import { IProfilerListRow, IProfilerListViewModel, IRequestProfile, ProfilerListTab } from "../types";

function statusClassOf(code: number): "ok" | "redirect" | "error" {
    if (code >= 400) return "error";
    if (code >= 300) return "redirect";
    return "ok";
}

function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function fmtClock(ts: number): string {
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Shared with the SSE stream (GET /_profiler/stream) so live rows are formatted identically to the list page. */
export function toProfilerListRow(p: IRequestProfile): IProfilerListRow {
    return {
        token: p.token,
        tokenShort: p.token.slice(0, 6),
        statusCode: p.statusCode,
        statusClass: statusClassOf(p.statusCode),
        method: p.method,
        url: p.url,
        dateStr: fmtDate(p.timestamp),
        timeStr: fmtClock(p.timestamp),
        duration: p.duration,
        contentType: p.response.contentType,
    };
}

function tabHref(
    tab: ProfilerListTab,
    search: string,
    method: string,
    status: string,
    ip: string,
    token: string,
    from: string,
    until: string,
    limit: number
): string {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (method) params.set("method", method);
    if (status) params.set("status", status);
    if (ip) params.set("ip", ip);
    if (token) params.set("token", token);
    if (from) params.set("from", from);
    if (until) params.set("until", until);
    if (limit !== 10) params.set("limit", String(limit));
    if (tab !== "requests") params.set("tab", tab);
    const qs: string = params.toString();
    return `/_profiler${qs ? "?" + qs : ""}`;
}

export function buildProfilerListViewModel(
    profiles: IRequestProfile[],
    search = "",
    method = "",
    status = "",
    limit = 10,
    ip = "",
    token = "",
    from = "",
    until = "",
    tab: ProfilerListTab = "requests"
): IProfilerListViewModel {
    let filtered: IRequestProfile[] = [...profiles];

    if (ip) {
        filtered = filtered.filter((p: IRequestProfile): boolean => (p.request?.ip ?? "").toLowerCase().includes(ip.toLowerCase()));
    }
    if (token) {
        filtered = filtered.filter((p: IRequestProfile): boolean => p.token.toLowerCase().startsWith(token.toLowerCase()));
    }
    if (search) {
        filtered = filtered.filter((p: IRequestProfile): boolean => p.url.toLowerCase().includes(search.toLowerCase()));
    }
    if (method) {
        filtered = filtered.filter((p: IRequestProfile): boolean => p.method === method.toUpperCase());
    }
    if (status) {
        const code: number = parseInt(status, 10);
        if (code >= 100) {
            filtered = filtered.filter((p: IRequestProfile): boolean => p.statusCode === code);
        } else if (code >= 1 && code <= 9) {
            const prefix: number = code * 100;
            filtered = filtered.filter((p: IRequestProfile): boolean => p.statusCode >= prefix && p.statusCode < prefix + 100);
        }
    }
    if (from) {
        const ts: number = new Date(from).getTime();
        if (!isNaN(ts)) filtered = filtered.filter((p: IRequestProfile): boolean => p.timestamp >= ts);
    }
    if (until) {
        const ts: number = new Date(until).getTime() + 86399999;
        if (!isNaN(ts)) filtered = filtered.filter((p: IRequestProfile): boolean => p.timestamp <= ts);
    }

    filtered = filtered.slice(0, limit);
    const isFiltered: boolean = !!(search || method || status || ip || token || from || until);
    const rows: IProfilerListRow[] = filtered.map(toProfilerListRow);

    return {
        tab,
        resultCount: filtered.length,
        rows,
        autoReload: !isFiltered && tab === "requests",
        filters: {
            ip, status, search, token, from, until,
            hasProfiles: profiles.length > 0,
            methodOptions: ["Any", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].map((m: string) => {
                const value: string = m === "Any" ? "" : m;
                return { value, label: m, selected: method === value };
            }),
            limitOptions: [10, 25, 50, 100].map((n: number) => ({ value: n, selected: limit === n })),
        },
        tabs: {
            requests: { href: tabHref("requests", search, method, status, ip, token, from, until, limit), active: tab === "requests" },
            commands: { href: tabHref("commands", search, method, status, ip, token, from, until, limit), active: tab === "commands" },
        },
    };
}
