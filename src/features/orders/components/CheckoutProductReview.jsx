import { useState, useMemo } from "react";
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

const STORAGE_PC_SETS = "techzone_pc_build_sets";

export function CheckoutProductReview({ lines = [], products = [] }) {
  const [expandedSets, setExpandedSets] = useState({});

  // Đọc danh sách build sets từ localStorage làm fallback
  const pcBuildSets = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PC_SETS) || "[]");
    } catch {
      return [];
    }
  }, []);

  // Gom nhóm sản phẩm theo Set PC và Mua lẻ
  const { groupedSets, looseItems } = useMemo(() => {
    const sets = [];
    const claimedKeys = new Set();

    // 1. Nhóm theo pcCustomId từ Backend (nguồn chuẩn xác nhất)
    const pcGroupMap = new Map();
    for (const line of lines) {
      if (line.pcCustomId) {
        if (!pcGroupMap.has(line.pcCustomId)) {
          pcGroupMap.set(line.pcCustomId, []);
        }
        pcGroupMap.get(line.pcCustomId).push(line);
        claimedKeys.add(String(line.cartItemId ?? line.id));
      }
    }

    for (const [pcCustomId, items] of pcGroupMap.entries()) {
      const matchedLocal = pcBuildSets.find((s) => String(s.id) === String(pcCustomId));
      const { totalSetPrice, totalPieces } = items.reduce(
        (acc, item) => {
          const p = products.find((prod) => prod.id === item.id);
          const unitPrice = item.unitPrice ?? p?.price ?? 0;
          const qty = item.quantity || 1;
          return {
            totalSetPrice: acc.totalSetPrice + unitPrice * qty,
            totalPieces: acc.totalPieces + qty,
          };
        },
        { totalSetPrice: 0, totalPieces: 0 }
      );

      sets.push({
        setMeta: {
          id: pcCustomId,
          name: items[0]?.pcCustomName || matchedLocal?.name || `Bộ PC Lắp Ráp #${pcCustomId}`,
        },
        items,
        totalSetPrice,
        totalPieces,
      });
    }

    // 2. Fallback gom nhóm từ localStorage nếu có
    for (const buildSet of pcBuildSets) {
      if (sets.some((s) => String(s.setMeta.id) === String(buildSet.id))) continue;
      if (!Array.isArray(buildSet.itemVariantIds) || buildSet.itemVariantIds.length === 0) continue;

      const setVariants = new Set(buildSet.itemVariantIds.map(String));
      const matchingLines = lines.filter(
        (line) => !claimedKeys.has(String(line.cartItemId ?? line.id)) && setVariants.has(String(line.id))
      );

      if (matchingLines.length >= 2) {
        const { totalSetPrice, totalPieces } = matchingLines.reduce(
          (acc, item) => {
            const p = products.find((prod) => prod.id === item.id);
            const unitPrice = item.unitPrice ?? p?.price ?? 0;
            const qty = item.quantity || 1;
            return {
              totalSetPrice: acc.totalSetPrice + unitPrice * qty,
              totalPieces: acc.totalPieces + qty,
            };
          },
          { totalSetPrice: 0, totalPieces: 0 }
        );

        sets.push({
          setMeta: buildSet,
          items: matchingLines,
          totalSetPrice,
          totalPieces,
        });
        matchingLines.forEach((l) => claimedKeys.add(String(l.cartItemId ?? l.id)));
      }
    }

    // 3. Toàn bộ các dòng còn lại là hàng mua lẻ
    const loose = lines.filter((line) => !claimedKeys.has(String(line.cartItemId ?? line.id)));

    return { groupedSets: sets, looseItems: loose };
  }, [lines, products, pcBuildSets]);

  const toggleExpand = (setId) => {
    setExpandedSets((prev) => ({
      ...prev,
      [setId]: prev[setId] === undefined ? false : !prev[setId],
    }));
  };

  return (
    <div className="checkout-product-review stack gap16">
      {/* 1. Các bộ PC lắp ráp */}
      {groupedSets.map(({ setMeta, items, totalSetPrice, totalPieces }) => {
        const setId = String(setMeta.id);
        const isExpanded = expandedSets[setId] !== false; // Mặc định mở để khách dễ kiểm tra

        return (
          <div className="cart-pc-set-card checkout-pc-set-card" key={setId}>
            {/* Set Header */}
            <div className="cart-pc-set-header">
              <div className="cart-pc-set-top-row">
                <div className="cart-pc-set-title-group">
                  <div className="cart-pc-set-meta">
                    <div className="cart-pc-set-badges">
                      <span className="badge-set-tag">BỘ PC LẮP RÁP</span>
                      <span className="badge-set-id">Set #{setId.slice(-4)}</span>
                      <span className="badge-set-compat">
                        <span className="badge-dot" /> {items.length} loại ({totalPieces} món linh kiện)
                      </span>
                    </div>
                    <h3 className="cart-pc-set-name">{setMeta.name || "Dàn PC Gaming & Đồ Họa Pro"}</h3>
                    <p className="cart-pc-set-perk">
                      <Icon name="check" style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0 }} />
                      <span>Miễn phí công lắp ráp, đi dây giấu nguồn & kiểm tra ổn định 24h</span>
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
                  onClick={() => toggleExpand(setId)}
                  aria-expanded={isExpanded}
                >
                  <span className={`accordion-arrow ${isExpanded ? "open" : ""}`}>▾</span>
                  <span>
                    {isExpanded
                      ? `Thu gọn danh sách linh kiện (${items.length} loại • ${totalPieces} món)`
                      : `Xem chi tiết linh kiện trong bộ (${items.length} loại • ${totalPieces} món)`}
                  </span>
                </button>
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
                              target="_blank"
                              rel="noopener noreferrer"
                              title={item.name || p?.name}
                            >
                              {item.name || p?.name || "Linh kiện PC"}
                            </Link>
                            <p className="cart-row-variant">{item.variant || p?.variant || "Chính hãng • Mới 100%"}</p>
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
                    * Linh kiện được bảo hành chính hãng theo từng serial khi bàn giao trọn bộ máy.
                  </div>
                  <div className="foot-total">
                    <span className="foot-total-label">Tổng trọn bộ ({totalPieces} món):</span>
                    <span className="foot-total-value">{money(totalSetPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 2. Sản phẩm & Phụ kiện mua lẻ */}
      {looseItems.length > 0 && (
        <div className="checkout-loose-section">
          {groupedSets.length > 0 && (
            <div className="checkout-loose-header">
              <span className="checkout-loose-tag">Phụ kiện & Mua lẻ</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>
                ({looseItems.length} sản phẩm)
              </span>
            </div>
          )}

          <div className="checkout-loose-list">
            <div className="cart-pc-set-table-head" style={{ background: "#f8fafc" }}>
              <div className="th-col th-item">Sản phẩm mua lẻ</div>
              <div className="th-col th-unit-price">Đơn giá</div>
              <div className="th-col th-qty">Số lượng</div>
              <div className="th-col th-subtotal">Thành tiền</div>
            </div>

            <div className="cart-pc-set-rows">
              {looseItems.map((l) => {
                const p = products.find((prod) => prod.id === l.id);
                const unitPrice = l.unitPrice ?? p?.price ?? 0;
                const quantity = l.quantity || 1;
                const lineTotal = unitPrice * quantity;

                return (
                  <div className="cart-pc-set-row" key={l.cartItemId ?? l.id}>
                    <div className="cart-col-item">
                      <Art
                        type={p?.category}
                        image={l.image || p?.image}
                        name={l.name || p?.name}
                        className="cart-row-thumb"
                      />
                      <div className="cart-row-details">
                        <Link
                          to={"/san-pham/" + l.id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cart-row-name"
                          title={l.name || p?.name}
                        >
                          {l.name || p?.name || "Không tìm thấy sản phẩm"}
                        </Link>
                        <p className="cart-row-variant">{l.variant || p?.variant || "Tiêu chuẩn"}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}
