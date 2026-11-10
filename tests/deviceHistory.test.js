import { describe, expect, it } from "vitest";
import { deviceChain, historyCounts } from "../src/features/warranty/domain/deviceHistory";

describe("device history", () => {
  it("follows replacements in both directions without mixing other devices", () => {
    const cards = [
      { id: 1, serialNumber: "A", replacedBySerialNumber: "B", requests: [{ status: "returned", resolution: "replaced" }] },
      { id: 2, serialNumber: "B", replacedBySerialNumber: "C", requests: [{ status: "returned", resolution: "repaired" }] },
      { id: 3, serialNumber: "C", requests: [{ status: "canceled" }] },
      { id: 4, serialNumber: "D", requests: [] },
    ];
    expect(deviceChain(cards, cards[2]).map((c) => c.id)).toEqual([1, 2, 3]);
    expect(historyCounts(deviceChain(cards, cards[2]))).toEqual({ received: 2, repaired: 1, replaced: 1 });
  });
});

