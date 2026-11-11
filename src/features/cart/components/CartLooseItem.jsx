import { Link } from "react-router-dom";
import { money } from "@/utils";
import { Art } from "@/components/ui";
import { Quantity } from "@/components/form";

export function CartLooseItem({
  item,
  product,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRequestDelete,
  disabled = false,
}) {
  const p = product;
  const unitPrice = item.unitPrice ?? p?.price ?? 0;
  const subtotal = unitPrice * item.quantity;
  const isOutOfStock = item.available === false || (item.stock === 0 && !p?.stock);

  return (
    <div className={`cart-loose-item ${!isSelected ? "unselected" : ""}`}>
      {/* Checkbox */}
      <div className="cart-loose-item-checkbox">
        <input
          type="checkbox"
          className="cart-checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(item.cartItemId ?? item.id, e.target.checked)}
          disabled={disabled || isOutOfStock}
        />
      </div>

      {/* Product Image */}
      <Art
        type={p?.category}
        image={item.image || p?.image}
        name={item.name || p?.name}
        className="cart-loose-item-thumb"
      />

      {/* Info */}
      <div className="cart-loose-item-info">
        <div className="cart-loose-item-meta">
          <span className="cart-stock-status">
            {isOutOfStock ? (
              <span className="stock-badge out">Ngừng bán / Hết hàng</span>
            ) : (
              <span className="stock-badge in">Còn hàng</span>
            )}
          </span>
        </div>

        <Link to={`/san-pham/${item.id}`} className="cart-loose-item-title">
          {item.name || p?.name || "Không tìm thấy sản phẩm"}
        </Link>
        <p className="cart-loose-item-variant">{item.variant || p?.variant || "Tiêu chuẩn"}</p>

        <div className="cart-loose-item-unit-price">
          Đơn giá: <strong>{money(unitPrice)}</strong>
        </div>
      </div>

      {/* Quantity Stepper */}
      <div className="cart-loose-item-stepper">
        <fieldset
          disabled={disabled || isOutOfStock}
          style={{ border: 0, padding: 0, margin: 0 }}
        >
          <Quantity
            label={`Số lượng ${item.name || p?.name}`}
            value={item.quantity}
            max={Math.max(1, item.stock ?? p?.stock ?? 99)}
            onChange={(q) => onUpdateQuantity(item.cartItemId ?? item.id, q)}
          />
        </fieldset>
      </div>

      {/* Subtotal & Delete */}
      <div className="cart-loose-item-actions">
        <div className="cart-loose-item-subtotal">{money(subtotal)}</div>
        <button
          type="button"
          className="cart-btn-remove"
          onClick={() => onRequestDelete(item)}
          disabled={disabled}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
