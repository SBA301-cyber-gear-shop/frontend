import { Link } from "react-router-dom";
import { categories } from "../constants";
import { money } from "@/utils";
import {
  Art,
  Badge,
  Button,
  Empty,
  Icon,
  Notice,
  Panel,
} from "@/components/ui";
import { Quantity } from "@/components/form";
import { useProductDetails } from "../hooks/useProductDetails";
import { ProductFeedback } from "./ProductFeedback";
import { ReviewMediaGallery } from "@/features/reviews";
import { ramCapacity } from "../domain/ramCapacity";
import "./ProductDetails.css";

export function ProductDetails({ addCart }) {
  const {
    id,
    navigate,
    quantity,
    setQuantity,
    tab,
    setTab,
    p,
    variants,
    reviews,
    catalogLoading,
    catalogError,
    reviewError,
  } = useProductDetails();
  if (catalogLoading || catalogError) return null;
  if (!p || p.status !== "active")
    return (
      <Empty
        title="Sản phẩm không còn khả dụng"
        action={<Button to="/san-pham">Xem sản phẩm khác</Button>}
      />
    );
  const capacity = p.category === "ram" ? ramCapacity(p) : null;
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
        <div className="product-purchase">
          <div className="eyebrow">
            {p.brand} / {p.category}
          </div>
          <h1>{p.name}</h1>
          <ProductFeedback product={p} />
          <p className="small muted section">
            SKU: <span className="mono">{p.sku}</span>
          </p>
          <div className="row section">
            <div className="price">{money(p.price)}</div>
            {Number(p.originalPrice) > Number(p.price) && <span className="old-price">{money(p.originalPrice)}</span>}
          </div>
          <p className={`product-availability ${p.stock > 0 ? "in-stock" : "out-of-stock"}`}>
            {p.stock > 0 ? "● Còn " + p.stock + " sản phẩm" : "Hết hàng"}
          </p>
          {variants.length > 1 && <div className="product-purchase-section">
            <b className="product-purchase-label">Chọn phiên bản</b>
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
          </div>}
          <div className="product-purchase-section">
            <b className="product-purchase-label">Số lượng</b>
            <div className="row product-quantity-row">
            <Quantity
              value={quantity}
              onChange={setQuantity}
              max={p.stock || 1}
            />
            {p.category === "ram" && (
              <span className="small">
                {capacity ? <>{quantity} sản phẩm × {capacity}GB = <b>{quantity * capacity}GB</b></> : "Chưa có thông tin dung lượng RAM"}
              </span>
            )}
            </div>
          </div>
          <div className="row wrap-row product-purchase-actions">
            <Button disabled={!p.stock} onClick={() => addCart(p.id, quantity)}>
              <Icon name="cart" />
              Thêm vào giỏ
            </Button>
            <Button
              disabled={!p.stock}
              tone="secondary"
              onClick={async () => {
                if (await addCart(p.id, quantity)) navigate("/gio-hang");
              }}
            >
              Mua ngay →
            </Button>
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
          {tab === "reviews" && reviewError && (
            <Notice tone="danger">
              Không tải được đánh giá: {reviewError}
            </Notice>
          )}
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
                <ReviewMediaGallery reviewId={r.id} media={r.media} />
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
