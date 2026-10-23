import { money } from "@/utils";
import type { BuildPart, ComponentRole } from "../types/pcBuilder.types";

interface PartsTableProps {
  parts: BuildPart[];
  onReplacePart: (role: ComponentRole) => void;
  onUpdateQuantity: (role: ComponentRole, delta: number) => void;
}

export function PartsTable({
  parts,
  onReplacePart,
  onUpdateQuantity,
}: PartsTableProps) {
  return (
    <div className="builder-panel">
      <div className="panel-head">
        <div className="panel-head-title">
          <h2>Cấu hình linh kiện đề xuất</h2>
          <p>
            <span>{parts.length} nhóm linh kiện</span> · Tất cả đều có sẵn hàng
            tại showroom
          </p>
        </div>
        <div className="badge-compat-all">
          <span>✓ Đạt chuẩn tương thích 100%</span>
        </div>
      </div>

      <div className="table-container">
        <table className="builder-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Linh kiện</th>
              <th>Sản phẩm & Biến thể</th>
              <th style={{ width: 100, textAlign: "center" }}>SL</th>
              <th style={{ width: 130, textAlign: "right" }}>Đơn giá</th>
              <th style={{ width: 140, textAlign: "right" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((item) => {
              const lineTotal = item.unitPrice * item.quantity;
              const isAdjustable = item.role === "ram" || item.role === "ssd";

              return (
                <tr key={item.role}>
                  <td>
                    <span className="part-role-badge">{item.role}</span>
                  </td>
                  <td>
                    <div className="part-info-col">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="part-thumb"
                        loading="lazy"
                      />
                      <div className="part-details">
                        <span className="part-name">{item.productName}</span>
                        <span className="part-variant">{item.variantName}</span>
                        <div className="part-specs-chips">
                          {Object.entries(item.specs).map(([k, v]) => (
                            <span key={k} className="spec-mini-chip">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn-replace-part"
                            onClick={() => onReplacePart(item.role)}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                              <path d="M16 21h5v-5" />
                            </svg>
                            Đổi linh kiện
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {isAdjustable ? (
                      <div className="qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`Giảm số lượng ${item.role}`}
                          onClick={() => onUpdateQuantity(item.role, -1)}
                        >
                          -
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`Tăng số lượng ${item.role}`}
                          onClick={() => onUpdateQuantity(item.role, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <strong
                        style={{ color: "var(--ink, #152237)", fontSize: 14 }}
                      >
                        1
                      </strong>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }} className="price-cell">
                    {money(item.unitPrice)}
                  </td>
                  <td style={{ textAlign: "right" }} className="subtotal-cell">
                    {money(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
