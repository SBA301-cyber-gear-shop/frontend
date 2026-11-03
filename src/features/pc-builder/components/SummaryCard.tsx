import { Badge } from "@/components/ui";
import { money } from "@/utils";
import { fullSetFit } from "../domain/fullSet";
import { compatibilityPassed, isDataNote } from "../domain/buildLines";
import type { BudgetFit, CompatibilityStatus, RuleCheck } from "../types/pcBuilder.types";

export { compatibilityPassed, isDataNote };

export const CHECK_STATUS: Record<
  CompatibilityStatus,
  { icon: string; tone: string; text: string }
> = {
  pass: { icon: "✓", tone: "success", text: "PASS" },
  warning: { icon: "!", tone: "warning", text: "LƯU Ý" },
  fail: { icon: "✕", tone: "danger", text: "FAIL" },
  unknown: { icon: "?", tone: "info", text: "CHƯA RÕ" },
};

/** Nhãn tổng của bộ máy: "PASS ALL" chỉ khi backend không có fail/warning/unknown (DD 10.3, AC7). */
export function buildVerdict(rules: RuleCheck[], allRulesPassed: boolean, isRevalidating = false) {
  if (isRevalidating) return { label: "ĐANG KIỂM TRA…", tone: "info" };
  if (rules.some((r) => r.status === "fail")) return { label: "KHÔNG TƯƠNG THÍCH", tone: "danger" };
  if (allRulesPassed) return { label: "PASS ALL", tone: "success" };
  return { label: "CẦN LƯU Ý", tone: "warning" };
}

interface SummaryCardProps {
  budget: number | "";
  grandTotal: number;
  rules: RuleCheck[];
  allRulesPassed: boolean;
  budgetFit?: BudgetFit | null;
  isRevalidating?: boolean;
  canAddToCart?: boolean;
  isSaved: boolean;
  onAddToCart: () => void;
  onSaveBuild: () => void;
  isBusy?: boolean;
  isFullSet?: boolean;
  peripheralTotal?: number;
}

function CheckList({ rules }: { rules: RuleCheck[] }) {
  return (
    <div className="check-list">
      {rules.map((rule, index) => {
        const s = CHECK_STATUS[rule.status] ?? CHECK_STATUS.unknown;
        return (
          // Nhiều check có thể cùng mã (mỗi linh kiện một J9a), nên key cần cả chỉ số (B5)
          <div key={`${rule.id}-${index}`} className={`check-item ${rule.status}`}>
            <div className={`check-icon-badge ${rule.status}`} aria-hidden="true">
              {s.icon}
            </div>
            <div className="check-content">
              <strong>{rule.title}</strong>
              <span>{rule.detail}</span>
            </div>
            <Badge tone={s.tone}>{s.text}</Badge>
          </div>
        );
      })}
    </div>
  );
}

export function SummaryCard({
  budget,
  grandTotal,
  rules,
  allRulesPassed,
  budgetFit,
  isRevalidating = false,
  canAddToCart = true,
  isSaved,
  onAddToCart,
  onSaveBuild,
  isBusy = false,
  isFullSet = false,
  peripheralTotal = 0,
}: SummaryCardProps) {
  const numericBudget = typeof budget === "number" ? budget : Number(budget) || 0;
  // Trọn bộ: tính trên cả bộ vì budgetFit của backend chỉ biết thùng máy.
  // Ngược lại ưu tiên số của backend; demo mode / chưa có kết quả thì tính từ tổng hiển thị
  const wholeSet = fullSetFit(numericBudget, grandTotal, peripheralTotal);
  const percent = isFullSet ? wholeSet.percent : (budgetFit?.percent ?? (numericBudget ? (grandTotal / numericBudget) * 100 : 0));
  const leftover = isFullSet ? wholeSet.leftover : (budgetFit?.leftover ?? numericBudget - grandTotal);
  const isOver = isFullSet
    ? wholeSet.isOver
    : budgetFit
      ? budgetFit.status === "OVER"
      : numericBudget > 0 && grandTotal > numericBudget;
  const verdict = buildVerdict(rules, allRulesPassed, isRevalidating);
  const hardwareRules = rules.filter((r) => !r.id.startsWith("P:") && !isDataNote(r));
  const profileRules = rules.filter((r) => r.id.startsWith("P:"));
  const dataNotes = rules.filter(isDataNote);
  const passCount = hardwareRules.filter((r) => r.status === "pass").length;
  const fitTone = isOver ? "over" : percent >= 90 ? "in-window" : "under";

  return (
    <aside className="summary-card">
      <div className="summary-title">
        <span>Tổng quan cấu hình</span>
        <Badge tone={verdict.tone}>{verdict.label}</Badge>
      </div>

      {/* KHỐI TÍNH TOÁN TIỀN */}
      <div className="cost-block">
        <div className="cost-row">
          <span>{isFullSet ? "Ngân sách trọn bộ:" : "Ngân sách dự chi:"}</span>
          <strong style={{ color: "var(--ink, #152237)" }}>{money(numericBudget)}</strong>
        </div>
        {isFullSet ? (
          <>
            <div className="cost-row" id="costPcTotal">
              <span>Thùng máy:</span>
              <strong>{money(grandTotal)}</strong>
            </div>
            <div className="cost-row" id="costPeripheralTotal">
              <span>Màn hình, bàn phím, chuột:</span>
              <strong>{money(peripheralTotal)}</strong>
            </div>
            <div className="cost-row" id="costGrandTotal">
              <span>Tổng cả bộ:</span>
              <span className="total-cost-amount">{money(grandTotal + peripheralTotal)}</span>
            </div>
          </>
        ) : (
          <div className="cost-row">
            <span>Tổng chi phí linh kiện:</span>
            <span className="total-cost-amount">{money(grandTotal)}</span>
          </div>
        )}
        {numericBudget > 0 && (
          <>
            <div
              className={`budget-fit-bar ${fitTone}`}
              role="meter"
              aria-label="Độ sát ngân sách"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent * 10) / 10}
            >
              <div className="budget-fit-window" />
              <div className="budget-fit-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
            <div className="cost-row">
              <span>Độ sát ngân sách:</span>
              <strong className={`budget-fit-percent ${fitTone}`}>
                {percent.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
              </strong>
            </div>
            <div className="cost-row">
              {isOver ? (
                <strong className="budget-over" role="status">
                  Vượt {money(Math.abs(leftover))}
                </strong>
              ) : (
                <span>
                  Còn dư <strong style={{ color: "#148465" }}>{money(leftover)}</strong>
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* KẾT QUẢ KIỂM TRA CỦA BACKEND (DEMO: rules.ts) */}
      <div className="checklist-section-title">
        <span>KIỂM ĐỊNH TƯƠNG THÍCH</span>
        <span>
          {isRevalidating ? "Đang kiểm tra…" : `${passCount} / ${hardwareRules.length} QUY TẮC`}
        </span>
      </div>
      {hardwareRules.length === 0 && !isRevalidating ? (
        <p className="check-empty">Chưa có kết quả kiểm tra tương thích.</p>
      ) : (
        <CheckList rules={hardwareRules} />
      )}

      {dataNotes.length > 0 && (
        <>
          <div className="checklist-section-title" id="dataNotesTitle">
            <span>GHI CHÚ VỀ DỮ LIỆU</span>
            <span>{dataNotes.length} GHI CHÚ</span>
          </div>
          <CheckList rules={dataNotes.map((r) => ({ ...r, status: "unknown" as const }))} />
        </>
      )}

      {profileRules.length > 0 && (
        <>
          <div className="checklist-section-title">
            <span>SO VỚI NHU CẦU</span>
          </div>
          <CheckList rules={profileRules} />
        </>
      )}

      {/* NÚT MUA VÀ LƯU BẢN NHÁP */}
      <button
        type="button"
        className="btn-buy-now"
        onClick={onAddToCart}
        disabled={isBusy || !canAddToCart}
        title={
          canAddToCart
            ? undefined
            : isRevalidating
              ? "Đang kiểm tra tương thích"
              : "Cấu hình chưa tương thích hoặc vượt ngân sách"
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        Thêm vào giỏ & Đặt hàng
      </button>

      <button
        type="button"
        className={`btn-save-build ${isSaved ? "saved" : ""}`}
        onClick={onSaveBuild}
        disabled={isBusy}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        {isSaved
          ? "✓ Đã lưu cấu hình vào tài khoản"
          : "Lưu cấu hình vào tài khoản"}
      </button>

      <p
        style={{
          fontSize: 11,
          color: "var(--muted, #657185)",
          textAlign: "center",
          marginTop: 12,
        }}
      >
        Miễn phí công lắp ráp chuyên nghiệp & cài đặt hệ điều hành khi mua trọn
        bộ.
      </p>
    </aside>
  );
}
