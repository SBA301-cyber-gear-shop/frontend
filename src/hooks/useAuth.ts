import { useState } from "react";
import { useStore } from "../state/context";
import { request } from "../services/demoStore";
import type {
  LoginPayload,
  RegisterPayload,
  SessionUser,
  AuthResponse,
} from "../types";

/**
 * Hook quản lý xác thực và phân quyền người dùng.
 * Bao bọc StoreContext và các API gọi đăng nhập / đăng ký / đăng xuất.
 */
export function useAuth() {
  const { user, signIn, signOut, commit } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);
  const role = user?.role ?? null;
  const isAdmin = role === "Admin";
  const isTechnician = role === "Technician";
  const isStaff = role === "Staff";
  const isCustomer = role === "Customer";

  /**
   * Đăng nhập tài khoản
   */
  const login = async (payload: LoginPayload): Promise<SessionUser> => {
    setBusy(true);
    setError(null);
    try {
      const res = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identity: payload.identity.trim(),
          password: payload.password,
        }),
      });

      const authData: AuthResponse = res?.data || res;
      if (authData?.accessToken) {
        sessionStorage.setItem("techzone-token", authData.accessToken);
      }

      const sessionUser: SessionUser = {
        id: authData.user.id,
        name: authData.user.fullName,
        email: authData.user.email,
        phone: authData.user.phone,
        role: authData.user.role,
      };

      signIn(sessionUser);
      return sessionUser;
    } catch (err: any) {
      const msg = err.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Đăng ký tài khoản mới
   */
  const register = async (payload: RegisterPayload): Promise<SessionUser> => {
    setBusy(true);
    setError(null);
    try {
      const res = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: payload.fullName.trim(),
          email: payload.email.trim().toLowerCase(),
          phone: payload.phone.trim(),
          password: payload.password,
          address: payload.address || "",
        }),
      });

      const authData: AuthResponse = res?.data || res;
      if (authData?.accessToken) {
        sessionStorage.setItem("techzone-token", authData.accessToken);
      }

      const sessionUser: SessionUser = {
        id: authData.user.id,
        name: authData.user.fullName,
        email: authData.user.email,
        phone: authData.user.phone,
        role: authData.user.role,
      };

      commit((prev: any) => ({
        ...prev,
        users: [...(prev.users || []), sessionUser],
      }));
      signIn(sessionUser);
      return sessionUser;
    } catch (err: any) {
      const msg = err.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  };

  /**
   * Đăng xuất khỏi hệ thống
   */
  const logout = () => {
    signOut();
  };

  return {
    user: user as SessionUser | null,
    isAuthenticated,
    role,
    isAdmin,
    isTechnician,
    isStaff,
    isCustomer,
    busy,
    error,
    login,
    register,
    logout,
  };
}
