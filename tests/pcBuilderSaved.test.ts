import { expect, test } from "vitest";
import { itemsFromCartSet, savedBuildToCartSet } from "../src/features/pc-builder/domain/buildLines";

test("bộ đã lưu mở lại được qua luồng nạp bộ PC: đủ món, ngân sách = tổng lúc lưu", () => {
  const saved = {
    buildId: 12,
    total: 8_280_000,
    items: [
      { category: "CPU", id: 11, name: "Ryzen 5 7500F", qty: 1, price: 6_300_000 },
      { category: "RAM", id: 31, name: "DDR5 16GB", qty: 2, price: 990_000 },
    ],
  };
  const set = savedBuildToCartSet(saved);
  expect(set.id).toBe(12);
  expect(itemsFromCartSet(set)).toEqual({
    budget: 8_280_000,
    items: [
      { variantId: 11, qty: 1 },
      { variantId: 31, qty: 2 },
    ],
  });
});
