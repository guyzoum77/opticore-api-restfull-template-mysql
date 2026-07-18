import { generateToken, generateUniqueToken, isValidToken } from "../token";

describe("token", () => {
    describe("generateToken", () => {
        it("defaults to an 8-character token", () => {
            expect(generateToken()).toHaveLength(8);
        });

        it.each([6, 7, 8])("supports length %i", (length) => {
            expect(generateToken(length)).toHaveLength(length);
        });

        it("only uses lowercase alphanumeric characters", () => {
            for (let i = 0; i < 200; i++) {
                expect(generateToken()).toMatch(/^[a-z0-9]{8}$/);
            }
        });

        it("rejects lengths outside [6, 8]", () => {
            expect(() => generateToken(5)).toThrow();
            expect(() => generateToken(9)).toThrow();
        });

        it("produces distinct tokens across many calls (statistical uniqueness)", () => {
            const tokens = new Set<string>();
            for (let i = 0; i < 5000; i++) tokens.add(generateToken());
            // 36^8 possibilities — 5000 draws should not collide in practice.
            expect(tokens.size).toBe(5000);
        });
    });

    describe("isValidToken", () => {
        it("accepts well-formed tokens", () => {
            expect(isValidToken("abc12345")).toBe(true);
            expect(isValidToken("ab12cd")).toBe(true);
        });

        it("rejects malformed input", () => {
            expect(isValidToken("")).toBe(false);
            expect(isValidToken("AB12CD")).toBe(false); // uppercase not allowed
            expect(isValidToken("abcde")).toBe(false); // too short
            expect(isValidToken("abcdefghi")).toBe(false); // too long
            expect(isValidToken("abc-123")).toBe(false); // invalid char
            expect(isValidToken(42)).toBe(false);
            expect(isValidToken(undefined)).toBe(false);
        });
    });

    describe("generateUniqueToken", () => {
        it("retries until exists() reports no collision", () => {
            let calls = 0;
            const token = generateUniqueToken(() => {
                calls++;
                return calls < 3; // first two attempts "collide"
            });
            expect(calls).toBe(3);
            expect(isValidToken(token)).toBe(true);
        });

        it("gives up after repeated collisions", () => {
            expect(() => generateUniqueToken(() => true)).toThrow();
        });
    });
});
