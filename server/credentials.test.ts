import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./credentials";

describe("credential passwords", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const encoded = await hashPassword("correct horse battery staple");
    expect(encoded).toMatch(/^scrypt:/);
    expect(encoded).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery staple", encoded)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", encoded)).resolves.toBe(false);
  });

  it("rejects malformed or unsupported hashes", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "scrypt:1:1:1:c2FsdA:aGFzaA")).resolves.toBe(false);
  });
});
