import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { animate, createScope, stagger } from "animejs";
import { Logo, Icon, Art } from "../components/ui";
const fits = [
  {
    id: "gaming",
    label: "Chơi game",
    title: "Đắm mình trong từng khung hình.",
    description:
      "Bắt đầu từ tựa game, độ phân giải và ngân sách. Cân đối card đồ họa, CPU và màn hình cho trải nghiệm bạn muốn.",
    focus: ["Card đồ họa", "Bộ vi xử lý", "Màn hình"],
    image: "gpu",
    link: "/build-pc?purpose=gaming",
  },
  {
    id: "creative",
    label: "Sáng tạo",
    title: "Thêm không gian cho ý tưởng.",
    description:
      "Dựng video, thiết kế hay xử lý hình ảnh: chọn linh kiện theo phần mềm, dung lượng dự án và nhu cầu mở rộng.",
    focus: ["Bộ nhớ RAM", "Lưu trữ SSD", "CPU & GPU"],
    image: "ram",
    link: "/build-pc?purpose=creative",
  },
  {
    id: "work",
    label: "Làm việc",
    title: "Gọn góc làm việc. Rộng khả năng.",
    description:
      "Ưu tiên khả năng đa nhiệm, màn hình phù hợp và tính di động. Khám phá laptop theo thông số từng phiên bản.",
    focus: ["Đa nhiệm", "Màn hình", "Tính di động"],
    image: "laptop",
    link: "/danh-muc/laptop",
  },
];
export default function Landing() {
  const root = useRef(null),
    [tab, setTab] = useState(0),
    [open, setOpen] = useState(false),
    [motion, setMotion] = useState(
      () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [imageError, setImageError] = useState(false);
  useEffect(() => {
    if (!motion) return;
    const scope = createScope({ root }).add(() => {
      animate(".l-hero-copy > *", {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100),
        duration: 750,
        ease: "out(4)",
      });
      animate(".l-stage-image", {
        scale: [0.96, 1],
        opacity: [0.6, 1],
        duration: 1300,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [motion]);
  const f = fits[tab];
  return (
    <div className="landing-page" ref={root}>
      <a className="l-skip" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <header className="l-header">
        <div className="l-nav-shell">
          <Logo />
          <button
            className="l-menu-toggle"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            Menu ☰
          </button>
          <nav className={open ? "open" : ""}>
            <a href="#your-fit" onClick={() => setOpen(false)}>
              Chọn theo nhu cầu
            </a>
            <a href="#your-journey" onClick={() => setOpen(false)}>
              Trải nghiệm TechZone
            </a>
            <a href="#questions" onClick={() => setOpen(false)}>
              Điều cần biết
            </a>
          </nav>
          <Link className="l-store-link" to="/cua-hang">
            Vào cửa hàng <Icon name="arrow" />
          </Link>
        </div>
      </header>
      <main id="main-content">
        <section className="l-hero">
          <div className="l-hero-copy">
            <h1>
              <span>Hiệu năng.</span>
              <span>
                Mang dấu ấn <em>của bạn.</em>
              </span>
            </h1>
            <p>
              Từ linh kiện đầu tiên đến góc máy hoàn chỉnh.
              <br />
              Khám phá lựa chọn phù hợp với cách bạn chơi, sáng tạo và làm việc.
            </p>
            <div className="l-actions">
              <Link className="l-button l-primary" to="/build-pc">
                Build chiếc PC của bạn <Icon name="arrow" />
              </Link>
              <Link className="l-button l-outline" to="/cua-hang">
                Khám phá cửa hàng <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="l-stage">
            <img
              className="l-stage-image"
              src="/assets/landing-stage.webp"
              width="1536"
              height="1024"
              alt="PC màu đen với ánh sáng đỏ trên sân khấu"
              fetchPriority="high"
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="l-image-error">
                <p>Hình minh họa chưa tải được.</p>
                <button
                  className="l-button l-outline"
                  onClick={() => window.location.reload()}
                >
                  Thử tải lại
                </button>
              </div>
            )}
          </div>
          <div className="l-hero-bottom">
            <a href="#your-fit" className="l-scroll-cue">
              <span>↓</span>Khám phá theo cách của bạn
            </a>
            <button
              className="l-motion"
              aria-pressed={!motion}
              onClick={() => setMotion(!motion)}
            >
              <span className="l-motion-dot" />
              {motion ? "Tắt chuyển động" : "Bật chuyển động"}
            </button>
          </div>
        </section>
        <section id="your-fit" className="l-fit l-section">
          <div className="l-container">
            <div className="l-section-head">
              <h2>
                Bạn có chất riêng.
                <br />
                <span>Cấu hình cũng vậy.</span>
              </h2>
              <p>
                Không cần bắt đầu bằng một danh sách dài thông số.
                <br />
                Hãy bắt đầu từ điều bạn muốn làm.
              </p>
            </div>
            <div className="l-tabs" role="tablist" aria-label="Nhu cầu sử dụng">
              {fits.map((x, i) => (
                <button
                  key={x.id}
                  id={"tab-" + x.id}
                  role="tab"
                  aria-selected={i === tab}
                  aria-controls={"panel-" + x.id}
                  tabIndex={i === tab ? 0 : -1}
                  onClick={() => setTab(i)}
                  onKeyDown={(e) => {
                    let n;
                    if (e.key === "ArrowRight") n = (i + 1) % 3;
                    else if (e.key === "ArrowLeft") n = (i + 2) % 3;
                    else if (e.key === "Home") n = 0;
                    else if (e.key === "End") n = 2;
                    else return;
                    e.preventDefault();
                    setTab(n);
                    document.getElementById("tab-" + fits[n].id)?.focus();
                  }}
                >
                  {x.label}
                  <span>↗</span>
                </button>
              ))}
            </div>
            <article
              className="l-fit-panel"
              role="tabpanel"
              id={"panel-" + f.id}
              aria-labelledby={"tab-" + f.id}
            >
              <div className="l-fit-copy">
                <p className="l-fit-name">{f.label}</p>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
                <div className="l-focus">
                  <span>Điểm bắt đầu của bạn</span>
                  <ul>
                    {f.focus.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <Link className="l-text-link" to={f.link}>
                  Khám phá lựa chọn <Icon name="arrow" />
                </Link>
              </div>
              <div className="l-fit-art">
                <div className="l-art-orbit" />
                <Art type={f.image} />
                <span className="l-art-caption">Hình ảnh minh họa</span>
              </div>
            </article>
            <div className="l-bento">
              <Link
                className="l-bento-card l-bento-monitor"
                to="/danh-muc/monitor"
              >
                <div>
                  <span>Mở rộng góc nhìn</span>
                  <h3>
                    Một màn hình.
                    <br />
                    Nhiều cảm hứng.
                  </h3>
                  <span className="l-card-link">
                    Khám phá màn hình <Icon name="arrow" />
                  </span>
                </div>
                <Art type="monitor" />
              </Link>
              <Link className="l-bento-card l-bento-parts" to="/san-pham/ram16">
                <div>
                  <span>Bắt đầu từ một nâng cấp</span>
                  <h3>
                    Thêm bộ nhớ.
                    <br />
                    Thêm khả năng.
                  </h3>
                  <span className="l-card-link">
                    Xem bộ nhớ RAM <Icon name="arrow" />
                  </span>
                </div>
                <Art type="ram" />
              </Link>
            </div>
          </div>
        </section>
        <section id="your-journey" className="l-journey l-section">
          <div className="l-container l-journey-grid">
            <div className="l-journey-visual">
              <h2>
                Từng lựa chọn.
                <br />
                <span>Đều rõ ràng.</span>
              </h2>
              <p>
                Chủ động từ lúc chọn linh kiện
                <br />
                đến khi cầm thiết bị trên tay.
              </p>
              <div className="l-blueprint" aria-hidden="true">
                <div className="l-blueprint-ring" />
                <div className="l-drawn-case">
                  <div className="l-case-top" />
                  <div className="l-case-front">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="l-case-side">
                    <b>
                      TECH<span>ZONE</span>
                    </b>
                    <div className="l-circuit" />
                    <div className="l-circuit short" />
                  </div>
                </div>
              </div>
              <Link className="l-text-link" to="/build-pc">
                Tự chọn cấu hình của bạn <Icon name="arrow" />
              </Link>
            </div>
            <div className="l-story">
              {[
                [
                  "Đúng phiên bản.",
                  "Rõ từng thông số.",
                  "Xem giá, bộ nhớ, cấu hình và tồn kho của đúng phiên bản trước khi chọn.",
                ],
                [
                  "Một bộ máy.",
                  "Nhiều lựa chọn cùng nhau.",
                  "Chọn ngân sách và nhu cầu. Kiểm tra từng linh kiện, số lượng và tương thích trước khi đặt hàng.",
                ],
                [
                  "Đặt online.",
                  "Nhận tại cửa hàng.",
                  "Khi đơn sẵn sàng, đến cửa hàng kiểm tra và nhận trực tiếp. Theo dõi bảo hành trong tài khoản.",
                ],
              ].map((s, i) => (
                <article className="l-story-step" key={s[0]}>
                  <span className="l-story-number">0{i + 1}</span>
                  <h3>
                    {s[0]}
                    <br />
                    {s[1]}
                  </h3>
                  <p>{s[2]}</p>
                  {i === 0 ? (
                    <div className="l-mini-spec">
                      <span>Phiên bản RAM minh họa</span>
                      <strong>
                        16GB <span>/ thanh</span>
                      </strong>
                      <div>
                        <span>DDR5</span>
                        <span>5600 MT/s</span>
                      </div>
                    </div>
                  ) : (
                    <Link
                      className="l-text-link"
                      to={i === 1 ? "/build-pc" : "/don-hang"}
                    >
                      Khám phá <Icon name="arrow" />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="questions" className="l-questions l-section">
          <div className="l-container l-faq-grid">
            <div>
              <h2>
                Trước khi
                <br />
                <span>bắt đầu.</span>
              </h2>
              <p>
                Một vài điều giúp bạn
                <br />
                chọn mua chủ động hơn.
              </p>
            </div>
            <div className="l-faq-list">
              {[
                [
                  "Tôi nhận hàng bằng cách nào?",
                  "Bạn đặt online và đến nhận tại cửa hàng khi đơn đã sẵn sàng.",
                ],
                [
                  "Tôi chưa rành linh kiện, bắt đầu ở đâu?",
                  "Chọn ngân sách và nhu cầu trong công cụ Build PC, sau đó kiểm tra đề xuất trước khi mua.",
                ],
                [
                  "Gợi ý AI có đảm bảo tương thích tuyệt đối không?",
                  "Cần kiểm tra theo đúng phiên bản thực tế. Bản demo minh họa kiểm tra bằng dữ liệu mẫu, chưa kết nối dịch vụ AI.",
                ],
                [
                  "Sau khi nhận hàng, tôi xem bảo hành ở đâu?",
                  "Đăng nhập tài khoản mua hàng và mở Bảo hành của tôi. Khi cần, mang thiết bị đến cửa hàng.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span>+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="l-final">
          <div className="l-container">
            <p>Góc máy tiếp theo đang chờ bạn.</p>
            <h2>
              Bắt đầu từ
              <br />
              <em>điều bạn muốn.</em>
            </h2>
            <div className="l-actions">
              <Link className="l-button l-white" to="/build-pc">
                Build chiếc PC của bạn <Icon name="arrow" />
              </Link>
              <Link className="l-button l-outline" to="/cua-hang">
                Vào cửa hàng <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="l-final-lines" />
        </section>
      </main>
      <footer className="l-footer">
        <div className="l-container">
          <div>
            <Logo />
            <p>Chọn đúng linh kiện. Theo dõi rõ từng đơn hàng.</p>
          </div>
          <nav>
            <Link to="/cua-hang">Cửa hàng</Link>
            <Link to="/build-pc">Build PC</Link>
            <Link to="/dang-nhap">Tài khoản</Link>
          </nav>
          <small>© 2026 TechZone Pro · Demo</small>
        </div>
      </footer>
    </div>
  );
}
