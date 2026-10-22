import { money } from "@/utils";
import type { RuleCheck } from "../types/pcBuilder.types";

interface SummaryCardProps {
  budget: number;
  grandTotal: number;
  remainingBudget: number;
  rules: RuleCheck[];
  allRulesPassed: boolean;
  isSaved: boolean;
  onAddToCart: () => void;
  onSaveBuild: () => void;
}

export function SummaryCard({
  budget,
  grandTotal,
  remainingBudget,
  rules,
  allRulesPassed,
  isSaved,
  onAddToCart,
  onSaveBuild,
}: SummaryCardProps) {
  const passCount = rules.filter((r) => r.status === "pass").length;

  return (
    <aside className="summary-card">
      <div className="summary-title">
        <span>Tổng quan cấu hình</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: allRulesPassed ? "#148465" : "#b91c1c",
            background: allRulesPassed ? "#e6f6f1" : "#fee2e2",
            padding: "3px 8px",
            borderRadius: 4,
          }}
        >
          {allRulesPassed ? "PASS ALL" : "CẦN LƯU Ý"}
        </span>
      </div>

      {/* KHỐI TÍNH TOÁN TIỀN */}
      <div className="cost-block">
        <div className="cost-row">
          <span>Ngân sách dự chi:</span>
          <strong style={{ color: "var(--ink, #152237)" }}>
            {money(budget)}
          </strong>
        </div>
        <div className="cost-row">
          <span>Tổng chi phí linh kiện:</span>
          <span className="total-cost-amount">{money(grandTotal)}</span>
        </div>
        <div className="cost-row">
          <span>Dư trong ngân sách:</span>
          <strong
            style={{
              color: remainingBudget >= 0 ? "#148465" : "#d91f31",
              fontSize: 14,
            }}
          >
            {remainingBudget >= 0
              ? `+${money(remainingBudget)}`
              : `-${money(Math.abs(remainingBudget))}`}
          </strong>
        </div>
      </div>

      {/* CHECKLIST KIỂM ĐỊNH TƯƠNG THÍCH (HARDWARE RULE ENGINE) */}
      <div className="checklist-section-title">
        <span>KIỂM ĐỊNH TƯƠNG THÍCH (RULE ENGINE)</span>
        <span
          style={{
            color: allRulesPassed ? "#148465" : "#d91f31",
            fontWeight: 750,
          }}
        >
          {passCount} / {rules.length} QUY TẮC
        </span>
      </div>

      <div className="check-list">
        {rules.map((rule) => {
          const isPass = rule.status === "pass";
          return (
            <div key={rule.id} className="check-item">
              <div
                className={`check-icon-badge ${isPass ? "pass" : "fail"}`}
              >
                {isPass ? "✓" : "✕"}
              </div>
              <div className="check-content">
                <strong>{rule.title}</strong>
                <span>{rule.detail}</span>
              </div>
              <span className={`badge-status ${isPass ? "pass" : "fail"}`}>
                {isPass ? "PASS" : "FAIL"}
              </span>
            </div>
          );
        })}
      </div>

      {/* NÚT MUA VÀ LƯU BẢN NHÁP */}
      <button
        type="button"
        className="btn-buy-now"
        onClick={onAddToCart}
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
        {isSaved ? "✓ Đã lưu cấu hình vào tài khoản" : "Lưu cấu hình vào tài khoản"}
      </button>

      <p
        style={{
          fontSize: 11,
          color: "var(--muted, #657185)",
          textAlign: "center",
          marginTop: 12,
        }}
      >
        Miễn phí công lắp ráp chuyên nghiệp & cài đặt hệ điều hành khi mua trọn bộ.
      </p>
    </aside>
  );
}
