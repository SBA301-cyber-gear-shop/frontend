import { afterEach, expect, test, vi } from "vitest";
import {
  fullSetFit,
  minFullSetBudget,
  pcBudgetOf,
  reserveFor,
  selectionFromSuggestion,
  selectionTotal,
  withPeripherals,
} from "../src/features/pc-builder/domain/fullSet";
import { checkSuggestInput } from "../src/features/pc-builder/hooks/usePcBuilder";
import { fullSetMinimum } from "../src/features/pc-builder/components/AiErrorBox";
import { pcBuilderApi } from "../src/features/pc-builder/api/pcBuilderApi";
import { axiosClient } from "../src/services";
import type { BudgetFit, PeripheralItem, PeripheralSuggestionResponse } from "../src/features/pc-builder/types/pcBuilder.types";

const range = { min: 2_800_000, max: 36_370_000 };
const options = { minBudget: 8_000_000, floorPrice: 6_000_000, maxBudget: 9_999_999_999 };

const item = (variantId: number, price: number): PeripheralItem => ({
  variantId,
  productName: `SP ${variantId}`,
  variantName: "Tiêu chuẩn",
  price,
  highlights: [],
});

const suggestion: PeripheralSuggestionResponse = {
  pcTotal: 23_000_000,
  available: 7_000_000,
  spendLimit: 5_750_000,
  peripheralTotal: 5_070_000,
  grandTotal: 28_070_000,
  roles: [
    { role: "monitor", label: "Màn hình", picked: item(203, 3_890_000), options: [item(203, 3_890_000)] },
    { role: "keyboard", label: "Bàn phím", picked: item(213, 690_000), options: [item(213, 690_000)] },
    { role: "mouse", label: "Chuột", picked: item(224, 490_000), options: [item(224, 490_000)] },
  ],
};

afterEach(() => vi.restoreAllMocks());

test.each([
  [12_000_000, 2_800_000], // 20% = 2,4 triệu, dưới mức tối thiểu
  [14_000_000, 2_800_000], // 20% đúng bằng mức tối thiểu
  [30_000_000, 6_000_000],
  [181_850_000, 36_370_000], // 20% đúng bằng trần
  [300_000_000, 36_370_000],
  [1_000_000_000, 36_370_000], // không bao giờ giữ 200 triệu cho 3 món
])("reserveFor(%d) = %d", (budget, reserve) => {
  expect(reserveFor(budget, range)).toBe(reserve);
});

test.each([
  [8_000_000, 10_800_000], // mức sàn rơi vào đoạn 2,8 triệu cố định
  [20_000_000, 25_000_000], // mức sàn rơi vào đoạn 20%
  [200_000_000, 236_370_000], // mức sàn rơi vào đoạn trần
])("minFullSetBudget(%d) = %d", (pcMin, full) => {
  const minimum = minFullSetBudget(pcMin, range);
  expect(minimum).toBe(full);
  // Đúng mức tối thiểu thì đủ, thiếu 1 đồng thì không đủ
  expect(minimum - reserveFor(minimum, range)).toBeGreaterThanOrEqual(pcMin);
  expect(minimum - 1 - reserveFor(minimum - 1, range)).toBeLessThan(pcMin);
});

test("pcBudgetOf: trừ tiền phụ kiện, không bao giờ về 0 hay âm vì /validate đòi ngân sách từ 1", () => {
  expect(pcBudgetOf(30_000_000, 5_070_000)).toBe(24_930_000);
  expect(pcBudgetOf(30_000_000, 0)).toBe(30_000_000);
  expect(pcBudgetOf(3_000_000, 3_000_000)).toBe(1);
  expect(pcBudgetOf(3_000_000, 28_000_000)).toBe(1);
});

test("fullSetFit: tính trên cả bộ", () => {
  expect(fullSetFit(30_000_000, 23_000_000, 5_070_000).percent).toBeCloseTo(93.57, 2);
  expect(fullSetFit(30_000_000, 23_000_000, 5_070_000)).toMatchObject({ leftover: 1_930_000, isOver: false });
  expect(fullSetFit(30_000_000, 26_000_000, 5_000_000)).toMatchObject({ leftover: -1_000_000, isOver: true });
  expect(fullSetFit(30_000_000, 25_000_000, 5_000_000).isOver).toBe(false); // vừa đúng ngân sách
  expect(fullSetFit(0, 1, 1)).toEqual({ percent: 0, leftover: -2, isOver: true });
});

test("withPeripherals: lời nhận xét nói đúng số của cả bộ, giữ nguyên các trường khác", () => {
  const fit: BudgetFit = { ratio: 0.95, percent: 95, status: "IN_WINDOW", windowMin: 21_600_000, windowMax: 24_000_000, leftover: 1_000_000 };
  const shown = withPeripherals(fit, 30_000_000, 23_000_000, 5_070_000);
  expect(shown?.leftover).toBe(1_930_000);
  expect(shown?.percent).toBeCloseTo(93.57, 2);
  expect(shown?.status).toBe("IN_WINDOW");
  expect(withPeripherals(null, 30_000_000, 23_000_000, 5_070_000)).toBeNull();
  expect(withPeripherals(undefined, 30_000_000, 23_000_000, 5_070_000)).toBeNull();
});

test("selectionFromSuggestion và selectionTotal: món bỏ tick không tính tiền", () => {
  const selection = selectionFromSuggestion(suggestion);
  expect(selection.monitor?.variantId).toBe(203);
  expect(selectionTotal(selection)).toBe(5_070_000);
  expect(selectionTotal({ ...selection, mouse: null })).toBe(4_580_000);
  expect(selectionTotal({})).toBe(0);
});

test("checkSuggestInput: chế độ thùng máy giữ nguyên hành vi cũ", () => {
  expect(checkSuggestInput(8_000_000, "Game", options)).toBeNull();
  expect(checkSuggestInput(7_999_999, "Game", options)).toMatch(/Ngân sách tối thiểu để ráp một bộ máy mới là 8\.000\.000/);
});

test("checkSuggestInput: chế độ trọn bộ đòi thêm tiền phụ kiện và nói rõ lý do", () => {
  expect(checkSuggestInput(10_800_000, "Game", options, false, range)).toBeNull();
  expect(checkSuggestInput(10_799_999, "Game", options, false, range)).toMatch(/Trọn bộ.*tối thiểu 10\.800\.000/);
  expect(checkSuggestInput(10_000_000, "Game", options, false, range)).toMatch(/Trọn bộ/);
  expect(checkSuggestInput(20_000_000, "", options, false, range)).toMatch(/nhu cầu/);
  expect(checkSuggestInput(10_000_000_000, "Game", options, false, range)).toMatch(/tối đa/);
});

test("fullSetMinimum: hộp lỗi đổi mức tối thiểu của thùng máy sang mức của trọn bộ", () => {
  expect(fullSetMinimum(8_000_000, range)).toBe(10_800_000);
  expect(fullSetMinimum(8_000_000, null)).toBe(8_000_000);
  expect(fullSetMinimum(8_000_000, undefined)).toBe(8_000_000);
});

test("suggestPeripherals gọi đúng endpoint, gửi nguyên body, không gửi giá", async () => {
  const post = vi.spyOn(axiosClient, "post").mockResolvedValue({ data: { status: 200, message: "", data: suggestion } });
  const body = { budget: 30_000_000, archetype: "GAMING", items: [{ role: "cpu" as const, variantId: 1, quantity: 1 }] };

  await expect(pcBuilderApi.suggestPeripherals(body)).resolves.toEqual(suggestion);

  expect(post).toHaveBeenCalledWith("/api/v1/pc-build/peripherals", body, { signal: undefined });
});
