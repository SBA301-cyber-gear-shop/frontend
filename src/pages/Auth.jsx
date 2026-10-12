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
    <div className="login-body">
      <header className="login-header">
        <Logo />
        <Link className="back-store" to="/cua-hang">
          ← Tiếp tục mua sắm
        </Link>
      </header>

      <main className="login-layout">
        <section className="login-scene">
          <div className="scene-grid" />
          <div className="scene-glow" />
          <div className="scene-copy">
            <div className="scene-eyebrow">
              <span />
              KHÔNG GIAN CÔNG NGHỆ CỦA BẠN
            </div>
            <h1>
              Đam mê công nghệ.
              <br />
              <em>Kết nối tại đây.</em>
            </h1>
            <p>
              Mọi đơn hàng, mọi thiết bị.
              <br />
              Một tài khoản để theo dõi tất cả.
            </p>
          </div>
          <div className="hardware-stage">
            <img
              className="hardware-image"
              src="/assets/landing-stage.webp"
              alt="PC minh họa TechZone"
              width="1536"
              height="1024"
            />
            <div className="stage-orbit" />
            <span className="stage-label">TECHZONE / YOUR NEXT SETUP</span>
          </div>
          <div className="scene-feature">
            <Icon name="shield" />
            <div>
              <strong>Bảo hành theo từng thiết bị</strong>
              <p>Tra cứu serial và tình trạng bảo hành sau khi nhận hàng.</p>
            </div>
          </div>
          <div className="scene-bottom">
            <span>Đặt online · Nhận tại cửa hàng</span>
          </div>
        </section>

        <section className="login-panel">
          <div className="form-shell">
            <div className="form-mark">
              <Icon name="user" />
            </div>
            <p className="form-eyebrow">
              {register ? "BẮT ĐẦU HÀNH TRÌNH" : "CHÀO MỪNG TRỞ LẠI"}
            </p>
            <h2>{register ? "Tạo tài khoản" : "Đăng nhập"}</h2>
            <p className="form-intro">
              {register
                ? "Điền thông tin để tạo tài khoản mới tại TechZone."
                : "Nhập thông tin xác thực để tiếp tục."}
            </p>

            <form onSubmit={submit} noValidate>
              {register && (
                <>
                  {/* Họ và tên */}
                  <div className="input-group">
                    <label htmlFor="name">
                      Họ và tên <span className="req">*</span>
                    </label>
                    <div
                      className={`input-frame ${
                        touched.name && validationErrors.name ? "has-error" : ""
                      }`}
                    >
                      <Icon name="user" />
                      <input
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
                  <div className="input-group">
                    <label htmlFor="phone">
                      Số điện thoại <span className="req">*</span>
                    </label>
                    <div
                      className={`input-frame ${
                        touched.phone && validationErrors.phone ? "has-error" : ""
                      }`}
                    >
                      <Icon name="phone" />
                      <input
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
              <div className="input-group">
                <label htmlFor="identity">
                  {register ? (
                    <>
                      Địa chỉ Email <span className="req">*</span>
                    </>
                  ) : (
                    <>
                      Email hoặc số điện thoại <span className="req">*</span>
                    </>
                  )}
                </label>
                <div
                  className={`input-frame ${
                    touched.identity && validationErrors.identity ? "has-error" : ""
                  }`}
                >
                  <Icon name={register ? "mail" : "user"} />
                  <input
                    id="identity"
                    autoComplete="username"
                    type={register ? "email" : "text"}
                    placeholder={
                      register
                        ? "Ví dụ: ban@example.com"
                        : "Nhập email hoặc số điện thoại của bạn"
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
              <div className="input-group">
                <label htmlFor="password">
                  Mật khẩu <span className="req">*</span>
                </label>
                <div
                  className={`input-frame ${
                    touched.password && validationErrors.password ? "has-error" : ""
                  }`}
                >
                  <Icon name="lock" />
                  <input
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
                    className="password-toggle"
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
                <div className="input-group">
                  <label htmlFor="confirm">
                    Xác nhận mật khẩu <span className="req">*</span>
                  </label>
                  <div
                    className={`input-frame ${
                      touched.confirm && validationErrors.confirm ? "has-error" : ""
                    }`}
                  >
                    <Icon name="lock" />
                    <input
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
                      className="password-toggle"
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

              <div className="form-options">
                {register ? (
                  <span className="password-hint">
                    Mật khẩu nên chứa ít nhất 6 ký tự để bảo mật.
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setHelp(true)}
                >
                  {register ? "Cần hỗ trợ?" : "Quên mật khẩu?"}
                </button>
              </div>

              {error && <Notice tone="danger">{error}</Notice>}

              <button className="login-submit" type="submit" disabled={busy}>
                {busy ? (
                  "Đang xử lý…"
                ) : register ? (
                  "Đăng ký tài khoản"
                ) : (
                  "Đăng nhập"
                )}
                <Icon name="arrow" />
              </button>
            </form>

            <div className="register-prompt">
              {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
              <Link to={register ? "/dang-nhap" : "/dang-ky"}>
                {register ? "Đăng nhập" : "Đăng ký ngay"} ↗
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="login-footer">
        <span>© 2026 TechZone Pro</span>
        <span>PC & linh kiện · Chọn đúng cho đam mê</span>
      </footer>

      {help && (
        <Modal title="Hỗ trợ tài khoản" onClose={() => setHelp(false)}>
          <p>
            Nếu bạn quên mật khẩu hoặc gặp sự cố khi đăng nhập vào hệ thống,
            vui lòng liên hệ với bộ phận chăm sóc khách hàng hoặc quản trị viên:
          </p>
          <ul style={{ paddingLeft: "20px", margin: "12px 0", color: "#475569" }}>
            <li>Hotline: <strong>1900 6868</strong> (8:00 - 21:00)</li>
            <li>Email: <strong>support@techzone.pro</strong></li>
          </ul>
          <Button onClick={() => setHelp(false)}>Đã hiểu</Button>
        </Modal>
      )}
    </div>
  );
}

