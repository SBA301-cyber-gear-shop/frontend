import { Badge } from "@/components/ui";
import { money } from "@/utils";
import type { BuildResult } from "../types/pcBuilder.types";

/** Nhãn tổng của bộ PC: xung đột phần cứng và vượt tiền tách riêng như status của backend. */
export function buildVerdict(build: BuildResult | null, isChecking: boolean, checkError: string | null) {
  if (isChecking) return { label: "ĐANG KIỂM TRA…", tone: "info" };
  if (checkError || !build) return { label: "CHƯA KIỂM TRA", tone: "neutral" };
  if (build.status === "INCOMPATIBLE") return { label: "KHÔNG TƯƠNG THÍCH", tone: "danger" };
  if (build.status === "OVER_BUDGET") return { label: "VƯỢT NGÂN SÁCH", tone: "warning" };
  return { label: "TƯƠNG THÍCH", tone: "success" };
}

interface SummaryCardProps {
  build: BuildResult;
  isChecking: boolean;
  checkError: string | null;
  savedBuildId: number | null;
  isSaving: boolean;
  isAdding: boolean;
  disabled?: boolean;
  onRecheck: () => void;
  onAddToCart: () => void;
  onSave: () => void;
}

export function SummaryCard({
  build,
  isChecking,
  checkError,
  savedBuildId,
  isSaving,
  isAdding,
  disabled = false,
  onRecheck,
  onAddToCart,
  onSave,
}: SummaryCardProps) {
  const verdict = buildVerdict(build, isChecking, checkError);
  const isOver = build.difference > 0;
  const blocked = disabled || isChecking || Boolean(checkError) || build.status === "INCOMPATIBLE";
  const blockedTitle = isChecking
    ? "Đang kiểm tra lại cấu hình"
    : checkError
      ? "Chưa kiểm tra được cấu hình mới nhất"
      : build.status === "INCOMPATIBLE"
        ? "Cấu hình có linh kiện không tương thích"
        : undefined;

  return (
    <aside className="summary-card">
      <div className="summary-title">
        <span>Tổng quan cấu hình</span>
        <Badge tone={verdict.tone}>{verdict.label}</Badge>
      </div>

      <div className="cost-block">
        <div className="cost-row">
          <span>Ngân sách dự chi:</span>
          <strong style={{ color: "var(--ink, #152237)" }}>{money(build.budget)}</strong>
        </div>
        <div className="cost-row">
          <span>Tổng chi phí linh kiện:</span>
          <span className="total-cost-amount" id="buildTotal">
            {money(build.total)}
          </span>
        </div>
        <div className="cost-row" id="buildDifference">
          {isOver ? (
            <strong className="budget-over" role="status">
              Vượt {money(build.difference)}
            </strong>
          ) : (
            <span>
              Còn dư <strong style={{ color: "#148465" }}>{money(-build.difference)}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="checklist-section-title">
        <span>KIỂM ĐỊNH TƯƠNG THÍCH</span>
        <span>{isChecking ? "Đang kiểm tra…" : `${build.violations.length} VI PHẠM`}</span>
      </div>
      {checkError ? (
        <div className="check-error" role="alert">
          <p>Không kiểm tra được cấu hình: {checkError}</p>
          <button type="button" className="btn-replace-part" onClick={onRecheck} disabled={isChecking}>
            Kiểm tra lại
          </button>
        </div>
      ) : build.violations.length === 0 ? (
        <p className="check-empty">
          {isChecking ? "Đang kiểm tra lại cấu hình…" : "Tất cả linh kiện tương thích với nhau."}
        </p>
      ) : (
        <div className="check-list">
          {build.violations.map((violation, index) => (
            <div key={`${violation.rule}-${index}`} className="check-item fail">
              <div className="check-icon-badge fail" aria-hidden="true">
                ✕
              </div>
              <div className="check-content">
                <strong>{violation.rule}</strong>
                <span>{violation.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {build.status === "OVER_BUDGET" && build.budgetWarning && !isChecking && (
        <p className="budget-warning" id="budgetWarning" role="status">
          {build.budgetWarning}
        </p>
      )}

      <button
        type="button"
        className="btn-buy-now"
        onClick={onAddToCart}
        disabled={blocked || isAdding}
        title={blockedTitle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {isAdding ? "Đang thêm vào giỏ…" : "Thêm vào giỏ & Đặt hàng"}
      </button>
      <button
        type="button"
        className={`btn-save-build ${savedBuildId ? "saved" : ""}`}
        onClick={onSave}
        disabled={blocked || isSaving}
        title={blockedTitle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {isSaving
          ? "Đang lưu…"
          : savedBuildId
            ? `✓ Đã lưu cấu hình #${savedBuildId}`
            : "Lưu cấu hình vào tài khoản"}
      </button>
      <p style={{ fontSize: 11, color: "var(--muted, #657185)", textAlign: "center", marginTop: 12 }}>
        Miễn phí công lắp ráp chuyên nghiệp & cài đặt hệ điều hành khi mua trọn bộ.
      </p>
    </aside>
  );
}
