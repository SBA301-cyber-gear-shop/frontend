import { Link } from "react-router-dom";
import { categories } from "../constants";
import { money } from "@/utils";
import { Button, Icon, Notice } from "@/components/ui";
import { ProductCard } from "./ProductCard";
import { useStoreHome } from "../hooks/useStoreHome";

export function StoreHome() {
  const {
    data,
    slide,
    setSlide,
    playing,
    setPlaying,
    setHover,
    slides,
    s,
    promos,
    promotionError,
  } = useStoreHome();
  return (
    <>
      {promotionError && (
        <Notice tone="warning">
          Chưa tải được chương trình khuyến mãi. Bạn vẫn có thể xem sản phẩm và
          nhập mã ở checkout.
        </Notice>
      )}
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
