import { expect, test } from "vitest";
import {
  buildKey,
  buildableRequirement,
  checkInput,
  itemsFromCartSet,
  lineTotal,
  replaceLine,
  saveErrorText,
  setLineQty,
  slotRows,
  toItemRequests,
} from "../src/features/pc-builder/domain/buildLines";
import type { AnalyzeResponse, BuildItem } from "../src/features/pc-builder/types/pcBuilder.types";

const line = (category: string, id: number, price: number, qty = 1, maxQty = 1): BuildItem => ({
  category,
  id,
  name: `${category} #${id}`,
  qty,
  maxQty,
  price,
});

const officeBuild: BuildItem[] = [
  line("MONITOR", 1, 2_000_000),
  line("KEYBOARD", 2, 300_000),
  line("MOUSE", 3, 200_000),
  line("CPU", 4, 3_000_000),
  line("MAINBOARD", 5, 2_000_000),
  line("RAM", 6, 800_000, 2, 4),
  line("SSD", 7, 1_000_000, 1, 2),
  line("COOLER", 9, 400_000),
  line("CASE", 10, 900_000),
  line("PSU", 11, 1_000_000),
];

const analysis = (overrides: Partial<AnalyzeResponse>): AnalyzeResponse => ({
  status: "READY",
  message: "",
  requirement: { budget: 20_000_000, purpose: "GAMING" },
  minBudget: 16_000_000,
  maxBuildPrice: 200_000_000,
  suggestedPurposes: [],
  explanation: null,
  suggestedBudget: null,
  notes: [],
  ...overrides,
});

test("checkInput chặn ngân sách và mô tả sai trước khi tốn một lượt gọi AI", () => {
  expect(checkInput(0, "chơi game")).toContain("lớn hơn 0");
  expect(checkInput(-5, "chơi game")).toContain("lớn hơn 0");
  expect(checkInput(10_000_000_000, "chơi game")).toContain("tối đa");
  expect(checkInput(20_000_000, "   ")).toContain("mô tả nhu cầu");
  expect(checkInput(20_000_000, "a".repeat(501))).toContain("500");
  expect(checkInput(9_999_999_999, "a".repeat(500))).toBeNull();
  expect(checkInput(20_000_000, "  chơi game  ")).toBeNull();
});

test("chỉ READY và BUDGET_WARNING có purpose mới đi tiếp /builds/auto", () => {
  expect(buildableRequirement(analysis({}))).toEqual({ budget: 20_000_000, purpose: "GAMING" });
  expect(buildableRequirement(analysis({ status: "BUDGET_WARNING" }))).toEqual({ budget: 20_000_000, purpose: "GAMING" });
  for (const status of ["NEED_CLARIFICATION", "BUDGET_TOO_LOW", "BUDGET_TOO_HIGH"] as const)
    expect(buildableRequirement(analysis({ status }))).toBeNull();
  expect(buildableRequirement(analysis({ requirement: { budget: 20_000_000, purpose: null } }))).toBeNull();
  expect(buildableRequirement(analysis({ requirement: null }))).toBeNull();
});

test("slotRows xếp theo thứ tự slot và hiện GPU trống của bộ văn phòng để chọn thêm", () => {
  const rows = slotRows([...officeBuild].reverse());
  expect(rows.map((r) => r.category)).toEqual([
    "MONITOR", "KEYBOARD", "MOUSE", "CPU", "MAINBOARD", "RAM", "SSD", "GPU", "COOLER", "CASE", "PSU",
  ]);
  const gpu = rows.find((r) => r.category === "GPU")!;
  expect(gpu).toEqual({ category: "GPU", index: -1, item: null });
  // index trỏ đúng vị trí trong mảng gốc, không phải vị trí hiển thị
  const reversed = [...officeBuild].reverse();
  for (const row of rows.filter((r) => r.item)) expect(reversed[row.index]).toBe(row.item);
});

test("slotRows giữ cả món lạ không thuộc slot nào ở cuối bảng", () => {
  const rows = slotRows([...officeBuild, line("OTHER", 99, 1)]);
  expect(rows.at(-1)).toMatchObject({ category: "OTHER", index: officeBuild.length });
});

test("setLineQty kẹp số lượng trong [1, maxQty] và không đổi gì thì trả đúng mảng cũ", () => {
  const ramIndex = officeBuild.findIndex((i) => i.category === "RAM");
  expect(setLineQty(officeBuild, ramIndex, 4)[ramIndex].qty).toBe(4);
  expect(setLineQty(officeBuild, ramIndex, 9)[ramIndex].qty).toBe(4);
  expect(setLineQty(officeBuild, ramIndex, 0)[ramIndex].qty).toBe(1);
  expect(setLineQty(officeBuild, ramIndex, 2)).toBe(officeBuild);
  expect(setLineQty(officeBuild, 99, 2)).toBe(officeBuild);
  const cpuIndex = officeBuild.findIndex((i) => i.category === "CPU");
  expect(setLineQty(officeBuild, cpuIndex, 2)).toBe(officeBuild); // maxQty 1
});

test("replaceLine thay đúng dòng, dùng qty/maxQty server đề xuất; index -1 thêm món mới", () => {
  const option = { id: 60, name: "RAM 32GB", brand: "Kingston", price: 2_000_000, qty: 2, maxQty: 2, current: false };
  const ramIndex = officeBuild.findIndex((i) => i.category === "RAM");
  const swapped = replaceLine(officeBuild, ramIndex, "RAM", option);
  expect(swapped).toHaveLength(officeBuild.length);
  expect(swapped[ramIndex]).toEqual({ category: "RAM", id: 60, name: "RAM 32GB", qty: 2, maxQty: 2, price: 2_000_000 });
  expect(officeBuild[ramIndex].id).toBe(6); // không sửa mảng gốc

  const gpu = { ...option, id: 80, name: "RTX 4060", qty: 1, maxQty: 2 };
  const added = replaceLine(officeBuild, -1, "GPU", gpu);
  expect(added).toHaveLength(officeBuild.length + 1);
  expect(added.at(-1)).toMatchObject({ category: "GPU", id: 80, qty: 1 });
});

test("toItemRequests, buildKey và lineTotal", () => {
  const items = toItemRequests(officeBuild.slice(4, 6));
  expect(items).toEqual([
    { variantId: 5, qty: 1 },
    { variantId: 6, qty: 2 },
  ]);
  expect(buildKey(items)).toBe(buildKey([...items].reverse()));
  expect(buildKey(items)).not.toBe(buildKey([items[0], { variantId: 6, qty: 3 }]));
  expect(lineTotal(officeBuild.slice(4, 6))).toBe(2_000_000 + 800_000 * 2);
});

test("saveErrorText nối các luật bị vi phạm của 422 BUILD_INCOMPATIBLE", () => {
  const data = { violations: [{ rule: "RULE_1", message: "CPU AM5 không lắp được main LGA1700" }, { rule: "J3", message: "" }] };
  expect(saveErrorText("Bộ PC không tương thích", data)).toBe(
    "Bộ PC không tương thích (CPU AM5 không lắp được main LGA1700)",
  );
  expect(saveErrorText("Máy chủ lỗi", undefined)).toBe("Máy chủ lỗi");
});

test("itemsFromCartSet đọc bộ mới (id, qty, budget) và bộ cũ (variantId, quantity, unitPrice)", () => {
  expect(
    itemsFromCartSet({ id: 7, budget: 25_000_000, parts: [{ id: 4, qty: 1, price: 3_000_000 }, { id: 6, qty: 2 }] }),
  ).toEqual({ budget: 25_000_000, items: [{ variantId: 4, qty: 1 }, { variantId: 6, qty: 2 }] });

  // Bộ cũ không có budget: dùng tổng tiền lúc thêm vào giỏ
  expect(
    itemsFromCartSet({
      id: "set_1",
      parts: [
        { role: "cpu", variantId: "11", quantity: 1, unitPrice: 5_000_000 },
        { role: "ram", variantId: 31, quantity: 2, unitPrice: 1_000_000 },
      ],
    }),
  ).toEqual({ budget: 7_000_000, items: [{ variantId: 11, qty: 1 }, { variantId: 31, qty: 2 }] });

  // Dòng hỏng bị bỏ; không còn dòng nào hoặc không có ngân sách thì không nạp
  expect(itemsFromCartSet({ id: 1, budget: 1, parts: [{ id: "x", qty: 1 }, { id: 5, qty: 0 }] })).toBeNull();
  expect(itemsFromCartSet({ id: 1, parts: [{ id: 5, qty: 1 }] })).toBeNull();
  expect(itemsFromCartSet({ id: 1 })).toBeNull();
  expect(itemsFromCartSet(null)).toBeNull();
});
