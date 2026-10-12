import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { animate, createScope, stagger } from "animejs";
import { Logo, Icon, Art, Skeleton, Toast } from "../components/ui";

const fits = [
  {
    id: "gaming",
    label: "Chơi game",
    title: "Đắm mình trong từng khung hình.",
    description:
      "Bắt đầu từ tựa game, độ phân giải và ngân sách. Cân đối card đồ họa, CPU và màn hình cho trải nghiệm bạn muốn.",
    focus: ["Card đồ họa", "Bộ vi xử lý", "Màn hình 144Hz+"],
    budgetRecommendation: "Từ 18.500.000₫",
    perfHighlight: "240+ FPS Esports / 90+ FPS AAA 2K",
    image: "gpu",
    link: "/build-pc?purpose=gaming",
  },
  {
    id: "creative",
    label: "Sáng tạo",
    title: "Thêm không gian cho ý tưởng.",
    description:
      "Dựng video 4K, thiết kế 3D hay xử lý âm thanh: chọn linh kiện theo phần mềm, dung lượng dự án và khả năng mở rộng.",
    focus: ["Bộ nhớ RAM 32GB+", "SSD Gen4 tốc độ cao", "CPU đa nhân"],
    budgetRecommendation: "Từ 24.000.000₫",
    perfHighlight: "Render After Effects & Blender siêu tốc",
    image: "ram",
    link: "/build-pc?purpose=creative",
  },
  {
    id: "work",
    label: "Làm việc",
    title: "Gọn góc làm việc. Rộng khả năng.",
    description:
      "Ưu tiên tính ổn định, tản nhiệt êm ái, màn hình chuẩn màu và khả năng nâng cấp lâu dài cho văn phòng & lập trình.",
    focus: ["Đa nhiệm mượt mà", "Màn hình IPS chuẩn màu", "Tiết kiệm điện"],
    budgetRecommendation: "Từ 12.900.000₫",
    perfHighlight: "Đa nhiệm 50+ tabs, biên dịch mã tức thì",
    image: "laptop",
    link: "/danh-muc/laptop",
  },
];

const budgetPresets = [
  {
    tier: "Phổ thông & Esports",
    range: "15 - 20 Triệu",
    badge: "Bán chạy nhất",
    budgetVal: 18,
    specs: {
      cpu: "Intel Core i5-13400F (10 nhân / 16 luồng)",
      gpu: "NVIDIA GeForce RTX 3050 6GB GDDR6",
      ram: "16GB DDR4 3200MHz tản nhiệt thép",
      ssd: "500GB NVMe PCIe Gen3 (2500MB/s)",
      psu: "550W 80 Plus Bronze chứng nhận",
    },
    fps: [
      { name: "Valorant (1080p High)", val: "280 FPS" },
      { name: "League of Legends", val: "240 FPS" },
      { name: "CS2 (1080p Medium)", val: "170 FPS" },
    ],
    highlight: "Khởi đầu hoàn hảo cho game thủ trẻ & học tập đồ họa cơ bản",
    link: "/build-pc?budget=18",
  },
  {
    tier: "Gaming 2K & Đồ họa",
    range: "25 - 32 Triệu",
    badge: "Khuyên dùng",
    budgetVal: 28,
    specs: {
      cpu: "Intel Core i5-14400F / Ryzen 5 7600",
      gpu: "NVIDIA GeForce RTX 4060 8GB (DLSS 3)",
      ram: "32GB (2x16GB) DDR5 5600MHz",
      ssd: "1TB PCIe Gen4 NVMe (5000MB/s)",
      psu: "650W 80 Plus Gold hiệu suất cao",
    },
    fps: [
      { name: "Black Myth: Wukong (DLSS)", val: "85 FPS" },
      { name: "Cyberpunk 2077 (2K)", val: "75 FPS" },
      { name: "Premiere 4K Timeline", val: "Mượt mà" },
    ],
    highlight: "Chiến trọn vẹn game AAA ở độ phân giải 2K và dựng video mượt mà",
    link: "/build-pc?budget=28",
  },
  {
    tier: "Hiệu năng Cao & Streamer",
    range: "38 - 48 Triệu",
    badge: "Pro Choice",
    budgetVal: 42,
    specs: {
      cpu: "Intel Core i7-14700K / Ryzen 7 7800X3D",
      gpu: "NVIDIA GeForce RTX 4070 SUPER 12GB",
      ram: "32GB DDR5 6000MHz CL30 RGB",
      ssd: "1TB PCIe Gen4 Pro (7400MB/s)",
      psu: "750W 80 Plus Gold Modular",
    },
    fps: [
      { name: "Black Myth: Wukong (2K Max RT)", val: "115 FPS" },
      { name: "Forza Horizon 5 (2K Extreme)", val: "160 FPS" },
      { name: "Live Stream 1080p60fps", val: "Không tụt FPS" },
    ],
    highlight: "Cấu hình chuẩn cho streamer, tuyển thủ thi đấu và nhà sáng tạo nội dung",
    link: "/build-pc?budget=42",
  },
  {
    tier: "Flagship Creator & AI",
    range: "60+ Triệu",
    badge: "Cực đỉnh",
    budgetVal: 65,
    specs: {
      cpu: "Intel Core i9-14900K / Ryzen 9 7950X3D",
      gpu: "NVIDIA GeForce RTX 4080 SUPER 16GB",
      ram: "64GB DDR5 6400MHz",
      ssd: "2TB Samsung 990 PRO NVMe",
      psu: "1000W 80 Plus Platinum AIO 360",
    },
    fps: [
      { name: "Cyberpunk 4K Ray Tracing Overdrive", val: "100+ FPS" },
      { name: "3D Blender Render", val: "Nhanh gấp 3x" },
      { name: "Chạy mô hình LLM AI Local", val: "Tức thì" },
    ],
    highlight: "Không giới hạn sáng tạo, tối đa khung hình ở chuẩn hiển thị 4K cao cấp",
    link: "/build-pc?budget=65",
  },
];

const faqs = [
  {
    id: "showroom",
    num: "01",
    tag: "Showroom",
    q: "Có được tự tay kiểm tra và xem ráp máy không?",
    highlights: [
      "Tự tay bóc seal & kiểm tra linh kiện chính hãng 100%.",
      "Xem trực tiếp kỹ thuật viên lắp ráp & test tải nặng trước khi nhận máy.",
    ],
    linkText: "Xem địa chỉ showroom",
    linkTo: "/cua-hang",
  },
  {
    id: "beginner",
    num: "02",
    tag: "Tư vấn",
    q: "Chưa rành phần cứng thì bắt đầu từ đâu?",
    highlights: [
      "Chỉ cần chọn mức ngân sách & tựa game/phần mềm cần dùng.",
      "Hệ thống tự động ghép linh kiện tương thích 100%, không lo nghẽn.",
    ],
    linkText: "Mở bộ dự toán cấu hình",
    linkTo: "#simulator",
  },
  {
    id: "stress-test",
    num: "03",
    tag: "Chất lượng",
    q: "Quy trình kiểm tra nhiệt độ và độ ổn định ra sao?",
    highlights: [
      "Stress Test FurMark + Cinebench liên tục tối thiểu 45 phút.",
      "Bàn giao kèm biên bản đo nhiệt độ tải tối đa và hiệu năng thực tế.",
    ],
    linkText: "Khám phá cấu hình mẫu",
    linkTo: "/build-pc",
  },
  {
    id: "warranty",
    num: "04",
    tag: "Bảo hành",
    q: "Chính sách đổi mới 30 ngày và bảo hành áp dụng thế nào?",
    highlights: [
      "Lỗi phần cứng trong 30 ngày đầu được đổi mới linh kiện 100%.",
      "Bảo hành điện tử chính hãng theo số điện thoại, không cần giữ giấy tờ.",
    ],
    linkText: "Tra cứu bảo hành của tôi",
    linkTo: "/bao-hanh",
  },
  {
    id: "payment",
    num: "05",
    tag: "Thanh toán",
    q: "TechZone hỗ trợ hình thức thanh toán và trả góp nào?",
    highlights: [
      "Trả góp 0% qua thẻ tín dụng, xét duyệt nhanh trong 15 phút.",
      "Thanh toán linh hoạt: Chuyển khoản QR 24/7, Visa/MasterCard, tiền mặt.",
    ],
    linkText: "Chính sách mua sắm",
    linkTo: "/cua-hang",
  },
];

export default function Landing() {
  const root = useRef(null),
    [tab, setTab] = useState(0),
    [budgetIndex, setBudgetIndex] = useState(1),
    [open, setOpen] = useState(false),
    [motion, setMotion] = useState(
      () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [imageLoaded, setImageLoaded] = useState(false),
    [imageError, setImageError] = useState(false),
    [imageRetryKey, setImageRetryKey] = useState(0),
    [activeFaqId, setActiveFaqId] = useState(null),
    [toast, setToast] = useState(null);

  // Animation on mount
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
      animate(".l-trust-item", {
        opacity: [0, 1],
        translateY: [15, 0],
        delay: stagger(80),
        duration: 600,
        ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [motion]);

  const f = fits[tab];
  const b = budgetPresets[budgetIndex];

  // Toggle FAQ item (Single accordion mode)
  const toggleFaq = (id) => {
    setActiveFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="landing-page" ref={root}>
      <a className="l-skip" href="#main-content">
        Bỏ qua điều hướng
      </a>

      {/* UX Feedback Toast Notification */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <header className="l-header">
        <div className="l-nav-shell">
          <Logo />
          <button
            className="l-menu-toggle"
            aria-expanded={open}
            aria-label="Chuyển đổi menu điều hướng"
            onClick={() => setOpen(!open)}
          >
            Menu ☰
          </button>
          <nav className={open ? "open" : ""}>
            <a href="#trust" onClick={() => setOpen(false)}>
              Cam kết dịch vụ
            </a>
            <a href="#simulator" onClick={() => setOpen(false)}>
              Dự toán cấu hình
            </a>
            <a href="#your-fit" onClick={() => setOpen(false)}>
              Chọn theo nhu cầu
            </a>
            <a href="#your-journey" onClick={() => setOpen(false)}>
              Trải nghiệm TechZone
            </a>
            <a href="#questions" onClick={() => setOpen(false)}>
              Giải đáp thắc mắc
            </a>
          </nav>
          <Link className="l-store-link" to="/cua-hang">
            Vào cửa hàng <Icon name="arrow" />
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* HERO SECTION */}
        <section className="l-hero">
          <div className="l-hero-copy">
            <div className="l-hero-eyebrow">
              <span className="l-pulse-dot" />
              Sẵn sàng giao linh kiện & lắp ráp chuẩn kỹ thuật
            </div>
            <h1>
              <span>Hiệu năng đỉnh cao.</span>
              <span>
                Mang dấu ấn <em>của bạn.</em>
              </span>
            </h1>
            <p>
              Từ linh kiện nguyên seal đến góc máy cá nhân hóa hoàn chỉnh.
              <br />
              Khám phá cấu hình đo ni đóng giày cho cách bạn chơi game, sáng tạo và làm việc.
            </p>
            <div className="l-actions">
              <Link className="l-button l-primary" to="/build-pc">
                <Icon name="chip" /> Build chiếc PC của bạn <Icon name="arrow" />
              </Link>
              <a className="l-button l-outline" href="#simulator">
                <Icon name="spark" /> Dự toán theo ngân sách
              </a>
            </div>
          </div>

          <div className="l-stage">
            {!imageLoaded && !imageError && (
              <div className="l-stage-skeleton" aria-hidden="true">
                <Skeleton width="100%" height="100%" radius="12px" />
                <div className="l-skeleton-text">Đang tải sân khấu TechZone…</div>
              </div>
            )}
            <img
              key={imageRetryKey}
              className={`l-stage-image ${imageLoaded ? "loaded" : "loading"}`}
              src="/assets/landing-stage.webp"
              width="1536"
              height="1024"
              alt="Dàn PC Gaming cao cấp của TechZone trên sân khấu ánh sáng đỏ"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageLoaded(false);
                setImageError(true);
              }}
            />
            {imageError && (
              <div className="l-image-error" role="alert">
                <Icon name="shield" />
                <p>Hình ảnh sân khấu chưa tải được do kết nối.</p>
                <button
                  type="button"
                  className="l-button l-outline"
                  onClick={() => {
                    setImageError(false);
                    setImageRetryKey((k) => k + 1);
                  }}
                >
                  <Icon name="refresh" /> Thử tải lại ảnh
                </button>
              </div>
            )}
          </div>

          <div className="l-hero-bottom">
            <a href="#trust" className="l-scroll-cue">
              <span>↓</span> Khám phá tiêu chuẩn TechZone
            </a>
            <button
              className="l-motion"
              aria-pressed={!motion}
              onClick={() => setMotion(!motion)}
              aria-label={motion ? "Tắt hiệu ứng chuyển động" : "Bật hiệu ứng chuyển động"}
            >
              <span className="l-motion-dot" />
              {motion ? "Tắt chuyển động" : "Bật chuyển động"}
            </button>
          </div>
        </section>

        {/* TRUST & TRANSPARENCY BAR */}
        <section id="trust" className="l-trust-bar">
          <div className="l-container">
            <div className="l-trust-grid">
              <div className="l-trust-item">
                <div className="l-trust-icon"><Icon name="shield" /></div>
                <div>
                  <h4>100% Chính Hãng</h4>
                  <p>Phân phối chính ngạch, bảo hành đổi mới 30 ngày đầu.</p>
                </div>
              </div>
              <div className="l-trust-item">
                <div className="l-trust-icon"><Icon name="zap" /></div>
                <div>
                  <h4>Lắp Ráp & Test Tải 0đ</h4>
                  <p>Kiểm tra nhiệt độ tải nặng benchmark trước khi xuất xưởng.</p>
                </div>
              </div>
              <div className="l-trust-item">
                <div className="l-trust-icon"><Icon name="pin" /></div>
                <div>
                  <h4>Trực Tiếp Tại Showroom</h4>
                  <p>Khui seal tận mắt, xem kỹ thuật viên hoàn thiện máy.</p>
                </div>
              </div>
              <div className="l-trust-item">
                <div className="l-trust-icon"><Icon name="spark" /></div>
                <div>
                  <h4>Đánh Giá 4.9/5 Sao</h4>
                  <p>Hơn 12.000 góc máy được xây dựng và tin dùng từ 2021.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE BUDGET ESTIMATOR SIMULATOR */}
        <section id="simulator" className="l-simulator l-section">
          <div className="l-container">
            <div className="l-section-head">
              <div className="eyebrow red">CÔNG CỤ TƯ VẤN TRỰC QUAN</div>
              <h2>
                Dự toán cấu hình theo ngân sách.
                <br />
                <span>Xem trước sức mạnh tức thì.</span>
              </h2>
              <p>
                Không cần phân vân giữa hàng nghìn mã linh kiện.
                <br />
                Chọn mức đầu tư dự kiến để khám phá ngay cấu hình tối ưu và số khung hình FPS đạt được.
              </p>
            </div>

            <div className="l-sim-wrapper">
              <div className="l-sim-presets" role="tablist" aria-label="Mức ngân sách PC">
                {budgetPresets.map((preset, idx) => (
                  <button
                    key={preset.tier}
                    type="button"
                    role="tab"
                    aria-selected={idx === budgetIndex}
                    className={`l-sim-tab ${idx === budgetIndex ? "active" : ""}`}
                    onClick={() => {
                      setBudgetIndex(idx);
                      setToast({
                        type: "info",
                        message: `Đã chọn cấu hình phân khúc: ${preset.tier} (${preset.range})`,
                      });
                    }}
                  >
                    <span className="l-sim-tab-badge">{preset.badge}</span>
                    <strong className="l-sim-tab-range">{preset.range}</strong>
                    <span className="l-sim-tab-name">{preset.tier}</span>
                  </button>
                ))}
              </div>

              <div className="l-sim-card">
                <div className="l-sim-card-head between">
                  <div>
                    <span className="badge brand">{b.tier}</span>
                    <h3>{b.highlight}</h3>
                    <p className="muted">Ước tính mức giá hoàn thiện linh kiện: ~{b.range}</p>
                  </div>
                  <Link to={b.link} className="l-button l-primary">
                    Tùy biến cấu hình này <Icon name="arrow" />
                  </Link>
                </div>

                <div className="l-sim-grid">
                  <div className="l-sim-specs">
                    <h4>
                      <Icon name="chip" /> Danh sách linh kiện đề xuất:
                    </h4>
                    <ul>
                      <li>
                        <span>Vi xử lý (CPU)</span>
                        <strong>{b.specs.cpu}</strong>
                      </li>
                      <li>
                        <span>Card đồ họa (GPU)</span>
                        <strong>{b.specs.gpu}</strong>
                      </li>
                      <li>
                        <span>Bộ nhớ (RAM)</span>
                        <strong>{b.specs.ram}</strong>
                      </li>
                      <li>
                        <span>Ổ cứng (SSD)</span>
                        <strong>{b.specs.ssd}</strong>
                      </li>
                      <li>
                        <span>Bộ nguồn (PSU)</span>
                        <strong>{b.specs.psu}</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="l-sim-perf">
                    <h4>
                      <Icon name="zap" /> Hiệu năng thực tế ước tính:
                    </h4>
                    <div className="l-fps-bars">
                      {b.fps.map((game) => (
                        <div key={game.name} className="l-fps-item">
                          <div className="between">
                            <span>{game.name}</span>
                            <strong>{game.val}</strong>
                          </div>
                          <div className="l-bar-track">
                            <div
                              className="l-bar-fill"
                              style={{
                                width: game.val.includes("280")
                                  ? "95%"
                                  : game.val.includes("240")
                                    ? "85%"
                                    : game.val.includes("160") || game.val.includes("170")
                                      ? "70%"
                                      : game.val.includes("115")
                                        ? "65%"
                                        : "55%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="l-sim-footnote">
                      <Icon name="spark" />
                      <span>
                        Mọi cấu hình đều được tối ưu tản nhiệt và cam kết chạy ổn định 100% khi nhận máy.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* YOUR FIT (THEO NHU CẦU) */}
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
                Hãy bắt đầu từ điều bạn muốn làm mỗi ngày.
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
                <div className="l-fit-meta">
                  <span className="badge neutral">{f.label}</span>
                  <span className="l-fit-budget">{f.budgetRecommendation}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
                <div className="l-focus">
                  <span>Trọng tâm linh kiện</span>
                  <ul>
                    {f.focus.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="l-fit-stat">
                  <Icon name="spark" />
                  <span>{f.perfHighlight}</span>
                </div>
                <Link className="l-text-link" to={f.link}>
                  Khám phá cấu hình phù hợp <Icon name="arrow" />
                </Link>
              </div>
              <div className="l-fit-art">
                <div className="l-art-orbit" />
                <Art type={f.image} />
                <span className="l-art-caption">Hình ảnh minh họa hệ thống</span>
              </div>
            </article>

            {/* BENTO CARDS */}
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

        {/* YOUR JOURNEY */}
        <section id="your-journey" className="l-journey l-section">
          <div className="l-container l-journey-grid">
            <div className="l-journey-visual">
              <h2>
                Từng lựa chọn.
                <br />
                <span>Đều rõ ràng minh bạch.</span>
              </h2>
              <p>
                Chủ động từ lúc chọn linh kiện
                <br />
                đến khi cầm thiết bị trên tay tại showroom.
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

        {/* QUESTIONS / FAQ - MODERN SLEEK 2-COLUMN CARDS */}
        <section id="questions" className="l-questions l-section">
          <div className="l-container">
            <div className="l-faq-layout">
              {/* Left Column: Title & Live Support Anchor */}
              <div className="l-faq-left-col">
                <div className="l-faq-sticky-head">
                  <div className="l-hero-eyebrow">
                    <span className="l-pulse-dot" />
                    <span>HỖ TRỢ TRỰC TUYẾN 24/7</span>
                  </div>
                  <h2>
                    Giải đáp rõ ràng.
                    <br />
                    <em>An tâm tuyệt đối.</em>
                  </h2>
                  <p className="l-faq-sublead">
                    Mọi thắc mắc về kiểm tra linh kiện, lắp ráp và chính sách bảo hành đều được công khai minh bạch.
                  </p>

                  <div className="l-faq-support-card">
                    <div className="l-support-card-header">
                      <div className="l-support-avatar">
                        <Icon name="user" />
                      </div>
                      <div>
                        <strong>Kỹ thuật viên TechZone</strong>
                        <span className="l-support-status">Đang trực tuyến · Phản hồi trong 5p</span>
                      </div>
                    </div>
                    <p className="l-support-desc">
                      Cần tư vấn phối linh kiện riêng theo ngân sách hoặc tựa game của bạn?
                    </p>
                    <div className="l-support-actions">
                      <Link to="/cua-hang" className="l-button l-red l-btn-compact">
                        <Icon name="message" /> Chat tư vấn ngay
                      </Link>
                      <a href="tel:18006868" className="l-support-phone">
                        Hotline: 1800 6868
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Interactive Cards */}
              <div className="l-faq-right-col" role="region" aria-label="Câu hỏi thường gặp">
                {faqs.map((faq) => {
                  const isOpen = activeFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`l-faq-card ${isOpen ? "open" : ""}`}
                    >
                      <button
                        type="button"
                        className="l-faq-card-header"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${faq.id}`}
                      >
                        <div className="l-faq-card-title-group">
                          <span className="l-faq-tag-pill">{faq.tag}</span>
                          <span className="l-faq-question-text">{faq.q}</span>
                        </div>
                        <span className={`l-faq-action-btn ${isOpen ? "active" : ""}`} aria-hidden="true">
                          <Icon name={isOpen ? "minus" : "plus"} />
                        </span>
                      </button>

                      {isOpen && (
                        <div id={`faq-answer-${faq.id}`} className="l-faq-card-body">
                          <div className="l-faq-highlights-list">
                            {faq.highlights.map((point, idx) => (
                              <div key={idx} className="l-faq-point-row">
                                <span className="l-faq-point-icon">
                                  <Icon name="check" />
                                </span>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                          {faq.linkTo && (
                            <Link to={faq.linkTo} className="l-faq-card-link">
                              {faq.linkText} <Icon name="arrow" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="l-final">
          <div className="l-container">
            <p>Góc máy mơ ước đang chờ bạn hoàn thiện.</p>
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
          <small>© 2026 TechZone Pro · Trải nghiệm mua sắm công nghệ cao cấp</small>
        </div>
      </footer>
    </div>
  );
}
