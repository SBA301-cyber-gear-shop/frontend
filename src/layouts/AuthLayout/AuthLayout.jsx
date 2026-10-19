import { Link } from "react-router-dom";
import { Logo, Icon } from "@/components/ui";
export function AuthLayout({ children, overlay }) {
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

        {children}
      </main>

      <footer className="login-footer">
        <span>© 2026 TechZone Pro</span>
        <span>PC & linh kiện · Chọn đúng cho đam mê</span>
      </footer>

      {overlay}
    </div>
  );
}
