import { Link } from "react-router-dom";
import { Art } from "@/components/ui";
import { money } from "@/utils";
import { ProductFeedback } from "./ProductFeedback";
import "./ProductCard.css";

export function ProductCard({ product: p }) {
  const price = Number(p.price);
  const originalPrice = Number(p.originalPrice);
  const discount = Number.isFinite(price) && Number.isFinite(originalPrice) && price >= 0 && originalPrice > price
    ? (originalPrice - price) * 100 / originalPrice
    : 0;
  const discountLabel = discount < 0.01 ? "<0,01" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(discount);
  return (
    <article className="product-card">
      {discount > 0 && <span className="product-card-discount">Giảm {discountLabel}%</span>}
      <Link to={"/san-pham/" + p.id}>
        <div className="product-card-image">
          <Art type={p.category} image={p.image} name={p.name} />
        </div>
        <div className="category">{p.brand}</div>
        <h3>{p.name}</h3>
      </Link>
      <p className="variant">{p.variant}</p>
      {p.stock <= 0 && <span className="product-card-out-of-stock">Hết hàng</span>}
      <ProductFeedback product={p} />
      <div className="buy">
        <div>
          <span className="old-price" aria-hidden={!(Number(p.originalPrice) > Number(p.price))}>
            {Number(p.originalPrice) > Number(p.price) ? money(p.originalPrice) : "\u00a0"}
          </span>
          <div className="price">{money(p.price)}</div>
        </div>
        <Link to={"/san-pham/" + p.id}>Xem chi tiết</Link>
      </div>
    </article>
  );
}
