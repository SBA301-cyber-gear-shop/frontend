import { expect, test } from "vitest";
import { groupRequestsByIntake, stepButtons, warrantyRemainingText } from "../src/features/warranty/domain/requests";

test("gom linh kiện theo lần tiếp nhận và giữ cả nhóm khi lọc trạng thái", () => {
  const rows = [
    { id: 1, intakeId: 10, status: "inspecting", orderCode: "A" },
    { id: 2, intakeId: 10, status: "ready_for_return", orderCode: "A" },
    { id: 3, intakeId: 11, status: "received", orderCode: "A" },
    { id: 4, intakeId: null, status: "received", orderCode: "B" },
    { id: 5, intakeId: null, status: "received", orderCode: "B" },
  ];
  expect(groupRequestsByIntake(rows).map((group) => group.map((row) => row.id)))
    .toEqual([[1, 2], [3], [4], [5]]);
  expect(groupRequestsByIntake(rows, "inspecting").map((group) => group.map((row) => row.id)))
    .toEqual([[1, 2]]);
  expect(groupRequestsByIntake(rows, "repairing")).toEqual([]);
});

test("hiển thị hạn còn lại theo trạng thái thẻ", () => {
  const card = { status: "active", valid: true, warrantyRemainingDays: 20, warrantyRemainingAsOf: "2026-11-06" };
  expect(warrantyRemainingText(card)).toBe("Còn 20 ngày");
  expect(warrantyRemainingText({ ...card, warrantyRemainingDays: 0 })).toBe("Còn hiệu lực đến hết hôm nay");
  expect(warrantyRemainingText({ ...card, valid: false, warrantyRemainingDays: 0 })).toBe("Đã hết hạn");
  expect(warrantyRemainingText({ ...card, status: "replaced" })).toBe("Đã đổi thiết bị");
  expect(warrantyRemainingText({ ...card, warrantyRemainingDays: null })).toBe("Chưa có dữ liệu thời hạn còn lại");
  expect(warrantyRemainingText({ ...card, valid: false, openRequest: { status: "repairing" } }))
    .toContain("Còn 20 ngày tại thời điểm tiếp nhận");
});

test("phiếu ngoài bảo hành có nút báo hỏng riêng", () => {
  const ticket = {
    status: "inspecting",
    underWarrantyAtIntake: false,
    allowedTransitions: [{ toStatus: "ready_for_return", resolutions: ["rejected", "no_fault_found"] }],
  };
  expect(stepButtons(ticket)).toEqual([
    { toStatus: "ready_for_return", resolution: "rejected", label: "Báo hỏng ngoài bảo hành" },
    { toStatus: "ready_for_return", resolution: "no_fault_found", label: "Không tìm thấy lỗi" },
  ]);
  expect(stepButtons({ ...ticket, underWarrantyAtIntake: true })[0].label).toBe("Từ chối bảo hành");
});
