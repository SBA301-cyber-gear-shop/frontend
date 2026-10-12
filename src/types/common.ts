// ==========================================
// 7. COMMON & GLOBAL STATE TYPES
// Interface cho API response envelope, pagination,
// Toast notification và React Store Context.
// ==========================================

import type { SessionUser } from "./auth";
import type { ProductDisplay } from "./product";
import type { Order, CartLine } from "./order";
import type { ServiceRequest } from "./warranty";

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

/** Cấu trúc state toàn cục của demoStore / LocalStorage */
export interface StoreData {
  version: number;
  products: ProductDisplay[];
  orders: Order[];
  tickets: ServiceRequest[];
  cart: CartLine[];
  users?: SessionUser[];
}

/** Type cho giá trị cung cấp bởi useStore() Hook */
export interface StoreContextValue {
  data: StoreData;
  user: SessionUser | null;
  commit: (update: StoreData | ((prev: StoreData) => StoreData)) => StoreData;
  notify: (message: string, tone?: ToastTone) => void;
  signIn: (profile: SessionUser) => void;
  signOut: () => void;
  addCart: (id: string, quantity?: number) => void;
}
