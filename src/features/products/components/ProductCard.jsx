import { Link } from "react-router-dom";
import { Art } from "@/components/ui";
import { money } from "@/utils";
import { ProductFeedback } from "./ProductFeedback";

export function ProductCard({ product: p }) {
  return (
    <article className="product-card">
      <Link to={"/san-pham/" + p.id}>
        <Art type={p.category} image={p.image} name={p.name} />
        <div className="category">{p.brand}</div>
        <h3>{p.name}</h3>
      </Link>
      <p className="variant">{p.variant}</p>
      <ProductFeedback product={p} />
      <div className="chips">
        {Object.values(p.specs)
          .slice(0, 3)
          .map((s, i) => (
            <span className="chip" key={i}>
              {s}
            </span>
          ))}
      </div>
      <p className="stock">
        {p.stock > 0 ? "● Còn hàng" : "Hết hàng"} · Bảo hành {p.warranty} tháng
      </p>
      <div className="buy">
        <div>
          <span className="old-price">{money(p.originalPrice)}</span>
          <div className="price">{money(p.price)}</div>
        </div>
        <Link to={"/san-pham/" + p.id}>Xem chi tiết</Link>
      </div>
    </article>
  );
}
