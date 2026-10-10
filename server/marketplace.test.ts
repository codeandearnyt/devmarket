import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(role: "user" | "admin" = "user"): TrpcContext {
  const user = { id: 7, openId: "test-user", email: "buyer@example.com", name: "Test Buyer", loginMethod: "test", role, isDisabled: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return {
    user,
    // The console runs on its own session, so an admin call is authorised by
    // `adminUser` rather than by the buyer's role on the storefront session.
    adminUser: role === "admin" ? user : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("DevMarket access controls", () => {
  it("returns the current authenticated user through auth.me", async () => {
    const result = await appRouter.createCaller(context()).auth.me();
    expect(result?.email).toBe("buyer@example.com");
    expect(result?.role).toBe("user");
  });

  it("blocks buyer accounts from admin stats", async () => {
    await expect(appRouter.createCaller(context("user")).admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin accounts past the role gate", async () => {
    const result = await appRouter.createCaller(context("admin")).admin.stats();
    expect(result).toHaveProperty("pendingApprovals");
  });
});
