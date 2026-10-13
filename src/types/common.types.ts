// ==========================================
// 7. COMMON & GLOBAL STATE TYPES
// Interface cho API response envelope, pagination,
// Toast notification và React Store Context.
// ==========================================

/** Cấu trúc phản hồi chuẩn từ Backend Spring Boot */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

/** Cấu trúc phản hồi lỗi từ Backend */
export interface ApiErrorResponse {
  code?: number;
  message: string;
  validationErrors?: Record<string, string>;
}

/** Phân trang dữ liệu */
export interface Page<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Thông báo Toast */
export type ToastTone = "success" | "danger" | "warning" | "info";

export interface ToastNotification {
  message: string;
  tone: ToastTone;
}
