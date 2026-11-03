import { money } from "@/utils";
import type {
  PeripheralItem,
  PeripheralRole,
  PeripheralRoleEntry,
  PeripheralSelection,
  PeripheralStatus,
  PeripheralSuggestionResponse,
} from "../types/pcBuilder.types";

const COLUMNS = 5; // khớp số cột của bảng linh kiện: Linh kiện, Sản phẩm, SL, Đơn giá, Thành tiền

export interface PeripheralRowsProps {
  status: PeripheralStatus;
  suggestion: PeripheralSuggestionResponse | null;
  selection: PeripheralSelection;
  error?: string | null;
  isBusy?: boolean;
  onSelect: (role: PeripheralRole, item: PeripheralItem | null) => void;
  onRetry: () => void;
}

function PeripheralRow({
  entry,
  selected,
  disabled,
  onSelect,
}: {
  entry: PeripheralRoleEntry;
  selected: PeripheralItem | null | undefined;
  disabled: boolean;
  onSelect: PeripheralRowsProps["onSelect"];
}) {
  const shown = selected ?? entry.picked;
  const included = Boolean(selected);

  return (
    <tr className={`peripheral-row${included ? "" : " excluded"}`} data-role={entry.role}>
      <td>
        <label className="peripheral-role-cell">
          <input
            type="checkbox"
            className="peripheral-check"
            checked={included}
            disabled={disabled}
            aria-label={`Mua kèm ${entry.label.toLowerCase()}`}
            onChange={(e) => onSelect(entry.role, e.target.checked ? shown : null)}
          />
          <span className="part-role-badge">{entry.label}</span>
        </label>
      </td>
      <td>
        <div className="part-info-col">
          <img src={shown.imageUrl || "/placeholder-pc.svg"} alt={shown.productName} className="part-thumb" loading="lazy" />
          <div className="part-details">
            <span className="part-name">{shown.productName}</span>
            {shown.highlights.length > 0 && <span className="peripheral-specs">{shown.highlights.join(" · ")}</span>}
            {selected?.reason && <span className="peripheral-reason">{selected.reason}</span>}
            <select
              className="peripheral-select"
              aria-label={`Đổi ${entry.label.toLowerCase()}`}
              value={shown.variantId}
              disabled={disabled || !included}
              onChange={(e) => {
                const next = entry.options.find((option) => String(option.variantId) === e.target.value);
                if (next) onSelect(entry.role, next.variantId === entry.picked.variantId ? entry.picked : next);
              }}
            >
              {entry.options.map((option) => (
                <option key={option.variantId} value={option.variantId}>
                  {option.productName} ({money(option.price)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </td>
      <td style={{ textAlign: "center" }}>
        <strong style={{ color: "var(--ink, #152237)", fontSize: 14 }}>{included ? 1 : "—"}</strong>
      </td>
      <td style={{ textAlign: "right" }} className="price-cell">
        {money(shown.price)}
      </td>
      <td style={{ textAlign: "right" }} className="subtotal-cell peripheral-price">
        {included ? money(shown.price) : "Không mua"}
      </td>
    </tr>
  );
}

/** Nhóm màn, phím, chuột ở cuối bảng linh kiện: chung bảng để dễ nhìn, nhưng dữ liệu tách khỏi buildParts. */
export function PeripheralRows({ status, suggestion, selection, error, isBusy = false, onSelect, onRetry }: PeripheralRowsProps) {
  return (
    <tbody className="peripheral-group" id="peripheralPanel" aria-busy={status === "loading"}>
      <tr className="peripheral-group-head">
        <td colSpan={COLUMNS}>
          <strong>Phụ kiện đi kèm (không cần lắp ráp)</strong>
          <span>Màn hình, bàn phím, chuột chọn theo ngân sách còn lại và nhu cầu; bạn có thể đổi hoặc bỏ từng món.</span>
        </td>
      </tr>

      {status === "loading" && (
        <tr>
          <td colSpan={COLUMNS} className="peripheral-note" role="status">
            Đang chọn màn hình, bàn phím, chuột…
          </td>
        </tr>
      )}

      {status === "error" && (
        <tr>
          <td colSpan={COLUMNS}>
            <div className="peripheral-error" role="alert">
              <p>
                Chưa gợi ý được màn hình, bàn phím, chuột{error ? `: ${error}` : ""}. Thùng máy vẫn mua được bình thường.
              </p>
              <button type="button" className="btn-ai-retry" onClick={onRetry} disabled={isBusy}>
                <span>Thử lại</span>
              </button>
            </div>
          </td>
        </tr>
      )}

      {status === "ready" &&
        suggestion?.roles.map((entry) => (
          <PeripheralRow key={entry.role} entry={entry} selected={selection[entry.role]} disabled={isBusy} onSelect={onSelect} />
        ))}

      {status === "ready" && suggestion && (
        <tr>
          <td colSpan={COLUMNS} className="peripheral-note">
            Các món đang tick được lưu cùng cấu hình vào tài khoản; khi thêm vào giỏ, chúng là hàng mua lẻ đi kèm bộ PC.
          </td>
        </tr>
      )}
    </tbody>
  );
}
