import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { demoAccounts } from "../data/seed";
import { useStore } from "../state/context";
import { delay } from "../services/demoStore";
import { Logo, Icon, Notice, Modal, Button } from "../components/ui";
export default function Auth({ register = false }) {
  const { data, commit, signIn } = useStore(),
    navigate = useNavigate(),
    location = useLocation();
  const [identity, setIdentity] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (register) {
        if (!name.trim() || !/^\S+@\S+\.\S+$/.test(identity))
          throw new Error("Nhập họ tên và email hợp lệ.");
        if (!/^0\d{9}$/.test(phone))
          throw new Error("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.");
        if (password.length < 8 || password !== confirm)
          throw new Error("Mật khẩu tối thiểu 8 ký tự và xác nhận phải trùng.");
        if (
          [...demoAccounts, ...data.users].some(
            (u) =>
              u.email.toLowerCase() === identity.toLowerCase() ||
              u.phone === phone,
          )
        )
          throw new Error("Email hoặc số điện thoại đã được sử dụng.");
        await delay();
        const hash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(password),
            ),
          ),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        const u = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: identity.toLowerCase(),
          phone,
          role: "Customer",
          demoPasswordHash: hash,
        };
        commit((d) => ({ ...d, users: [...d.users, u] }));
        signIn(u);
        navigate("/tai-khoan");
      } else {
        await delay();
        const accounts = new Map(demoAccounts.map((u) => [u.id, u]));
        data.users.forEach((u) =>
          accounts.set(u.id, { ...accounts.get(u.id), ...u }),
        );
        const u = [...accounts.values()].find(
          (u) =>
            u.email.toLowerCase() === identity.trim().toLowerCase() ||
            u.phone === identity.trim(),
        );
        const hash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(password),
            ),
          ),
        )
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("");
        if (
          !u ||
          (u.password ? u.password !== password : u.demoPasswordHash !== hash)
        )
          throw new Error("Email, số điện thoại hoặc mật khẩu chưa đúng.");
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
      setError(err.message);
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
            <p className="form-intro">Tiếp tục hành trình công nghệ của bạn.</p>
            <form onSubmit={submit}>
              {register && (
                <>
                  <div className="input-group">
                    <label htmlFor="name">Họ và tên</label>
                    <input
                      id="name"
                      className="input"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      className="input"
                      required
                      autoComplete="tel"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="input-group">
                <label htmlFor="identity">
                  {register ? "Email" : "Email hoặc số điện thoại"}
                </label>
                <div className="input-frame">
                  <Icon name="user" />
                  <input
                    id="identity"
                    autoComplete="username"
                    type={register ? "email" : "text"}
                    placeholder="ban@example.com"
                    required
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="input-frame">
                  <Icon name="shield" />
                  <input
                    id="password"
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={show}
                    onClick={() => setShow(!show)}
                  >
                    {show ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>
              {register && (
                <div className="input-group">
                  <label htmlFor="confirm">Xác nhận mật khẩu</label>
                  <input
                    id="confirm"
                    className="input"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}
              <div className="form-options">
                <span className="password-hint">
                  Có thể dán từ trình quản lý mật khẩu.
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
              <button className="login-submit" disabled={busy}>
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
            <details className="demo-accounts">
              <summary>Tài khoản trải nghiệm · Demo</summary>
              <p className="small muted">
                Dữ liệu lưu trên thiết bị; không dùng mật khẩu thật. Các nút
                điền tài khoản mẫu, sau đó nhấn Đăng nhập.
              </p>
              <div className="chips">
                {demoAccounts.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setIdentity(u.email);
                      setPassword(u.password);
                    }}
                  >
                    {u.role}
                  </button>
                ))}
              </div>
              <small>Mật khẩu mẫu: Demo@123</small>
            </details>
            <p className="preview-note">
              Chế độ demo · Chưa kết nối xác thực backend
            </p>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>© 2026 TechZone Pro</span>
        <span>PC & linh kiện · Chọn đúng cho đam mê</span>
      </footer>
      {help && (
        <Modal title="Cùng bạn kết nối lại." onClose={() => setHelp(false)}>
          <p>
            Chọn tài khoản trải nghiệm ở dưới form để khám phá. Chức năng khôi
            phục mật khẩu cần dịch vụ backend.
          </p>
          <Button onClick={() => setHelp(false)}>Quay lại</Button>
        </Modal>
      )}
    </div>
  );
}
