// Nhãn nút cho phiếu trên BE. Danh sách bước được phép do BE trả về (allowedTransitions).
const STEP_LABEL = {
  "received>inspecting": "Bắt đầu kiểm tra",
  "received>canceled": "Hủy phiếu",
  "inspecting>repairing": "Bắt đầu sửa chữa",
  "inspecting>canceled": "Hủy phiếu",
  "repairing>waiting_for_parts": "Chờ linh kiện",
  "repairing>inspecting": "Kiểm tra lại",
  "waiting_for_parts>repairing": "Tiếp tục sửa chữa",
  "ready_for_return>inspecting": "Khách báo còn lỗi",
};
const RESOLUTION_STEP = {
  repaired: "Hoàn tất sửa chữa",
  rejected: "Từ chối bảo hành",
  no_fault_found: "Không tìm thấy lỗi",
  withdrawn: "Khách rút yêu cầu",
};
// Một nút cho mỗi bước được phép; bước cần chọn kết quả thì mỗi kết quả một nút.
export const stepButtons = (ticket) =>
  ticket.allowedTransitions.flatMap((t) =>
    t.resolutions.length
      ? t.resolutions.map((r) => ({
          toStatus: t.toStatus,
          resolution: r,
          label: r === "rejected" && ticket.underWarrantyAtIntake === false
            ? "Báo hỏng ngoài bảo hành"
            : RESOLUTION_STEP[r],
        }))
      : [
          {
            toStatus: t.toStatus,
            resolution: null,
            label: STEP_LABEL[ticket.status + ">" + t.toStatus],
          },
        ],
  );
// Màn hình quầy chỉ có các bước của lễ tân, kể cả khi Admin (được làm mọi bước) đang dùng.
// Trả máy làm cho cả lần tiếp nhận, không nằm ở từng phiếu.
const COUNTER_STEPS = ["received>canceled", "ready_for_return>inspecting"];
export const counterSteps = (ticket) =>
  stepButtons(ticket).filter((s) =>
    COUNTER_STEPS.includes(ticket.status + ">" + s.toStatus),
  );
export const day = (v) =>
  v ? new Date(v).toLocaleDateString("vi-VN") : "Chưa có";
export function warrantyRemainingText(card) {
  if (card.status === "replaced") return "Đã đổi thiết bị";
  if (card.status !== "active") return "Thẻ không hoạt động";
  if (card.warrantyRemainingDays == null || !card.warrantyRemainingAsOf) return "Chưa có dữ liệu thời hạn còn lại";
  const days = card.warrantyRemainingDays;
  if (card.openRequest && card.openRequest.status !== "ready_for_return") {
    return `Còn ${days} ngày tại thời điểm tiếp nhận (${day(card.warrantyRemainingAsOf)})`;
  }
  if (!card.valid) {
    return card.startDate?.slice(0, 10) > card.warrantyRemainingAsOf ? "Chưa đến ngày bắt đầu" : "Đã hết hạn";
  }
  return days === 0 ? "Còn hiệu lực đến hết hôm nay" : `Còn ${days} ngày`;
}
// Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD, làm giới hạn dưới cho ô chọn ngày hẹn trả.
export const today = () => new Date().toLocaleDateString("en-CA");
// Mỗi lần tiếp nhận là một nhóm riêng, kể cả khi nhiều lần thuộc cùng đơn hàng.
export function groupRequestsByIntake(rows, status = "") {
  const groups = new Map();
  for (const row of rows) {
    const key = row.intakeId == null ? `request-${row.id}` : `intake-${row.intakeId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].filter((group) => !status || group.some((row) => row.status === status));
}
export const cardBadge = (c) =>
  c.status === "replaced"
    ? ["warning", "Đã đổi thiết bị"]
    : c.status !== "active"
      ? ["warning", "Thẻ bị vô hiệu"]
      : c.valid
        ? ["success", "Còn bảo hành"]
        : ["warning", "Hết hạn"];
