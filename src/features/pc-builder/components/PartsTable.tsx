import { Badge } from "@/components/ui";
import { money } from "@/utils";
import { visibleSpecs } from "../domain/buildLines";
import { PeripheralRows, type PeripheralRowsProps } from "./PeripheralPanel";
import type { BuildCapacity, BuildPart, ComponentRole } from "../types/pcBuilder.types";

const MAX_LINE_QUANTITY = 8; // /validate nhận quantity 1–8 (DD 9.2)

/** Nút ± chỉ ở ram, ssd, gpu; cpu chỉ khi bo mạch có 2 socket (DD 10.3). */
export function quantityLimit(
  part: BuildPart,
  parts: BuildPart[],
  capacity?: BuildCapacity | null,
): { adjustable: boolean; canAdd: boolean } {
  const board = parts.find((p) => p.role === "mainboard");
  const dualSocket = board?.specs?.CPU_Socket_Count === "2";
  const adjustable = ["ram", "ssd", "gpu"].includes(part.role) || (part.role === "cpu" && dualSocket);
  if (!adjustable) return { adjustable, canAdd: false };
  const full =
    part.quantity >= MAX_LINE_QUANTITY ||
    (part.role === "cpu" && part.quantity >= 2) ||
    (part.role === "ram" && !!capacity?.ramSlotsMax && capacity.ramSlotsUsed >= capacity.ramSlotsMax) ||
    (part.role === "gpu" && !!capacity?.gpuMax && capacity.gpuCount >= capacity.gpuMax);
  return { adjustable, canAdd: !full };
}

interface PartsTableProps {
  parts: BuildPart[];
  capacity?: BuildCapacity | null;
  verdict?: { label: string; tone: string };
  onReplacePart: (role: ComponentRole, index: number) => void;
  onUpdateQuantity: (role: ComponentRole, delta: number, index: number) => void;
  // Chế độ Trọn bộ: màn, phím, chuột hiện thành nhóm cuối bảng
  peripherals?: PeripheralRowsProps;
}

export function PartsTable({
  parts,
  capacity,
  verdict,
  onReplacePart,
  onUpdateQuantity,
  peripherals,
}: PartsTableProps) {
  const peripheralCount =
    peripherals?.status === "ready" ? Object.values(peripherals.selection).filter(Boolean).length : 0;

  return (
    <div className="builder-panel">
      <div className="panel-head">
        <div className="panel-head-title">
          <h2>Cấu hình linh kiện đề xuất</h2>
          <p>
            <span>
              {parts.length} nhóm linh kiện
              {peripheralCount > 0 && ` · ${peripheralCount} phụ kiện đi kèm`}
            </span>
            {capacity && capacity.ramSlotsMax > 0 && (
              <span className="capacity-line">
                {" "}
                · RAM {capacity.ramSlotsUsed}/{capacity.ramSlotsMax} khe ({capacity.ramGb}/{capacity.ramMaxGb} GB)
                · M.2 {capacity.m2Used}/{capacity.m2Max}
                · GPU {capacity.gpuCount}/{capacity.gpuMax}
              </span>
            )}
          </p>
        </div>
        {verdict && <Badge tone={verdict.tone}>{verdict.label}</Badge>}
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
          <tbody className="pc-parts">
            {parts.map((item, index) => {
              const lineTotal = item.unitPrice * item.quantity;
              const { adjustable: isAdjustable, canAdd } = quantityLimit(item, parts, capacity);

              return (
                <tr key={`${item.role}-${index}`}>
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
                          {visibleSpecs(item.specs).map(([k, v]) => (
                            <span key={k} className="spec-mini-chip">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        <div>
                          <button
                            type="button"
                            className="btn-replace-part"
                            onClick={() => onReplacePart(item.role, index)}
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
                          disabled={item.quantity <= 1}
                          onClick={() => onUpdateQuantity(item.role, -1, index)}
                        >
                          -
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          aria-label={`Tăng số lượng ${item.role}`}
                          disabled={!canAdd}
                          title={canAdd ? undefined : "Đã đạt giới hạn của bo mạch chủ"}
                          onClick={() => onUpdateQuantity(item.role, 1, index)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <strong
                        style={{ color: "var(--ink, #152237)", fontSize: 14 }}
                      >
                        {item.quantity}
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
          {peripherals && <PeripheralRows {...peripherals} />}
        </table>
      </div>
    </div>
  );
}
