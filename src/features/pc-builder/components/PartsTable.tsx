import { Badge } from "@/components/ui";
import { money } from "@/utils";
import { slotLabel, slotRows } from "../domain/buildLines";
import type { BuildItem } from "../types/pcBuilder.types";

interface PartsTableProps {
  items: BuildItem[];
  verdict: { label: string; tone: string };
  disabled?: boolean;
  onReplace: (category: string, index: number) => void;
  onChangeQty: (index: number, qty: number) => void;
}

const ReplaceIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

/** Bảng linh kiện theo thứ tự slot; ô số lượng khóa theo maxQty server trả. */
export function PartsTable({ items, verdict, disabled = false, onReplace, onChangeQty }: PartsTableProps) {
  const rows = slotRows(items);

  return (
    <div className="builder-panel">
      <div className="panel-head">
        <div className="panel-head-title">
          <h2>Cấu hình linh kiện đề xuất</h2>
          <p>{items.length} linh kiện · giá lấy từ kho hiện tại</p>
        </div>
        <Badge tone={verdict.tone}>{verdict.label}</Badge>
      </div>

      <div className="table-container">
        <table className="builder-table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Linh kiện</th>
              <th>Sản phẩm</th>
              <th style={{ width: 110, textAlign: "center" }}>SL</th>
              <th style={{ width: 130, textAlign: "right" }}>Đơn giá</th>
              <th style={{ width: 140, textAlign: "right" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody className="pc-parts">
            {rows.map(({ category, index, item }) => {
              const label = slotLabel(category);
              return (
                <tr key={item ? `${category}-${index}` : `${category}-empty`} className={item ? undefined : "slot-empty"}>
                  <td>
                    <span className="part-role-badge">{label}</span>
                  </td>
                  <td>
                    <div className="part-details">
                      <span className="part-name">{item ? item.name : "Chưa chọn"}</span>
                      <div>
                        <button
                          type="button"
                          className="btn-replace-part"
                          disabled={disabled}
                          aria-label={`${item ? "Đổi" : "Chọn"} ${label}`}
                          onClick={() => onReplace(category, index)}
                        >
                          <ReplaceIcon />
                          {item ? "Đổi linh kiện" : "Chọn linh kiện"}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {!item ? (
                      "—"
                    ) : item.maxQty > 1 ? (
                      <div className="qty-control">
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`Giảm số lượng ${label}`}
                          disabled={disabled || item.qty <= 1}
                          onClick={() => onChangeQty(index, item.qty - 1)}
                        >
                          -
                        </button>
                        <span className="qty-val" aria-label={`Số lượng ${label}`}>
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`Tăng số lượng ${label}`}
                          disabled={disabled || item.qty >= item.maxQty}
                          title={item.qty >= item.maxQty ? `Tối đa ${item.maxQty} với cấu hình hiện tại` : undefined}
                          onClick={() => onChangeQty(index, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <strong style={{ color: "var(--ink, #152237)", fontSize: 14 }}>{item.qty}</strong>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }} className="price-cell">
                    {item ? money(item.price) : ""}
                  </td>
                  <td style={{ textAlign: "right" }} className="subtotal-cell">
                    {item ? money(item.price * item.qty) : ""}
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
