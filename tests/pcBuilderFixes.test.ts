import { expect, test } from "vitest";
import {
  changeLineQuantity,
  isPeripheralRole,
  replaceLine,
  savedSelection,
  splitSavedItems,
  visibleSpecs,
} from "../src/features/pc-builder/domain/buildLines";
import type { PeripheralSuggestionResponse } from "../src/features/pc-builder/types/pcBuilder.types";
import { buildVerdict, compatibilityPassed, isDataNote } from "../src/features/pc-builder/components/SummaryCard";
import { warningText } from "../src/features/pc-builder/components/AiInsightPanel";
import type { BuildPart, RuleCheck } from "../src/features/pc-builder/types/pcBuilder.types";

const part = (role: BuildPart["role"], variantId: number, quantity = 1): BuildPart => ({
  role,
  roleName: role,
  variantId,
  productName: `SP ${variantId}`,
  variantName: "",
  imageUrl: "",
  unitPrice: 1_000_000,
  quantity,
  specs: {},
  aiReason: "",
});
const twoSsd = [part("cpu", 1), part("ssd", 80), part("ssd", 81)];
const rule = (id: string, status: RuleCheck["status"]): RuleCheck => ({ id, title: id, detail: "", status });

test("B6: đổi linh kiện chỉ đổi đúng dòng được chọn, dòng SSD kia giữ nguyên", () => {
  const next = replaceLine(twoSsd, 2, { variantId: 99, productName: "SSD mới", variantName: "4TB", price: 5_000_000, specs: { Capacity_GB: "4000" } });

  expect(next.map((p) => p.variantId)).toEqual([1, 80, 99]);
  expect(next[2]).toMatchObject({ productName: "SSD mới", unitPrice: 5_000_000, role: "ssd" });
  expect(next[1]).toBe(twoSsd[1]);
  expect(twoSsd[2].variantId).toBe(81); // không sửa mảng gốc
});

test("B6: đổi số lượng chỉ đổi đúng dòng, trong khoảng 1 đến giới hạn", () => {
  expect(changeLineQuantity(twoSsd, 1, 1, 8).map((p) => p.quantity)).toEqual([1, 2, 1]);
  expect(changeLineQuantity(twoSsd, 2, -1, 8)[2].quantity).toBe(1);
  expect(changeLineQuantity([part("ssd", 80, 8)], 0, 1, 8)[0].quantity).toBe(8);
});

test("B6: chỉ số không tồn tại thì giữ nguyên cấu hình", () => {
  expect(replaceLine(twoSsd, 9, { variantId: 99, productName: "x", variantName: "", price: 1, specs: {} })).toEqual(twoSsd);
  expect(changeLineQuantity(twoSsd, -1, 1, 8)).toEqual(twoSsd);
});

const saved = (role: string, variantId: number, unitPrice: number) => ({ role, variantId, productName: `SP ${variantId}`, unitPrice });
const option = (variantId: number, price: number) => ({ variantId, productName: `Bản mới ${variantId}`, price, highlights: ["27 inch"] });
const suggestion: PeripheralSuggestionResponse = {
  pcTotal: 0, available: 0, spendLimit: 0, peripheralTotal: 0, grandTotal: 0,
  roles: [
    { role: "monitor", label: "Màn hình", picked: option(202, 2_490_000), options: [option(202, 2_490_000), option(203, 3_900_000)] },
    { role: "keyboard", label: "Bàn phím", picked: option(211, 190_000), options: [option(211, 190_000)] },
    { role: "mouse", label: "Chuột", picked: option(221, 120_000), options: [option(221, 120_000)] },
  ],
};

test("Lưu cấu hình: tách thùng máy và màn, phím, chuột khi mở lại", () => {
  const items = [saved("cpu", 1, 5e6), saved("monitor", 203, 3_890_000), saved("ssd", 80, 1e6), saved("keyboard", 213, 690_000)];
  const { pc, peripherals } = splitSavedItems(items);

  expect(pc.map((i) => i.role)).toEqual(["cpu", "ssd"]);
  expect(peripherals.map((i) => i.role)).toEqual(["monitor", "keyboard"]);
  expect(isPeripheralRole("mouse")).toBe(true);
  expect(isPeripheralRole("cpu")).toBe(false);
});

test("Mở lại cấu hình: giữ đúng món đã lưu, món không lưu thì bỏ tick", () => {
  const selection = savedSelection([saved("monitor", 203, 3_890_000), saved("keyboard", 213, 690_000)], suggestion);

  // Món còn bán: lấy thông tin mới nhất từ danh sách (giá, thông số)
  expect(selection.monitor).toMatchObject({ variantId: 203, price: 3_900_000, highlights: ["27 inch"] });
  // Món không còn trong danh sách: vẫn giữ theo dữ liệu đã lưu, không tự đổi sang món khác
  expect(selection.keyboard).toMatchObject({ variantId: 213, price: 690_000, productName: "SP 213" });
  // Lúc lưu khách đã bỏ chuột
  expect(selection.mouse).toBeNull();
});

test("Mở lại cấu hình khi chưa tải được danh sách phụ kiện: vẫn giữ món đã lưu", () => {
  const selection = savedSelection([saved("mouse", 224, 490_000)], null);

  expect(selection.mouse).toMatchObject({ variantId: 224, price: 490_000, highlights: [] });
  expect(selection.monitor).toBeNull();
});

test("B10: ẩn trường nội bộ, giữ thông số kỹ thuật", () => {
  const specs = visibleSpecs({
    Socket: "AM5",
    Price_Source: "GearVN https://gearvn.com/x",
    Price_Seen_Date: "2026-10-27",
    Price_Status: "LISTED",
    Compat_Note: "ghi chú nội bộ",
    Cores_Threads: "6/12",
  });
  expect(specs).toEqual([["Socket", "AM5"], ["Cores_Threads", "6/12"]]);
  expect(visibleSpecs(undefined)).toEqual([]);
});

test("B9: J9a, J9b là ghi chú dữ liệu, không làm mất PASS ALL", () => {
  expect(isDataNote(rule("J9a", "warning"))).toBe(true);
  expect(isDataNote(rule("J9b", "warning"))).toBe(true);
  expect(isDataNote(rule("J3d", "warning"))).toBe(false);

  expect(compatibilityPassed(true, [rule("R1", "pass"), rule("J9a", "warning"), rule("J9b", "warning")])).toBe(true);
  expect(compatibilityPassed(true, [rule("R1", "pass"), rule("J3d", "warning")])).toBe(false);
  expect(compatibilityPassed(true, [rule("R1", "pass"), rule("J8a", "unknown")])).toBe(false);
  expect(compatibilityPassed(false, [rule("R1", "fail")])).toBe(false);
  // Lỗi thật vẫn luôn thắng
  expect(buildVerdict([rule("R1", "fail"), rule("J9a", "warning")], true).label).toBe("KHÔNG TƯƠNG THÍCH");
});

test("B7: mã cảnh báo hiện thành câu tiếng Việt, không lộ mã thô", () => {
  expect(warningText("REQUIRED_ROLE_IMPLIED:gpu")).toBe("Đã thêm card đồ họa vì nhu cầu của bạn cần");
  expect(warningText("REQUIRED_ROLE_IMPLIED:cooler")).toBe("Đã thêm tản nhiệt vì nhu cầu của bạn cần");
  expect(warningText("REQUIREMENT_RELAXED:m1:16→8")).toBe("Đã hạ yêu cầu để vừa ngân sách (16 → 8)");
  expect(warningText("PSU_HIGH_WATTAGE")).toBe("Bộ máy cần nguồn trên 1600 W");
  expect(warningText("CONSTRAINT_UNSATISFIABLE:c2")).toBe("Yêu cầu vượt khoảng giá trị kho đang có");
  expect(warningText("OP_NORMALIZED:c1:GT→GTE")).toBeNull(); // chỉ là chuẩn hóa nội bộ
  expect(warningText("MA_MOI_CHUA_DICH:x")).toBe("Hệ thống đã tự điều chỉnh một mục trong hồ sơ nhu cầu");
});
