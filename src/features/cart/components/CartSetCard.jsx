import { useState } from "react";
import { Link } from "react-router-dom";
import { money } from "@/utils";
import { Art, Icon } from "@/components/ui";

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
  const [isExpanded, setIsExpanded] = useState(true);

  // Tính tổng tiền & tổng số lượng món vật lý
  const { totalSetPrice, totalPieceCount } = items.reduce(
    (acc, item) => {
      const p = products.find((prod) => prod.id === item.id);
      const unitPrice = item.unitPrice ?? p?.price ?? 0;
      const qty = item.quantity || 1;
      return {
        totalSetPrice: acc.totalSetPrice + unitPrice * qty,
        totalPieceCount: acc.totalPieceCount + qty,
      };
    },
    { totalSetPrice: 0, totalPieceCount: 0 }
  );

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
              aria-label={`Chọn toàn bộ dàn máy ${set.name || ""}`}
            />
            <div className="cart-pc-set-meta">
              <div className="cart-pc-set-badges">
                <span className="badge-set-tag">BỘ PC LẮP RÁP</span>
                <span className="badge-set-id">Set #{set.id?.toString().slice(-4)}</span>
                <span className="badge-set-compat">
                  <span className="badge-dot" /> {items.length} loại ({totalPieceCount} món linh kiện)
                </span>
              </div>
              <h3 className="cart-pc-set-name">{set.name || "Dàn PC Gaming & Đồ Họa Pro"}</h3>
              <p className="cart-pc-set-perk">
                <Icon name="check" style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0 }} />
                <span>Miễn phí lắp ráp chuyên nghiệp, đi dây giấu nguồn & cài đặt OS</span>
              </p>
            </div>
          </div>

          <div className="cart-pc-set-price-box">
            <div className="cart-pc-set-qty-badge">Số lượng: 1 bộ máy</div>
            <span className="cart-pc-set-price-label">Giá trọn bộ máy:</span>
            <span className="cart-pc-set-price-value">{money(totalSetPrice)}</span>
            <span className="cart-pc-set-price-sub">Đã gồm VAT & Công lắp</span>
          </div>
        </div>

        {/* Set Toolbar */}
        <div className="cart-pc-set-toolbar">
          <button
            type="button"
            className="cart-pc-set-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>▾</span>
            <span>
              {isExpanded
                ? `Thu gọn danh sách linh kiện (${items.length} loại • ${totalPieceCount} món)`
                : `Xem chi tiết linh kiện trong bộ (${items.length} loại • ${totalPieceCount} món)`}
            </span>
          </button>

          <div className="cart-pc-set-actions">
            <button
              type="button"
              className="cart-pc-set-btn-action"
              onClick={() => onEditInBuilder(set)}
              title="Chỉnh sửa cấu hình trong PC Builder"
            >
              <Icon name="edit" style={{ width: 13, height: 13 }} />
              <span>Chỉnh sửa cấu hình</span>
            </button>
            <button
              type="button"
              className="cart-pc-set-btn-action"
              onClick={() => onRequestUngroupSet(set, items)}
              title="Tách các linh kiện trong bộ ra thành sản phẩm mua lẻ"
            >
              <Icon name="layers" style={{ width: 13, height: 13 }} />
              <span>Tách ra mua lẻ</span>
            </button>
            <button
              type="button"
              className="cart-pc-set-btn-action danger"
              onClick={() => onRequestDeleteSet(set, items)}
              title="Xóa toàn bộ linh kiện của bộ PC này"
            >
              <Icon name="trash" style={{ width: 13, height: 13 }} />
              <span>Xóa cả bộ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accordion List of Components */}
      {isExpanded && (
        <div className="cart-pc-set-body">
          {/* Table Header Row */}
          <div className="cart-pc-set-table-head">
            <div className="th-col th-item">Linh kiện & Thiết bị</div>
            <div className="th-col th-unit-price">Đơn giá</div>
            <div className="th-col th-qty">Số lượng</div>
            <div className="th-col th-subtotal">Thành tiền</div>
          </div>

          {/* Component Rows */}
          <div className="cart-pc-set-rows">
            {items.map((item) => {
              const p = products.find((prod) => prod.id === item.id);
              const role = p?.category || "pc";
              const roleLabel = ROLE_LABELS[role] || "LK";
              const unitPrice = item.unitPrice ?? p?.price ?? 0;
              const quantity = item.quantity || 1;
              const lineTotal = unitPrice * quantity;

              return (
                <div key={item.cartItemId ?? item.id} className="cart-pc-set-row">
                  <div className="cart-col-item">
                    <span className="cart-role-badge">{roleLabel}</span>
                    <Art
                      type={role}
                      image={item.image || p?.image}
                      name={item.name || p?.name}
                      className="cart-row-thumb"
                    />
                    <div className="cart-row-details">
                      <Link
                        to={`/san-pham/${item.id}`}
                        className="cart-row-name"
                        title={item.name || p?.name}
                      >
                        {item.name || p?.name || "Linh kiện PC"}
                      </Link>
                      <p className="cart-row-variant">
                        {item.variant || p?.variant || "Chính hãng • Bảo hành đầy đủ"}
                      </p>
                    </div>
                  </div>

                  <div className="cart-col-unit-price" data-label="Đơn giá">
                    {money(unitPrice)}
                  </div>

                  <div className="cart-col-qty" data-label="Số lượng">
                    <span className="qty-pill">× {quantity}</span>
                  </div>

                  <div className="cart-col-subtotal" data-label="Thành tiền">
                    {money(lineTotal)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Summary Footer */}
          <div className="cart-pc-set-table-foot">
            <div className="foot-note">
              * Giá từng linh kiện đã gồm VAT và cam kết 100% linh kiện mới chính hãng.
            </div>
            <div className="foot-total">
              <span className="foot-total-label">Tổng cộng ({totalPieceCount} món):</span>
              <span className="foot-total-value">{money(totalSetPrice)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
