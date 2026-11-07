import { Badge, Modal } from "@/components/ui";
import { money } from "@/utils";
import { slotLabel } from "../domain/buildLines";
import type { BuildItem, ReplacementOption } from "../types/pcBuilder.types";

interface ReplacePartModalProps {
  category: string;
  /** Món đang ở dòng này; null khi thêm cho slot trống. */
  current: BuildItem | null;
  options: ReplacementOption[];
  isLoading: boolean;
  error: string | null;
  onSelect: (option: ReplacementOption) => void;
  onClose: () => void;
}

/** Dropdown đổi món (bước 9): server chỉ trả món còn hàng và không gây xung đột mới. */
export function ReplacePartModal({ category, current, options, isLoading, error, onSelect, onClose }: ReplacePartModalProps) {
  const currentTotal = current ? current.price * current.qty : 0;

  return (
    <Modal title={`${current ? "Đổi" : "Chọn"} ${slotLabel(category)}`} onClose={onClose} className="wide replace-modal">
      <p className="replace-intro">
        Chỉ hiện linh kiện còn hàng và tương thích với các linh kiện còn lại trong cấu hình.
      </p>
      {isLoading ? (
        <div className="replace-state" role="status">
          <div className="loading-spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div>Đang tải linh kiện tương thích từ kho...</div>
        </div>
      ) : error ? (
        <div className="replace-state" role="alert">
          Không tải được danh sách linh kiện: {error}
        </div>
      ) : options.length === 0 ? (
        <div className="replace-state">Chưa có linh kiện nào khác tương thích cho mục này.</div>
      ) : (
        options.map((option) => {
          const delta = option.price * option.qty - currentTotal;
          return (
            <div key={option.id} className={`replacement-item ${option.current ? "current-selected" : ""}`}>
              <div className="item-meta">
                <div className="item-header-row">
                  <strong>{option.name}</strong>
                  {option.current && <Badge tone="success">Đang chọn</Badge>}
                </div>
                <div className="item-variant-desc">
                  {option.brand ? `${option.brand} · ` : ""}SL {option.qty}
                  {option.maxQty > 1 ? ` (tối đa ${option.maxQty})` : ""}
                </div>
                <div className="item-price">
                  {money(option.price)}
                  {!option.current && current && delta !== 0 && (
                    <span className={`replacement-delta ${delta > 0 ? "up" : "down"}`}>
                      {delta > 0 ? "+" : "−"}
                      {money(Math.abs(delta))}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <button
                  type="button"
                  className={`btn-select-part ${option.current ? "disabled" : "primary"}`}
                  disabled={option.current}
                  onClick={() => onSelect(option)}
                >
                  {option.current ? "Đang dùng" : "Chọn linh kiện"}
                </button>
              </div>
            </div>
          );
        })
      )}
    </Modal>
  );
}
