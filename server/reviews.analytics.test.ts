import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user?: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("reviews, newsletter, and analytics boundaries", () => {
  it("requires authentication before a buyer can submit a review", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.orders.submitReview({ productId: 1, rating: 5, review: "A useful product for builders." })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("protects subscriber analytics from non-admin accounts", async () => {
    const caller = appRouter.createCaller(context({ id: 4, openId: "buyer", email: "buyer@example.com", name: "Buyer", loginMethod: "test", role: "user", isDisabled: false, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }));
    await expect(caller.admin.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.subscribers()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
