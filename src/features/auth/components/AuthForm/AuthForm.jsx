import { Link } from "react-router-dom";
import { Icon, Notice } from "@/components/ui";
import "./AuthForm.scss";

function AuthForm({ register = false, model }) {
  const {
    identity,
    setPassword,
    password,
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
    setHelp,
    touched,
    markTouched,
    validationErrors,
    submit,
  } = model;
  return (
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
                onChange={(e) => model.setIdentity(e.target.value)}
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
                  register ? "Tối thiểu 6 ký tự" : "Nhập mật khẩu của bạn"
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
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
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
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {touched.confirm && validationErrors.confirm && (
                <p className="field-error">{validationErrors.confirm}</p>
              )}
            </div>
          )}

          <div className="form-options">
            <span className="password-hint">
              {register
                ? "Mật khẩu nên chứa ít nhất 6 ký tự để bảo mật."
                : "Bảo mật tài khoản với phiên đăng nhập an toàn."}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => setHelp(true)}
            >
              Cần hỗ trợ?
            </button>
          </div>

          {error && <Notice tone="danger">{error}</Notice>}

          <button className="login-submit" type="submit" disabled={busy}>
            {busy
              ? "Đang xử lý…"
              : register
                ? "Đăng ký tài khoản"
                : "Đăng nhập"}
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
  );
}

export function LoginForm({ model }) {
  return <AuthForm model={model} />;
}

export function RegisterForm({ model }) {
  return <AuthForm register model={model} />;
}

export { AuthForm };
export default AuthForm;
