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
    [rememberMe, setRememberMe] = useState(false),
    [agreeTerms, setAgreeTerms] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [activeModal, setActiveModal] = useState(null), // "forgot" | "terms" | "privacy" | "warranty" | "help"
    [forgotIdentity, setForgotIdentity] = useState(""),
    [forgotSent, setForgotSent] = useState(false),
    [forgotError, setForgotError] = useState("");

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

      if (!agreeTerms) {
        errs.agreeTerms = "Vui lòng tích chọn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật.";
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
      setTouched({
        name: true,
        phone: true,
        identity: true,
        password: true,
        confirm: true,
        agreeTerms: true,
      });
    } else {
      setTouched({ identity: true, password: true });
    }

    const currentErrors = getErrors();
    const errorKeys = Object.keys(currentErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      setError(currentErrors[firstKey]);

      // Chuyển focus đến trường lỗi đầu tiên để người dùng dễ thao tác
      setTimeout(() => {
        const el = document.getElementById(firstKey);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 0);
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
        // Phiên đăng ký: lưu mặc định vào sessionStorage
        sessionStorage.removeItem("techzone-token");
        localStorage.removeItem("techzone-token");
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
        signIn(u, false);
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
        // Ghi nhớ đăng nhập: lưu vào localStorage nếu rememberMe = true, ngược lại lưu sessionStorage
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem("techzone-token");
        if (authData?.accessToken) {
          targetStorage.setItem("techzone-token", authData.accessToken);
        }

        const u = {
          id: authData.user.id,
          name: authData.user.fullName,
          email: authData.user.email,
          phone: authData.user.phone,
          role: authData.user.role,
        };

        signIn(u, rememberMe);
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

  function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError("");
    const val = forgotIdentity.trim();
    if (!val) {
      setForgotError("Vui lòng nhập email hoặc số điện thoại đã đăng ký.");
      return;
    }
    // Gửi yêu cầu đặt lại mật khẩu thành công
    setForgotSent(true);
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
                <span>Đặc quyền thành viên</span>
              </div>
              <h1>{register ? "Tạo tài khoản mới" : "Đăng nhập tài khoản"}</h1>
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
                <span>Đăng nhập</span>
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
                <span>Đăng ký mới</span>
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
                      onClick={() => {
                        setForgotSent(false);
                        setForgotError("");
                        setForgotIdentity(identity);
                        setActiveModal("forgot");
                      }}
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

              {/* Checkbox ghi nhớ (login) hoặc đồng ý điều khoản (register) */}
              {register ? (
                <div className="auth-checkbox-group">
                  <label className="auth-checkbox-row" htmlFor="agreeTerms">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        markTouched("agreeTerms");
                      }}
                      aria-invalid={!!(touched.agreeTerms && validationErrors.agreeTerms)}
                    />
                    <span className="auth-checkbox-label">
                      Tôi đồng ý với{" "}
                      <button
                        type="button"
                        className="auth-inline-link"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal("terms");
                        }}
                      >
                        Điều khoản dịch vụ
                      </button>{" "}
                      &amp;{" "}
                      <button
                        type="button"
                        className="auth-inline-link"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveModal("privacy");
                        }}
                      >
                        Chính sách bảo mật
                      </button>{" "}
                      của TechZone
                    </span>
                  </label>
                  {touched.agreeTerms && validationErrors.agreeTerms && (
                    <p className="field-error">{validationErrors.agreeTerms}</p>
                  )}
                </div>
              ) : (
                <label className="auth-checkbox-row" htmlFor="rememberMe">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="auth-checkbox-label">Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>
              )}

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
            <button type="button" onClick={() => setActiveModal("help")}>
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
            <a href="#dieukhoan" onClick={(e) => { e.preventDefault(); setActiveModal("terms"); }}>
              Điều khoản dịch vụ
            </a>
            <span className="auth-footer-dot">·</span>
            <a href="#baomat" onClick={(e) => { e.preventDefault(); setActiveModal("privacy"); }}>
              Chính sách bảo mật
            </a>
            <span className="auth-footer-dot">·</span>
            <a href="#baohanh" onClick={(e) => { e.preventDefault(); setActiveModal("warranty"); }}>
              Bảo hành điện tử
            </a>
          </div>
        </div>
      </footer>

      {/* 1. Modal Quên mật khẩu */}
      {activeModal === "forgot" && (
        <Modal title="Khôi phục mật khẩu tài khoản" onClose={() => setActiveModal(null)}>
          <div className="auth-modal-body">
            {!forgotSent ? (
              <form onSubmit={handleForgotSubmit} className="auth-modal-section">
                <p>
                  Nhập email hoặc số điện thoại đã liên kết với tài khoản TechZone của bạn.
                  Chúng tôi sẽ gửi hướng dẫn xác thực để đặt lại mật khẩu an toàn.
                </p>
                <div className="auth-field" style={{ marginTop: "10px" }}>
                  <label className="auth-label" htmlFor="forgotInput">
                    Email hoặc Số điện thoại <span className="req">*</span>
                  </label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <Icon name="mail" />
                    </span>
                    <input
                      id="forgotInput"
                      className="auth-input"
                      type="text"
                      placeholder="Ví dụ: ban@example.com hoặc 0912..."
                      value={forgotIdentity}
                      onChange={(e) => setForgotIdentity(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {forgotError && <p className="field-error">{forgotError}</p>}
                </div>
                <div className="auth-modal-info-card" style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", color: "#0f172a" }}>
                    <Icon name="phone" style={{ width: "16px", height: "16px", color: "#dc2626" }} />
                    <span>Hỗ trợ nhanh qua tổng đài:</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#475569" }}>
                    Gọi ngay <strong>1900 6868</strong> (8:00 - 21:00) nếu bạn không còn quyền truy cập email hoặc SĐT.
                  </p>
                </div>
                <div className="auth-modal-actions">
                  <Button tone="ghost" type="button" onClick={() => setActiveModal(null)}>
                    Hủy bỏ
                  </Button>
                  <Button tone="primary" type="submit">
                    Gửi hướng dẫn đặt lại
                  </Button>
                </div>
              </form>
            ) : (
              <div className="auth-modal-section">
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Icon name="check" style={{ width: "24px", height: "24px" }} />
                  </div>
                  <h4 style={{ justifyContent: "center", fontSize: "16px", marginBottom: "6px" }}>
                    Đã gửi hướng dẫn thành công!
                  </h4>
                  <p style={{ color: "#475569" }}>
                    Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến:
                    <br />
                    <strong style={{ color: "#0f172a" }}>{forgotIdentity}</strong>
                  </p>
                  <p style={{ fontSize: "12.5px", color: "#64748b", marginTop: "10px" }}>
                    Vui lòng kiểm tra hộp thư đến (và mục Thư rác/Spam). Đường dẫn có hiệu lực trong vòng 15 phút.
                  </p>
                </div>
                <div className="auth-modal-actions" style={{ justifyContent: "center" }}>
                  <Button tone="primary" onClick={() => setActiveModal(null)}>
                    Đã hiểu &amp; Quay lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 2. Modal Điều khoản dịch vụ */}
      {activeModal === "terms" && (
        <Modal title="Điều khoản dịch vụ TechZone" onClose={() => setActiveModal(null)}>
          <div className="auth-modal-body">
            <div className="auth-modal-section">
              <h4>1. Tài khoản &amp; Trách nhiệm thành viên</h4>
              <p>
                Người dùng chịu trách nhiệm bảo quản thông tin tài khoản và mật khẩu của mình. TechZone khuyến cáo không chia sẻ thông tin đăng nhập cho bên thứ ba hoặc đăng nhập trên thiết bị công cộng mà không đăng xuất.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>2. Mua hàng &amp; Cam kết chính hãng</h4>
              <p>
                Mọi đơn hàng tạo trên website đều được xác nhận tự động và liên kết với tài khoản thành viên. TechZone cam kết 100% linh kiện máy tính, laptop và phụ kiện đều là hàng chính hãng có tem phân phối chính thức.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>3. Chính sách bảo hành điện tử</h4>
              <p>
                Sản phẩm mua tại hệ thống TechZone được kích hoạt bảo hành điện tử theo số Serial/IMEI. Khách hàng có thể tra cứu và gửi yêu cầu dịch vụ trực tiếp trong trang quản lý tài khoản.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>4. Quyền thay đổi điều khoản</h4>
              <p>
                TechZone có quyền cập nhật các điều khoản dịch vụ để phù hợp với quy định pháp luật và nâng cao trải nghiệm khách hàng. Các thay đổi sẽ được thông báo công khai trên website.
              </p>
            </div>

            <div className="auth-modal-actions">
              <Button tone="primary" onClick={() => setActiveModal(null)}>
                Đồng ý &amp; Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Modal Chính sách bảo mật */}
      {activeModal === "privacy" && (
        <Modal title="Chính sách bảo mật thông tin" onClose={() => setActiveModal(null)}>
          <div className="auth-modal-body">
            <div className="auth-modal-section">
              <h4>1. Mục đích thu thập dữ liệu</h4>
              <p>
                Chúng tôi thu thập họ tên, số điện thoại, email và địa chỉ nhằm mục đích xử lý đơn hàng, cấp mã bảo hành điện tử và hỗ trợ chăm sóc kỹ thuật sau bán hàng.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>2. Tiêu chuẩn mã hóa &amp; Lưu trữ an toàn</h4>
              <p>
                Mật khẩu của bạn được mã hóa một chiều an toàn bằng thuật toán BCrypt. Toàn bộ thông tin truyền tải giữa trình duyệt và máy chủ được mã hóa qua giao thức SSL/TLS 256-bit chuẩn quốc tế.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>3. Cam kết không chia sẻ thông tin</h4>
              <p>
                TechZone cam kết không bán, chia sẻ hoặc chuyển giao thông tin cá nhân của bạn cho bất kỳ đơn vị quảng cáo hoặc bên thứ ba nào, ngoại trừ các đơn vị vận chuyển đối tác để giao nhận hàng hóa.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>4. Quyền kiểm soát dữ liệu của bạn</h4>
              <p>
                Bạn có toàn quyền tra cứu, cập nhật thông tin cá nhân hoặc yêu cầu khóa/xóa tài khoản vĩnh viễn bất kỳ lúc nào bằng cách liên hệ với bộ phận hỗ trợ khách hàng của chúng tôi.
              </p>
            </div>

            <div className="auth-modal-actions">
              <Button tone="primary" onClick={() => setActiveModal(null)}>
                Đã hiểu &amp; Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Modal Bảo hành điện tử */}
      {activeModal === "warranty" && (
        <Modal title="Chính sách bảo hành điện tử TechZone" onClose={() => setActiveModal(null)}>
          <div className="auth-modal-body">
            <div className="auth-modal-section">
              <h4>1. Bảo hành theo Serial / IMEI</h4>
              <p>
                Toàn bộ linh kiện và laptop xuất xưởng từ TechZone đều được gán mã bảo hành điện tử theo số Serial duy nhất. Bạn không cần giữ hóa đơn giấy cồng kềnh.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>2. Thời hạn bảo hành</h4>
              <p>
                Áp dụng bảo hành chính hãng từ 12 đến 36 tháng theo tiêu chuẩn nhà sản xuất (Intel, AMD, ASUS, MSI, Gigabyte, v.v.). Đổi mới 1-đổi-1 trong 30 ngày đầu nếu có lỗi phần cứng từ nhà sản xuất.
              </p>
            </div>

            <div className="auth-modal-section">
              <h4>3. Tra cứu &amp; Tiếp nhận kỹ thuật</h4>
              <p>
                Khách hàng chỉ cần nhập số Serial hoặc số điện thoại tại mục Tra cứu bảo hành để xem tình trạng bảo hành và tiến độ xử lý phiếu kỹ thuật trực tiếp theo thời gian thực.
              </p>
            </div>

            <div className="auth-modal-actions">
              <Button tone="primary" onClick={() => setActiveModal(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Modal Trung tâm trợ giúp */}
      {activeModal === "help" && (
        <Modal title="Trung tâm trợ giúp khách hàng TechZone" onClose={() => setActiveModal(null)}>
          <div className="auth-modal-body">
            <p>
              Nếu bạn gặp khó khăn trong quá trình đăng nhập, đăng ký hoặc cần giải đáp thắc mắc về đơn hàng, đội ngũ TechZone luôn sẵn sàng hỗ trợ:
            </p>
            <div className="auth-modal-info-card">
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#334155", lineHeight: "1.8" }}>
                <li>Hotline miễn phí: <strong>1900 6868</strong> (8:00 - 21:00 hàng ngày)</li>
                <li>Email hỗ trợ: <strong>support@techzone.pro</strong></li>
                <li>Kỹ thuật viên trực tuyến: Hỗ trợ kiểm tra máy &amp; tư vấn cấu hình từ xa</li>
                <li>Hệ thống Showroom: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh</li>
              </ul>
            </div>
            <div className="auth-modal-actions">
              <Button tone="primary" onClick={() => setActiveModal(null)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
