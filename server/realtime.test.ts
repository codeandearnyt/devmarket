import { describe, expect, it } from "vitest";
import { publishRealtime, subscribeRealtime } from "./realtime";

describe("realtime event hub", () => {
  it("sends a ready event and broadcasts catalog updates", () => {
    const writes: string[] = [];
    const response = { writableEnded: false, write: (value: string) => { writes.push(value); return true; } };
    const cleanup = subscribeRealtime(response as never);
    publishRealtime({ type: "catalog.updated", scope: "public", data: { productId: 1 } });
    cleanup();
    expect(writes[0]).toContain("event: ready");
    expect(writes[1]).toContain("event: catalog.updated");
    expect(writes[1]).toContain('"productId":1');
  });
});
