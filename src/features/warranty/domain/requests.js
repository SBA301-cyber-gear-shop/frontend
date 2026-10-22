// Nhãn nút cho phiếu trên BE. Danh sách bước được phép do BE trả về (allowedTransitions).
const STEP_LABEL = {
  "received>inspecting": "Bắt đầu kiểm tra",
  "received>canceled": "Hủy phiếu",
  "inspecting>repairing": "Bắt đầu sửa chữa",
  "inspecting>canceled": "Hủy phiếu",
  "repairing>waiting_for_parts": "Chờ linh kiện",
  "repairing>inspecting": "Kiểm tra lại",
  "waiting_for_parts>repairing": "Tiếp tục sửa chữa",
  "ready_for_return>returned": "Xác nhận đã trả khách",
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
          label: RESOLUTION_STEP[r],
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
const COUNTER_STEPS = [
  "received>canceled",
  "ready_for_return>returned",
  "ready_for_return>inspecting",
];
export const counterSteps = (ticket) =>
  stepButtons(ticket).filter((s) =>
    COUNTER_STEPS.includes(ticket.status + ">" + s.toStatus),
  );
export const day = (v) =>
  v ? new Date(v).toLocaleDateString("vi-VN") : "Chưa có";
// Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD, làm giới hạn dưới cho ô chọn ngày hẹn trả.
export const today = () => new Date().toLocaleDateString("en-CA");
export const cardBadge = (c) =>
  c.status === "replaced"
    ? ["warning", "Đã đổi thiết bị"]
    : c.status !== "active"
      ? ["warning", "Thẻ bị vô hiệu"]
      : c.valid
        ? ["success", "Còn bảo hành"]
        : ["warning", "Hết hạn"];
