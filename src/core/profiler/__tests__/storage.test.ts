import { mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { MemoryStorage } from "../storage/memory.storage";
import { FileStorage } from "../storage/file.storage";
import type { Profile } from "../types";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
    return {
        token: overrides.token ?? "tok00001",
        ip: "127.0.0.1",
        method: "GET",
        url: "/test",
        statusCode: 200,
        time: Date.now(),
        duration: 12,
        collectors: {},
        ...overrides,
    };
}

describe("MemoryStorage", () => {
    it("writes and reads a profile back", () => {
        const storage = new MemoryStorage(10);
        const profile = makeProfile();
        storage.write(profile);
        expect(storage.read(profile.token)).toEqual(profile);
    });

    it("returns undefined for an unknown token", () => {
        const storage = new MemoryStorage(10);
        expect(storage.read("missing1")).toBeUndefined();
    });

    it("find() returns most-recent-first", () => {
        const storage = new MemoryStorage(10);
        storage.write(makeProfile({ token: "first000", time: 1 }));
        storage.write(makeProfile({ token: "second00", time: 2 }));
        storage.write(makeProfile({ token: "third000", time: 3 }));

        expect(storage.find().map(p => p.token)).toEqual(["third000", "second00", "first000"]);
    });

    it("respects the limit passed to find()", () => {
        const storage = new MemoryStorage(10);
        for (let i = 0; i < 5; i++) storage.write(makeProfile({ token: `tok0000${i}`, time: i }));
        expect(storage.find(2)).toHaveLength(2);
    });

    it("evicts the oldest profile once the circular buffer is full", () => {
        const storage = new MemoryStorage(3);
        storage.write(makeProfile({ token: "aaaaaaaa", time: 1 }));
        storage.write(makeProfile({ token: "bbbbbbbb", time: 2 }));
        storage.write(makeProfile({ token: "cccccccc", time: 3 }));
        storage.write(makeProfile({ token: "dddddddd", time: 4 }));

        expect(storage.count()).toBe(3);
        expect(storage.read("aaaaaaaa")).toBeUndefined();
        expect(storage.read("dddddddd")).toBeDefined();
    });

    it("purge() removes profiles older than the given window", () => {
        const storage = new MemoryStorage(10);
        const now = Date.now();
        storage.write(makeProfile({ token: "oldoldol", time: now - 10_000 }));
        storage.write(makeProfile({ token: "freshfre", time: now }));

        storage.purge(5_000);

        expect(storage.read("oldoldol")).toBeUndefined();
        expect(storage.read("freshfre")).toBeDefined();
    });

    it("clear() empties the store", () => {
        const storage = new MemoryStorage(10);
        storage.write(makeProfile());
        storage.clear();
        expect(storage.count()).toBe(0);
        expect(storage.find()).toHaveLength(0);
    });

    it("rejects a non-positive limit", () => {
        expect(() => new MemoryStorage(0)).toThrow();
    });
});

describe("FileStorage", () => {
    let dir: string;

    beforeEach(() => {
        dir = mkdtempSync(join(tmpdir(), "opticore-profiler-test-"));
    });

    afterEach(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    it("creates the storage directory lazily", () => {
        expect(existsSync(dir)).toBe(true);
        // eslint-disable-next-line no-new
        new FileStorage(join(dir, "nested"));
        expect(existsSync(join(dir, "nested"))).toBe(true);
    });

    it("writes a profile to its own file and to the index", () => {
        const storage = new FileStorage(dir);
        const profile = makeProfile();
        storage.write(profile);

        expect(existsSync(join(dir, `${profile.token}.json`))).toBe(true);
        expect(existsSync(join(dir, "index.json"))).toBe(true);
        expect(storage.read(profile.token)).toEqual(profile);
    });

    it("find() reads from the index only (no collector payload)", () => {
        const storage = new FileStorage(dir);
        storage.write(makeProfile({ token: "aaaaaaaa", time: 1, collectors: { request: { big: "payload" } } }));
        storage.write(makeProfile({ token: "bbbbbbbb", time: 2 }));

        const found = storage.find();
        expect(found.map(p => p.token)).toEqual(["bbbbbbbb", "aaaaaaaa"]);
        expect(found[0].collectors).toEqual({});
    });

    it("evicts the oldest file once maxIndexSize is exceeded", () => {
        const storage = new FileStorage(dir, 2);
        storage.write(makeProfile({ token: "aaaaaaaa", time: 1 }));
        storage.write(makeProfile({ token: "bbbbbbbb", time: 2 }));
        storage.write(makeProfile({ token: "cccccccc", time: 3 }));

        expect(storage.find()).toHaveLength(2);
        expect(existsSync(join(dir, "aaaaaaaa.json"))).toBe(false);
        expect(existsSync(join(dir, "cccccccc.json"))).toBe(true);
    });

    it("purge() deletes both the file and the index entry", () => {
        const storage = new FileStorage(dir);
        const now = Date.now();
        storage.write(makeProfile({ token: "oldoldol", time: now - 10_000 }));
        storage.write(makeProfile({ token: "freshfre", time: now }));

        storage.purge(5_000);

        expect(existsSync(join(dir, "oldoldol.json"))).toBe(false);
        expect(storage.find().map(p => p.token)).toEqual(["freshfre"]);
    });

    it("clear() removes every profile file and empties the index", () => {
        const storage = new FileStorage(dir);
        storage.write(makeProfile({ token: "aaaaaaaa" }));
        storage.write(makeProfile({ token: "bbbbbbbb" }));

        storage.clear();

        expect(storage.find()).toHaveLength(0);
        expect(existsSync(join(dir, "aaaaaaaa.json"))).toBe(false);
        expect(existsSync(join(dir, "bbbbbbbb.json"))).toBe(false);
    });

    it("read() returns undefined for a token that was never written", () => {
        const storage = new FileStorage(dir);
        expect(storage.read("missing1")).toBeUndefined();
    });
});
