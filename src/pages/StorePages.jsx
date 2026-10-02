import { useEffect, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useStore } from "../state/context";
import { categories } from "../data/seed";
import { money } from "../domain/commerce";
import {
  Art,
  Badge,
  Button,
  Empty,
  Field,
  Icon,
  Notice,
  Panel,
  ProductCard,
  Quantity,
} from "../components/ui";
export function Home() {
  const { data } = useStore(),
    [slide, setSlide] = useState(0),
    [playing, setPlaying] = useState(false),
    [hover, setHover] = useState(false);
  useEffect(() => {
    if (
      !playing ||
      hover ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => setSlide((s) => (s + 1) % 3), 5500);
    return () => clearInterval(id);
  }, [playing, hover]);
  const slides = [
    [
      "Chiếc PC tiếp theo.",
      "Đúng với nhu cầu bạn.",
      "Khám phá linh kiện, chọn từng phiên bản và xây dựng cấu hình theo ngân sách. Đặt online, nhận trực tiếp tại cửa hàng.",
      "/build-pc",
      "Tư vấn cấu hình",
    ],
    [
      "Mở rộng góc nhìn.",
      "Nâng tầm trải nghiệm.",
      "Khám phá màn hình theo độ phân giải, tấm nền và tần số quét.",
      "/danh-muc/monitor",
      "Khám phá màn hình",
    ],
    [
      "Hiệu năng linh hoạt.",
      "Đồng hành mỗi ngày.",
      "Laptop cho học tập, làm việc và sáng tạo. Chọn đúng cấu hình cho nhu cầu của bạn.",
      "/danh-muc/laptop",
      "Khám phá laptop",
    ],
  ];
  const s = slides[slide],
    promos = data.promotions
      .filter(
        (p) =>
          p.active &&
          p.bannerActive &&
          new Date() >= new Date(p.start) &&
          new Date() <= new Date(p.end),
      )
      .sort((a, b) => a.bannerOrder - b.bannerOrder);
  return (
    <>
      <section
        className="hero home-carousel"
        aria-label="Nội dung nổi bật"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocusCapture={() => setHover(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
        }}
      >
        <div className="carousel-copy" key={slide}>
          <div className="eyebrow">TECHZONE PRO / BUILD YOUR NEXT</div>
          <h1>
            {s[0]}
            <br />
            <span>{s[1]}</span>
          </h1>
          <p>{s[2]}</p>
          <div className="row">
            <Button to={s[3]}>
              {s[4]} <Icon name="arrow" />
            </Button>
            <Button to="/san-pham" tone="light">
              Khám phá linh kiện
            </Button>
          </div>
        </div>
        <div className="carousel-controls">
          <button onClick={() => setPlaying(!playing)} aria-pressed={playing}>
            {playing ? "Ⅱ Tạm dừng" : "▶ Tự chạy"}
          </button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={"Banner " + (i + 1)}
                aria-current={i === slide}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
          <div className="row">
            <span>0{slide + 1} / 03</span>
            <button
              aria-label="Banner trước"
              onClick={() => setSlide((slide + 2) % 3)}
            >
              ←
            </button>
            <button
              aria-label="Banner tiếp"
              onClick={() => setSlide((slide + 1) % 3)}
            >
              →
            </button>
          </div>
        </div>
      </section>
      <div className="value-strip">
        {[
          [
            "bag",
            "Nhận hàng tại cửa hàng",
            "Đặt online, kiểm tra và nhận trực tiếp",
          ],
          [
            "chip",
            "Chọn đúng từng phiên bản",
            "Giá, thông số và tồn kho rõ ràng",
          ],
          [
            "shield",
            "Theo dõi bảo hành",
            "Tra cứu từng thiết bị trong tài khoản",
          ],
        ].map(([ic, t, d]) => (
          <div key={t}>
            <Icon name={ic} />
            <div>
              <b>{t}</b>
              <small>{d}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="category-grid">
        {categories
          .filter((c) =>
            ["cpu", "mainboard", "ram", "gpu", "monitor", "laptop"].includes(
              c.id,
            ),
          )
          .map((c) => (
            <Link className="category-tile" key={c.id} to={"/danh-muc/" + c.id}>
              <Icon name="chip" />
              {c.name}
            </Link>
          ))}
      </div>
      <section className="section">
        <div className="section-title between">
          <div>
            <h2>Khám phá linh kiện & thiết bị</h2>
            <p className="muted">Giá và cấu hình theo phiên bản đang chọn.</p>
          </div>
          <Button to="/san-pham" tone="secondary">
            Xem danh mục →
          </Button>
        </div>
        <div className="four-col">
          {["ram16", "cpu1", "gpu1", "monitor0"]
            .map((id) => data.products.find((p) => p.id === id))
            .filter((p) => p?.status === "active")
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      {promos.map((promo) => (
        <Link
          key={promo.id}
          className="voucher-banner section"
          to={
            promo.bannerLink?.startsWith("/") &&
            !promo.bannerLink.startsWith("//")
              ? promo.bannerLink
              : "/san-pham"
          }
        >
          {promo.bannerImage ? (
            <img
              className="voucher-image"
              src={promo.bannerImage}
              alt=""
              style={{
                width: 120,
                maxWidth: 120,
                height: 76,
                maxHeight: 76,
                objectFit: "cover",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Icon name="spark" />
          )}
          <div>
            <h3>{promo.bannerTitle}</h3>
            <p className="muted small">
              Giảm{" "}
              {promo.type === "percentage"
                ? promo.value + "%"
                : money(promo.value)}{" "}
              trên tổng đơn · Kiểm tra điều kiện khi đặt hàng
            </p>
          </div>
          <strong className="voucher-code push">{promo.code}</strong>
        </Link>
      ))}
      <p className="tiny muted section">
        Dữ liệu và hình ảnh minh họa · Chế độ demo trên thiết bị.
      </p>
    </>
  );
}
export function Catalog() {
  const { data } = useStore(),
    { category } = useParams(),
    [params, setParams] = useSearchParams();
  const selectedCategory = category || params.get("category") || "",
    term = params.get("q") || "",
    brands = params.getAll("brand"),
    sort = params.get("sort") || "name",
    max = Number(params.get("max") || 0),
    spec = params.get("spec") || "";
  const base = data.products.filter(
    (p) =>
      p.status === "active" &&
      (!selectedCategory ||
        (selectedCategory === "parts"
          ? !["monitor", "laptop"].includes(p.category)
          : p.category === selectedCategory)) &&
      (!term ||
        (p.name + " " + p.brand + " " + p.sku + " " + p.variant)
          .toLowerCase()
          .includes(term.toLowerCase())),
  );
  const found = base
    .filter(
      (p) =>
        (!brands.length || brands.includes(p.brand)) &&
        (!max || p.price <= max) &&
        (!spec || Object.values(p.specs).includes(spec)),
    )
    .sort((a, b) =>
      sort === "asc"
        ? a.price - b.price
        : sort === "desc"
          ? b.price - a.price
          : a.name.localeCompare(b.name, "vi"),
    );
  const page = Math.max(
    1,
    Math.min(Number(params.get("page")) || 1, Math.ceil(found.length / 9) || 1),
  );
  function update(key, value) {
    const next = new URLSearchParams(params);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  function toggleBrand(brand) {
    const next = new URLSearchParams(params);
    next.delete("brand");
    (brands.includes(brand)
      ? brands.filter((b) => b !== brand)
      : [...brands, brand]
    ).forEach((b) => next.append("brand", b));
    next.delete("page");
    setParams(next);
  }
  const title =
    categories.find((c) => c.id === selectedCategory)?.name ||
    "Linh kiện & thiết bị";
  const configured = data.specSettings[selectedCategory]
    ?.filter((s) => s.filter)
    .map((s) => s.name);
  const specOptions = [
    ...new Set(
      base.flatMap((p) =>
        Object.entries(p.specs)
          .filter(([k]) => !configured || configured.includes(k))
          .map(([, v]) => v),
      ),
    ),
  ].slice(0, 14);
  return (
    <>
      <div className="breadcrumb">
        <Link to="/cua-hang">Trang chủ</Link>
        <span>›</span>
        <span>{title}</span>
      </div>
      <div className="category-head">
        <div>
          <div className="eyebrow">CHỌN ĐÚNG CHO NHU CẦU</div>
          <h1>
            {term
              ? "Kết quả cho “" + term + "”"
              : title + " cho góc máy của bạn"}
          </h1>
          <p>Lựa chọn theo thương hiệu, mức giá và thông số của phiên bản.</p>
        </div>
        <Badge tone="info">Nhận tại cửa hàng</Badge>
      </div>
      <div className="catalog-layout">
        <aside className="filters">
          <div className="between">
            <h3>Bộ lọc sản phẩm</h3>
            <button
              className="text-button"
              onClick={() =>
                setParams(
                  term
                    ? { q: term }
                    : selectedCategory === "parts"
                      ? { category: "parts" }
                      : {},
                )
              }
            >
              Xóa tất cả
            </button>
          </div>
          <div className="filter-group">
            <h4>Thương hiệu</h4>
            {[...new Set(base.map((p) => p.brand))].map((b) => (
              <label className="filter-option" key={b}>
                <input
                  aria-label={b}
                  type="checkbox"
                  key={b + "-" + (brands.includes(b) ? "on" : "off")}
                  defaultChecked={brands.includes(b)}
                  onChange={() => toggleBrand(b)}
                />
                {b}
                <small>{base.filter((p) => p.brand === b).length}</small>
              </label>
            ))}
          </div>
          <div className="filter-group">
            <Field label="Giá tối đa">
              {(id) => (
                <select
                  id={id}
                  className="input"
                  value={max}
                  onChange={(e) => update("max", e.target.value)}
                >
                  <option value="0">Tất cả mức giá</option>
                  {[2000000, 5000000, 10000000, 20000000, 35000000].map((v) => (
                    <option value={v} key={v}>
                      {money(v)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="filter-group">
            <Field label="Thông số">
              {(id) => (
                <select
                  id={id}
                  className="input"
                  value={spec}
                  onChange={(e) => update("spec", e.target.value)}
                >
                  <option value="">Tất cả thông số</option>
                  {specOptions.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="filter-group">
            <h4>Danh mục</h4>
            {categories.map((c) => (
              <Link
                className="category-filter"
                key={c.id}
                to={"/danh-muc/" + c.id}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </aside>
        <div>
          <div className="between section-title">
            <b>{found.length} phiên bản phù hợp</b>
            <select
              className="input"
              aria-label="Sắp xếp sản phẩm"
              value={sort}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="name">Tên A–Z</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
          {found.length ? (
            <div className="catalog-products">
              {found.slice((page - 1) * 9, page * 9).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty
              title="Chưa tìm thấy sản phẩm"
              description="Thử đổi từ khóa hoặc xóa bộ lọc."
            />
          )}
          {found.length > 9 && (
            <div className="pagination">
              {Array.from({ length: Math.ceil(found.length / 9) }, (_, i) => (
                <button
                  className={page === i + 1 ? "active" : ""}
                  key={i}
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.set("page", i + 1);
                    setParams(p);
                    window.scrollTo(0, 0);
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export function Product() {
  const { id } = useParams(),
    { data, addCart } = useStore(),
    navigate = useNavigate(),
    [quantity, setQuantity] = useState(1),
    [tab, setTab] = useState("description");
  const p = data.products.find((p) => p.id === id);
  if (!p || p.status !== "active")
    return (
      <Empty
        title="Sản phẩm không còn khả dụng"
        action={<Button to="/san-pham">Xem sản phẩm khác</Button>}
      />
    );
  const variants = data.products.filter(
    (v) => v.productId === p.productId && v.status === "active",
  );
  const reviews = data.reviews.filter((r) => r.productId === p.id);
  const primary = data.specSettings[p.category]
    ?.filter((s) => s.primary)
    .map((s) => s.name);
  return (
    <>
      <div className="breadcrumb">
        <Link to="/cua-hang">Trang chủ</Link>
        <span>›</span>
        <Link to={"/danh-muc/" + p.category}>
          {categories.find((c) => c.id === p.category)?.name}
        </Link>
        <span>› {p.name}</span>
      </div>
      <div className="panel product-detail">
        <div>
          <Art type={p.category} image={p.image} name={p.name} />
          <div className="row section">
            <Badge>{p.brand}</Badge>
            <Badge tone="info">Bảo hành {p.warranty} tháng</Badge>
          </div>
          <p className="muted tiny section">
            Hình ảnh minh họa · Phiên bản {p.variant}
          </p>
        </div>
        <div>
          <div className="eyebrow">
            {p.brand} / {p.category}
          </div>
          <h1>{p.name}</h1>
          <p className="small muted section">
            SKU: <span className="mono">{p.sku}</span>
          </p>
          <div className="row section">
            <div className="price">{money(p.price)}</div>
            <span className="old-price">{money(p.originalPrice)}</span>
          </div>
          <p className="small green-text section">
            {p.stock > 0 ? "● Còn " + p.stock + " sản phẩm" : "Hết hàng"} · Nhận
            tại cửa hàng
          </p>
          <div className="section">
            <b className="small">Chọn phiên bản</b>
            <div className="variant-select">
              {variants.map((v) => (
                <button
                  key={v.id}
                  className={
                    "variant-option " + (v.id === id ? "selected" : "")
                  }
                  aria-pressed={v.id === id}
                  onClick={() => {
                    setQuantity(1);
                    navigate("/san-pham/" + v.id);
                  }}
                >
                  <b>{v.variant}</b>
                  <br />
                  {money(v.price)}
                </button>
              ))}
            </div>
          </div>
          <div className="chips">
            {Object.entries(p.specs)
              .filter(([k]) => !primary || primary.includes(k))
              .map(([k, v]) => (
                <span className="chip" key={k}>
                  {v}
                </span>
              ))}
          </div>
          <div className="row section">
            <Quantity
              value={quantity}
              onChange={setQuantity}
              max={p.stock || 1}
            />
            {p.category === "ram" && (
              <span className="small">
                {quantity} thanh × {p.tech?.capacity || "?"}GB ={" "}
                <b>{quantity * (p.tech?.capacity || 0)}GB</b>
              </span>
            )}
          </div>
          <div className="row wrap-row section">
            <Button disabled={!p.stock} onClick={() => addCart(p.id, quantity)}>
              <Icon name="cart" />
              Thêm vào giỏ
            </Button>
            <Button
              disabled={!p.stock}
              tone="secondary"
              onClick={() => {
                addCart(p.id, quantity);
                navigate("/gio-hang");
              }}
            >
              Mua ngay →
            </Button>
          </div>
          <div className="section">
            <Notice tone="neutral">
              Giá, ảnh và thông số theo phiên bản. Thêm vào giỏ chưa giữ hàng.
            </Notice>
          </div>
        </div>
      </div>
      <div className="section two-col">
        <Panel title="Thông số kỹ thuật">
          <table className="spec-table">
            <tbody>
              {Object.entries(p.specs).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
              <tr>
                <td>Bảo hành</td>
                <td>{p.warranty} tháng</td>
              </tr>
            </tbody>
          </table>
        </Panel>
        <Panel>
          <div className="tabs">
            <button
              className={tab === "description" ? "active" : ""}
              onClick={() => setTab("description")}
            >
              Mô tả sản phẩm
            </button>
            <button
              className={tab === "reviews" ? "active" : ""}
              onClick={() => setTab("reviews")}
            >
              Đánh giá ({reviews.length})
            </button>
          </div>
          {tab === "description" ? (
            <>
              <h3>{p.name}</h3>
              <p className="muted section">
                {p.description ||
                  "Chọn đúng phiên bản theo nhu cầu sử dụng. Kiểm tra thông số và khả năng tương thích với cấu hình trước khi đặt mua."}
              </p>
              {p.category === "ram" && (
                <Notice tone="neutral">
                  RAM được bán theo từng thanh. Chọn số lượng 2 tương ứng hai
                  thanh cùng phiên bản.
                </Notice>
              )}
            </>
          ) : reviews.length ? (
            reviews.map((r) => (
              <div className="review" key={r.id}>
                <span className="rating">{"★".repeat(r.rating)}</span>
                <p>{r.comment}</p>
                <small className="muted">Đã mua hàng · {r.name}</small>
              </div>
            ))
          ) : (
            <p className="muted">
              Chưa có đánh giá. Bạn có thể đánh giá từ đơn hàng đã nhận.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
