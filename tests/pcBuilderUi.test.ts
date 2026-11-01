import { expect, test } from "vitest";
import { buildVerdict } from "../src/features/pc-builder/components/SummaryCard";
import { reasonMessage } from "../src/features/pc-builder/components/AiInsightPanel";
import { quantityLimit } from "../src/features/pc-builder/components/PartsTable";
import { itemReason, toDraftProfile } from "../src/features/pc-builder/components/ProfileEditor";
import { initialBuildParts, initialProfile } from "../src/features/pc-builder/domain";
import type { BudgetFit, BuildPart, RuleCheck } from "../src/features/pc-builder/types/pcBuilder.types";

const rule = (status: RuleCheck["status"]): RuleCheck => ({ id: "R1", title: "Socket", detail: "", status });
const fit: BudgetFit = {
  ratio: 0.8,
  percent: 80,
  status: "UNDER_SATURATED",
  windowMin: 27_000_000,
  windowMax: 30_000_000,
  leftover: 6_000_000,
};

test("SummaryCard verdict: PASS ALL only when backend has no fail/warning/unknown", () => {
  expect(buildVerdict([rule("pass"), rule("fail")], false).label).toBe("KHÔNG TƯƠNG THÍCH");
  // Có fail thì không bao giờ ghi PASS ALL, kể cả khi cờ tổng bị sai (AC7)
  expect(buildVerdict([rule("fail")], true).label).toBe("KHÔNG TƯƠNG THÍCH");
  expect(buildVerdict([rule("pass"), rule("warning")], false).label).toBe("CẦN LƯU Ý");
  expect(buildVerdict([rule("pass")], true).label).toBe("PASS ALL");
  expect(buildVerdict([rule("pass")], true, true).label).toBe("ĐANG KIỂM TRA…");
});

test("reasonCode messages follow DD 6.6", () => {
  expect(reasonMessage("NEEDS_SATURATED", fit, 24_000_000, initialProfile)).toMatch(/đã đáp ứng tối đa.*còn dư 6\.000\.000/);
  expect(reasonMessage("CATALOG_CEILING", fit, 24_000_000)).toMatch(/mạnh nhất cửa hàng/);
  expect(reasonMessage("REQUIREMENT_RELAXED", fit, 24_000_000, initialProfile, ["c1"])).toContain(
    "Game AAA 1080p cần tối thiểu 8 GB VRAM",
  );
  expect(reasonMessage(null, { ...fit, percent: 99.4, status: "IN_WINDOW" }, 0)).toMatch(/đạt 99,4% ngân sách/);
  expect(reasonMessage(null, null, 0)).toBeNull();
});

test("turning a chip off removes it from the profile sent back, marked USER_EDITED", () => {
  const rows = [
    { item: initialProfile.constraints[0], enabled: false },
    { item: initialProfile.metrics[0], enabled: true },
  ];
  const draft = toDraftProfile(initialProfile, rows);
  expect(draft.source).toBe("USER_EDITED");
  expect(draft.constraints).toEqual([]);
  expect(draft.metrics.map((m) => m.id)).toEqual(["m1"]);
  // Trường do server điền không gửi ngược lên
  expect(draft.metrics[0]).not.toHaveProperty("label");
  expect(draft.metrics[0]).not.toHaveProperty("satisfied");
  expect(initialProfile.metrics[0].label).toBe("Tổng RAM ≥ 32 GB");
});

test("itemReason resolves P:{id} keys to the profile reason", () => {
  expect(itemReason(initialProfile, "m1")).toBe("Vừa chơi game vừa livestream");
  expect(itemReason(initialProfile, "zz")).toBe("zz");
});

test("quantity buttons: ram/ssd/gpu only, cpu only on dual-socket boards, capped by capacity", () => {
  const parts = initialBuildParts;
  const part = (role: string) => parts.find((p) => p.role === role)!;
  expect(quantityLimit(part("psu"), parts).adjustable).toBe(false);
  expect(quantityLimit(part("cpu"), parts).adjustable).toBe(false);
  expect(quantityLimit(part("ssd"), parts)).toEqual({ adjustable: true, canAdd: true });

  const dual: BuildPart[] = parts.map((p) =>
    p.role === "mainboard" ? { ...p, specs: { ...p.specs, CPU_Socket_Count: "2" } } : p,
  );
  expect(quantityLimit(part("cpu"), dual)).toEqual({ adjustable: true, canAdd: true });
  expect(quantityLimit({ ...part("cpu"), quantity: 2 }, dual).canAdd).toBe(false);

  const capacity = { ramSlotsUsed: 4, ramSlotsMax: 4, ramGb: 64, ramMaxGb: 128, m2Used: 1, m2Max: 2, gpuCount: 1, gpuMax: 2 };
  expect(quantityLimit(part("ram"), parts, capacity).canAdd).toBe(false);
  expect(quantityLimit(part("gpu"), parts, capacity).canAdd).toBe(true);
});
