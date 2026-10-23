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
// Cùng các mã trên nhưng viết cho khách đọc (trang Bảo hành của tôi).
export const CUSTOMER_STATUS = {
  received: "Đã gửi bảo hành",
  inspecting: "Đang kiểm tra",
  repairing: "Đang sửa chữa",
  waiting_for_parts: "Đang chờ linh kiện",
  ready_for_return: "Sẵn sàng nhận máy",
  returned: "Đã nhận lại máy",
  canceled: "Đã hủy yêu cầu",
};
export const CUSTOMER_RESOLUTION = {
  repaired: "Đã sửa xong",
  replaced: "Được đổi thiết bị mới",
  rejected: "Không thuộc phạm vi bảo hành",
  no_fault_found: "Thiết bị không có lỗi",
  withdrawn: "Bạn đã rút yêu cầu",
};
