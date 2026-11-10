import { describe, expect, it } from "vitest";
import { isCartPcSet } from "../src/features/cart/domain/pcBuildSets";

describe("PC groups in cart and checkout", () => {
  it("does not count a duplicated variant as two cart lines", () => {
    expect(isCartPcSet({ itemVariantIds: ["1", "1", "2"] }, [{ id: "1" }])).toBe(false);
  });
  it("recognizes two distinct variants even when IDs have different types", () => {
    expect(isCartPcSet({ itemVariantIds: [1, 1, 2] }, [{ id: "1" }, { id: "2" }])).toBe(true);
  });
});
