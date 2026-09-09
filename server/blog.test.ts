import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function buyerContext(): TrpcContext {
  return {
    user: { id: 7, openId: "test-user", email: "buyer@example.com", name: "Test Buyer", loginMethod: "test", role: "user", isDisabled: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("blog access controls", () => {
  it("keeps the blog CMS protected from buyer accounts", async () => {
    const caller = appRouter.createCaller(buyerContext());
    await expect(caller.admin.blogs()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects malformed admin blog input before mutation", async () => {
    const caller = appRouter.createCaller(buyerContext());
    await expect(caller.admin.createBlog({ title: "x" } as never)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
