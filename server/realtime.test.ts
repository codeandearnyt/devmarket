import { describe, expect, it } from "vitest";
import { publishRealtime, subscribeRealtime } from "./realtime";

describe("realtime event hub", () => {
  it("sends a ready event and broadcasts catalog updates", () => {
    const writes: string[] = [];
    const response = { writableEnded: false, write: (value: string) => { writes.push(value); return true; } };
    const cleanup = subscribeRealtime(response as never);
    publishRealtime({ type: "catalog.updated", scope: "public", data: { productId: 1 } });
    publishRealtime({ type: "blog.updated", scope: "public", data: { slug: "shipping-ai" } });
    cleanup();
    expect(writes[0]).toContain("event: ready");
    expect(writes[1]).toContain("event: catalog.updated");
    expect(writes[1]).toContain('"productId":1');
    expect(writes[2]).toContain("event: blog.updated");
    expect(writes[2]).toContain('"slug":"shipping-ai"');
  });
});
