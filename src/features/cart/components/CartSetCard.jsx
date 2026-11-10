import { useState } from "react";
import { Link } from "react-router-dom";
import { money } from "@/utils";
import { Art } from "@/components/ui";

const ROLE_LABELS = {
  cpu: "CPU",
  mainboard: "MAIN",
  ram: "RAM",
  gpu: "VGA",
  ssd: "SSD",
  psu: "NGUỒN",
  case: "CASE",
  cooler: "TẢN",
  monitor: "MÀN",
};

export function CartSetCard({
  set,
  items,
  products = [],
  selectedIds,
  onToggleSet,
  onEditInBuilder,
  onRequestUngroupSet,
  onRequestDeleteSet,
  disabled = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalSetPrice = items.reduce((sum, item) => {
    const p = products.find((prod) => prod.id === item.id);
    const unitPrice = item.unitPrice ?? p?.price ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(String(i.cartItemId ?? i.id)));
  const someSelected = items.some((i) => selectedIds.has(String(i.cartItemId ?? i.id))) && !allSelected;

  return (
    <div className="cart-pc-set-card">
      {/* Set Header */}
      <div className="cart-pc-set-header">
        <div className="cart-pc-set-top-row">
          <div className="cart-pc-set-title-group">
            <input
              type="checkbox"
              className="cart-checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onToggleSet(set.id, e.target.checked)}
              disabled={disabled}
            />
            <div>
              <div className="cart-pc-set-badges">
                <span className="badge-set-tag">Bộ PC Lắp Ráp</span>
                <span className="badge-set-id">Set #{set.id?.toString().slice(-4)}</span>
                <span className="badge-set-compat">
                  <span className="badge-dot"></span> {items.length} Linh kiện tương thích
                </span>
              </div>
              <h3 className="cart-pc-set-name">{set.name || "Dàn PC Gaming & Đồ Họa Pro"}</h3>
              <p className="cart-pc-set-perk">
                Miễn phí công lắp ráp, đi dây giấu nguồn & cài đặt hệ điều hành
              </p>
            </div>
          </div>

          <div className="cart-pc-set-price-box">
            <span className="cart-pc-set-price-label">Giá trọn bộ máy:</span>
            <span className="cart-pc-set-price-value">{money(totalSetPrice)}</span>
          </div>
        </div>

        {/* Set Toolbar */}
        <div className="cart-pc-set-toolbar">
          <button
            type="button"
            className="cart-pc-set-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>▾</span>
            {isExpanded
              ? `Thu gọn danh sách (${items.length} linh kiện)`
              : `Xem chi tiết linh kiện trong bộ (${items.length} linh kiện)`}
          </button>

          <div className="cart-pc-set-actions">
            <button
              type="button"
              className="cart-pc-set-btn-action"
              onClick={() => onEditInBuilder(set)}
            >
              Chỉnh sửa trong PC Builder
            </button>
            <span className="action-divider">•</span>
            <button
              type="button"
              className="cart-pc-set-btn-action"
              onClick={() => onRequestUngroupSet(set, items)}
            >
              Tách ra mua lẻ
            </button>
            <span className="action-divider">•</span>
            <button
              type="button"
              className="cart-pc-set-btn-action danger"
              onClick={() => onRequestDeleteSet(set, items)}
            >
              Xóa cả bộ
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List of Components */}
      {isExpanded && (
        <div className="cart-pc-set-body">
          {items.map((item) => {
            const p = products.find((prod) => prod.id === item.id);
            const role = p?.category || "pc";
            const roleLabel = ROLE_LABELS[role] || "LK";
            const unitPrice = item.unitPrice ?? p?.price ?? 0;

            return (
              <div key={item.id} className="cart-pc-set-row">
                <span className="cart-role-badge">{roleLabel}</span>

                <Art
                  type={role}
                  image={item.image || p?.image}
                  name={item.name || p?.name}
                  className="cart-row-thumb"
                />

                <div className="cart-row-details">
                  <Link to={`/san-pham/${item.id}`} className="cart-row-name">
                    {item.name || p?.name || "Linh kiện PC"}
                  </Link>
                  <p className="cart-row-variant">{item.variant || p?.variant || "Chính hãng"}</p>
                </div>

                <div className="cart-row-qty">SL: {item.quantity}</div>
                <div className="cart-row-price">{money(unitPrice * item.quantity)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
