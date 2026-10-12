import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../state/context";
import { request } from "../services/demoStore";
import { Logo, Icon, Notice, Modal, Button } from "../components/ui";

export default function Auth({ register = false }) {
  const { commit, signIn } = useStore(),
    navigate = useNavigate(),
    location = useLocation();

  // Form states
  const [identity, setIdentity] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [rememberMe, setRememberMe] = useState(true),
    [showPassword, setShowPassword] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);

  // Field touched states for inline validation
  const [touched, setTouched] = useState({});

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Inline Validation logic
  const getErrors = () => {
    const errs = {};
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
        errs.identity = "Địa chỉ email không đúng định dạng (VD: ban@example.com).";
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
      setTouched({ name: true, phone: true, identity: true, password: true, confirm: true });
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
        const res = await request("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: name.trim(),
            email: identity.trim().toLowerCase(),
            phone: phone.trim(),
            password: password,
            address: "",
          }),
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
          role: authData.user.role,
        };

        commit((d) => ({ ...d, users: [...(d.users || []), u] }));
        signIn(u);
        navigate("/tai-khoan");
      } else {
        const res = await request("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({
            identity: identity.trim(),
            password: password,
          }),
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
          role: authData.user.role,
        };

        signIn(u);
        const fallback =
          u.role === "Customer"
            ? "/cua-hang"
            : u.role === "Technician"
              ? "/ky-thuat"
              : "/van-hanh/don-hang";
        navigate(location.state?.from || fallback, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Top Header */}
      <header className="auth-header">
        <div className="auth-header-inner">
          <Logo />
          <div className="auth-nav-actions">
            <Link className="auth-back-link" to="/cua-hang">
              <Icon name="arrow" style={{ transform: "rotate(180deg)" }} />
              <span>Về trang chủ</span>
            </Link>
            <div className="auth-header-divider" />
            <div className="auth-hotline-badge">
              <span className="auth-pulse-dot" />
              <span>Hotline: <strong>1900 6868</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Centered Minimal Card */}
      <main className="auth-main">
        <div className="auth-card-wrapper">
          <div className="auth-card">
            {/* Header badge & titles */}
            <div className="auth-card-header">
              <div className="auth-privilege-badge">
                <Icon name="spark" />
                <span>TECHZONE MEMBER PRIVILEGE</span>
              </div>
              <h1>{register ? "Tạo Tài Khoản Mới" : "Đăng Nhập Tài Khoản"}</h1>
              <p className="auth-card-subtitle">
                {register
                  ? "Đăng ký thành viên để nhận ưu đãi VIP và bảo hành theo serial thiết bị."
                  : "Truy cập để quản lý đơn hàng, danh sách yêu thích và bảo hành điện tử."}
              </p>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!register}
                className={`auth-tab-btn ${!register ? "active" : ""}`}
                onClick={() => {
                  setError("");
                  navigate("/dang-nhap");
                }}
              >
                <Icon name="login" />
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={register}
                className={`auth-tab-btn ${register ? "active" : ""}`}
                onClick={() => {
                  setError("");
                  navigate("/dang-ky");
                }}
              >
                <Icon name="userPlus" />
                <span>Đăng Ký Mới</span>
              </button>
            </div>

            {/* Auth Form */}
            <form className="auth-form" onSubmit={submit} noValidate>
              {register && (
                <>
                  {/* Họ và tên */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="name">
                      Họ và tên <span className="req">*</span>
                    </label>
                    <div
                      className={`auth-input-wrapper ${
                        touched.name && validationErrors.name ? "has-error" : ""
                      }`}
                    >
                      <span className="auth-input-icon">
                        <Icon name="user" />
                      </span>
                      <input
                        className="auth-input"
                        id="name"
                        autoComplete="name"
                        placeholder="Ví dụ: Nguyễn Văn A"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => markTouched("name")}
                        aria-invalid={!!(touched.name && validationErrors.name)}
                      />
                    </div>
                    {touched.name && validationErrors.name && (
                      <p className="field-error">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="phone">
                      Số điện thoại <span className="req">*</span>
                    </label>
                    <div
                      className={`auth-input-wrapper ${
                        touched.phone && validationErrors.phone ? "has-error" : ""
                      }`}
                    >
                      <span className="auth-input-icon">
                        <Icon name="phone" />
                      </span>
                      <input
                        className="auth-input"
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Ví dụ: 0912 345 678"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => markTouched("phone")}
                        aria-invalid={!!(touched.phone && validationErrors.phone)}
                      />
                    </div>
                    {touched.phone && validationErrors.phone && (
                      <p className="field-error">{validationErrors.phone}</p>
                    )}
                  </div>
                </>
              )}

              {/* Email (Register) / Email hoặc SĐT (Login) */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="identity">
                  {register ? (
                    <>
                      Địa chỉ Email <span className="req">*</span>
                    </>
                  ) : (
                    <>
                      Email hoặc Số điện thoại <span className="req">*</span>
                    </>
                  )}
                </label>
                <div
                  className={`auth-input-wrapper ${
                    touched.identity && validationErrors.identity ? "has-error" : ""
                  }`}
                >
                  <span className="auth-input-icon">
                    <Icon name={register ? "mail" : "user"} />
                  </span>
                  <input
                    className="auth-input"
                    id="identity"
                    autoComplete="username"
                    type={register ? "email" : "text"}
                    placeholder={
                      register
                        ? "Ví dụ: ban@example.com"
                        : "Nhập email hoặc số điện thoại"
                    }
                    required
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    onBlur={() => markTouched("identity")}
                    aria-invalid={!!(touched.identity && validationErrors.identity)}
                  />
                </div>
                {touched.identity && validationErrors.identity && (
                  <p className="field-error">{validationErrors.identity}</p>
                )}
              </div>

              {/* Mật khẩu */}
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="password">
                    Mật khẩu <span className="req">*</span>
                  </label>
                  {!register && (
                    <button
                      type="button"
                      className="auth-forgot-btn"
                      onClick={() => setHelp(true)}
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div
                  className={`auth-input-wrapper ${
                    touched.password && validationErrors.password ? "has-error" : ""
                  }`}
                >
                  <span className="auth-input-icon">
                    <Icon name="lock" />
                  </span>
                  <input
                    className="auth-input has-toggle"
                    id="password"
                    autoComplete={register ? "new-password" : "current-password"}
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={
                      register
                        ? "Tối thiểu 6 ký tự"
                        : "Nhập mật khẩu của bạn"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched("password")}
                    aria-invalid={!!(touched.password && validationErrors.password)}
                  />
                  <button
                    className="auth-eye-btn"
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} />
                  </button>
                </div>
                {touched.password && validationErrors.password && (
                  <p className="field-error">{validationErrors.password}</p>
                )}
              </div>

              {/* Xác nhận mật khẩu (Register only) */}
              {register && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirm">
                    Xác nhận mật khẩu <span className="req">*</span>
                  </label>
                  <div
                    className={`auth-input-wrapper ${
                      touched.confirm && validationErrors.confirm ? "has-error" : ""
                    }`}
                  >
                    <span className="auth-input-icon">
                      <Icon name="lock" />
                    </span>
                    <input
                      className="auth-input has-toggle"
                      id="confirm"
                      autoComplete="new-password"
                      type={showConfirm ? "text" : "password"}
                      required
                      placeholder="Nhập lại mật khẩu để xác nhận"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => markTouched("confirm")}
                      aria-invalid={!!(touched.confirm && validationErrors.confirm)}
                    />
                    <button
                      className="auth-eye-btn"
                      type="button"
                      aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      <Icon name={showConfirm ? "eyeOff" : "eye"} />
                    </button>
                  </div>
                  {touched.confirm && validationErrors.confirm && (
                    <p className="field-error">{validationErrors.confirm}</p>
                  )}
                </div>
              )}

              {/* Checkbox ghi nhớ / đồng ý điều khoản */}
              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>
                  {register
                    ? "Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của TechZone"
                    : "Ghi nhớ đăng nhập trên thiết bị này"}
                </span>
              </label>

              {/* Thông báo lỗi nếu có */}
              {error && <Notice tone="danger">{error}</Notice>}

              {/* Nút Submit */}
              <button className="auth-submit-btn" type="submit" disabled={busy}>
                <span>
                  {busy
                    ? "Đang xử lý…"
                    : register
                      ? "Đăng ký tài khoản"
                      : "Đăng nhập tài khoản"}
                </span>
                <Icon name="arrow" />
              </button>
            </form>

            {/* Trust & Security Badge */}
            <div className="auth-security-footer">
              <div className="auth-security-badge">
                <Icon name="shield" />
                <span>Bảo mật chuẩn SSL 256-bit · Dữ liệu được mã hóa an toàn</span>
              </div>
            </div>
          </div>

          {/* Bottom simple assistance */}
          <div className="auth-assistance">
            Bạn gặp khó khăn khi đăng nhập?{" "}
            <button type="button" onClick={() => setHelp(true)}>
              Trung tâm trợ giúp
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="auth-footer">
        <div className="auth-footer-inner">
          <p>© 2026 TECHZONE Pro. Tất cả quyền được bảo lưu.</p>
          <div className="auth-footer-links">
            <a href="#dieukhoan" onClick={(e) => { e.preventDefault(); setHelp(true); }}>
              Điều khoản dịch vụ
            </a>
            <span className="auth-footer-dot">·</span>
            <a href="#baomat" onClick={(e) => { e.preventDefault(); setHelp(true); }}>
              Chính sách bảo mật
            </a>
            <span className="auth-footer-dot">·</span>
            <a href="#baohanh" onClick={(e) => { e.preventDefault(); setHelp(true); }}>
              Bảo hành điện tử
            </a>
          </div>
        </div>
      </footer>

      {/* Modal Hỗ trợ */}
      {help && (
        <Modal title="Hỗ trợ tài khoản TechZone" onClose={() => setHelp(false)}>
          <p>
            Nếu bạn quên mật khẩu hoặc gặp sự cố khi đăng nhập vào hệ thống,
            vui lòng liên hệ với bộ phận chăm sóc khách hàng hoặc quản trị viên:
          </p>
          <ul style={{ paddingLeft: "20px", margin: "14px 0", color: "#475569", lineHeight: "1.7" }}>
            <li>Hotline miễn phí: <strong>1900 6868</strong> (8:00 - 21:00 hàng ngày)</li>
            <li>Email hỗ trợ: <strong>support@techzone.pro</strong></li>
            <li>Hỗ trợ trực tiếp: Tại tất cả các showroom TechZone trên toàn quốc</li>
          </ul>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <Button onClick={() => setHelp(false)}>Đã hiểu</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
