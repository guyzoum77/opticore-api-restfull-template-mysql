import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Generates a short (default 8 chars) alphanumeric token by rejection-sampling
 * random bytes against a 36-symbol alphabet, so every character is unbiased.
 */
export function generateToken(length = 8): string {
    if (length < 6 || length > 8) {
        throw new Error("Profiler token length must be between 6 and 8 characters");
    }

    let out = "";
    while (out.length < length) {
        const bytes = randomBytes(length);
        for (let i = 0; i < bytes.length && out.length < length; i++) {
            const byte = bytes[i] as number;
            // 252 = 36 * 7, the largest multiple of 36 <= 256 — keeps the mapping unbiased.
            if (byte < 252) {
                out += ALPHABET[byte % 36];
            }
        }
    }
    return out;
}

export function isValidToken(token: unknown): token is string {
    return typeof token === "string" && /^[a-z0-9]{6,8}$/.test(token);
}

/**
 * Generates a token guaranteed not to collide with `exists()`. Retries a
 * bounded number of times before giving up (collision odds at 8 chars over a
 * 36-symbol alphabet are ~1 in 2.8e12, so this only matters for tests using
 * tiny lengths).
 */
export function generateUniqueToken(exists: (token: string) => boolean, length = 8): string {
    for (let attempt = 0; attempt < 20; attempt++) {
        const token = generateToken(length);
        if (!exists(token)) return token;
    }
    throw new Error("Unable to generate a unique profiler token after 20 attempts");
}
