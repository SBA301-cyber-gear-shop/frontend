export const TICKET_STATUS = {
  received: "Đã tiếp nhận",
  inspecting: "Đang kiểm tra",
  repairing: "Đang sửa chữa",
  completed: "Chờ trả khách",
  returned: "Đã trả khách",
  rejected: "Từ chối bảo hành",
};
// Trạng thái và kết quả của phiếu trên BE (bản demo dùng TICKET_STATUS ở trên).
export const REQUEST_STATUS = {
  received: "Đã tiếp nhận",
  inspecting: "Đang kiểm tra",
  repairing: "Đang sửa chữa",
  waiting_for_parts: "Chờ linh kiện",
  ready_for_return: "Chờ trả khách",
  returned: "Đã trả khách",
  canceled: "Đã hủy",
};
export const REQUEST_RESOLUTION = {
  repaired: "Đã sửa xong",
  replaced: "Đã đổi thiết bị",
  rejected: "Từ chối bảo hành",
  no_fault_found: "Không tìm thấy lỗi",
  withdrawn: "Khách rút yêu cầu",
};
