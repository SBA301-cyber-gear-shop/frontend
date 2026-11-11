import { describe, expect, it } from "vitest";
import { ramCapacity } from "../src/features/products/domain/ramCapacity";

describe("RAM capacity", () => {
  it("reads the catalog capacity and demo data", () => {
    expect(ramCapacity({ specs: { Capacity_GB: "8" } })).toBe(8);
    expect(ramCapacity({ specs: { "Dung lượng": "16GB" } })).toBe(16);
    expect(ramCapacity({ specs: {}, tech: { capacity: 32 } })).toBe(32);
  });
  it("does not invent a capacity from missing or ambiguous data", () => {
    expect(ramCapacity({ specs: {} })).toBeNull();
    expect(ramCapacity({ specs: { Capacity_GB: "2 x 8 GB" } })).toBeNull();
    expect(ramCapacity({ specs: { Capacity_GB: "0" } })).toBeNull();
  });
});
