// ==========================================
// 1. NGƯỜI DÙNG & PHÂN QUYỀN
// Map: Table Roles, Table Users
// ==========================================

/** Vai trò trong hệ thống – map bảng Roles.name */
export type UserRole = "Admin" | "Customer" | "Staff" | "Technician";

/** Bảng Roles */
export interface Role {
  id: number;
  name: UserRole;
  description?: string;
}

/**
 * Bảng Users – phiên bản đầy đủ từ DB.
 * Lưu ý: password_hash KHÔNG BAO GIỜ gửi xuống frontend.
 */
export interface User {
  id: number;
  roleId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;   // ISO 8601
  updatedAt: string;
}

/**
 * Phiên bản rút gọn lưu trong session/context ở frontend.
 * Đây là shape thực tế đang được dùng trong StoreProvider và Auth.jsx.
 */
export interface SessionUser {
  id: number;
  name: string;        // map từ User.fullName
  email: string;
  phone?: string;
  role: UserRole;      // map từ Roles.name (đã resolve join)
}

/** Payload gửi lên POST /api/auth/login */
export interface LoginPayload {
  identity: string;    // email hoặc phone
  password: string;
}

/** Payload gửi lên POST /api/auth/register */
export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
}

/** Response trả về từ API auth (login & register) */
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    role: UserRole;
  };
}
