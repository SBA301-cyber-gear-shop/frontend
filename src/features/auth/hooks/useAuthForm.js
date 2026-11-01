import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { authApi } from "../api/authApi";

export function useAuthForm({ register = false }) {
  const { commit, signIn } = useStore(),
    navigate = useNavigate(),
    location = useLocation();
  const [identity, setIdentity] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);
  const [touched, setTouched] = useState({});
  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };
  const getErrors = () => {
    const errs = {};
    // Register
    if (register) {
      if (!name.trim()) {
        errs.name = "Vui lòng nhập họ và tên.";
      } else if (name.trim().length < 2) {
        errs.name = "Họ và tên phải có tối thiểu 2 ký tự.";
      }

      if (!phone.trim()) {
        errs.phone = "Vui lòng nhập số điện thoại.";
      } else if (!/^0\d{9}$/.test(phone.trim())) {
        errs.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.";
      }

      if (!identity.trim()) {
        errs.identity = "Vui lòng nhập địa chỉ email.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.trim())) {
        errs.identity =
          "Địa chỉ email không đúng định dạng (VD: ban@example.com).";
      }

      if (!password) {
        errs.password = "Vui lòng nhập mật khẩu.";
      } else if (password.length < 6) {
        errs.password = "Mật khẩu phải có tối thiểu 6 ký tự.";
      }

      if (!confirm) {
        errs.confirm = "Vui lòng nhập lại mật khẩu xác nhận.";
      } else if (confirm !== password) {
        errs.confirm = "Mật khẩu xác nhận không trùng khớp.";
      }
    } else {
      // Login
      if (!identity.trim()) {
        errs.identity = "Vui lòng nhập email hoặc số điện thoại.";
      }
      if (!password) {
        errs.password = "Vui lòng nhập mật khẩu.";
      }
    }
    return errs;
  };
  const validationErrors = getErrors();
  async function submit(e) {
    e.preventDefault();
    setError("");

    // Mark all relevant fields as touched
    if (register) {
      setTouched({
        name: true,
        phone: true,
        identity: true,
        password: true,
        confirm: true,
      });
    } else {
      setTouched({ identity: true, password: true });
    }

    const currentErrors = getErrors();
    const errorKeys = Object.keys(currentErrors);
    if (errorKeys.length > 0) {
      setError(currentErrors[errorKeys[0]]);
      return;
    }

    setBusy(true);
    try {
      if (register) {
        const res = await authApi.register({
          fullName: name.trim(),
          email: identity.trim().toLowerCase(),
          phone: phone.trim(),
          password: password,
          address: "",
        });

        const authData = res?.data || res;
        if (authData?.accessToken) {
          sessionStorage.setItem("techzone-token", authData.accessToken);
        }

        const u = {
          id: authData.user.id,
          name: authData.user.fullName,
          email: authData.user.email,
          phone: authData.user.phone,
          address: authData.user.address,
          role: authData.user.role,
        };

        commit((d) => ({ ...d, users: [...(d.users || []), u] }));
        signIn(u);
        navigate("/tai-khoan");
      } else {
        const res = await authApi.login({
          identity: identity.trim(),
          password: password,
        });

        const authData = res?.data || res;
        if (authData?.accessToken) {
          sessionStorage.setItem("techzone-token", authData.accessToken);
        }

        const u = {
          id: authData.user.id,
          name: authData.user.fullName,
          email: authData.user.email,
          phone: authData.user.phone,
          address: authData.user.address,
          role: authData.user.role,
        };

        signIn(u);
        const fallback =
          u.role.toLowerCase() === "customer"
            ? "/cua-hang"
            : u.role.toLowerCase() === "technician"
              ? "/ky-thuat"
              : "/van-hanh/don-hang";
        navigate(location.state?.from || fallback, { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return {
    identity,
    setIdentity,
    password,
    setPassword,
    confirm,
    setConfirm,
    name,
    setName,
    phone,
    setPhone,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    error,
    busy,
    help,
    setHelp,
    touched,
    markTouched,
    validationErrors,
    submit,
  };
}
