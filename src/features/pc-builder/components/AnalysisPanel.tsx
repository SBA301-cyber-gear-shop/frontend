import { useEffect } from "react";
import { Notice } from "@/components/ui";
import { money } from "@/utils";
import type { AnalyzeResponse, PurposeOption, RequirementStatus } from "../types/pcBuilder.types";

const VIEW: Record<RequirementStatus, { tone: string; title: string }> = {
  READY: { tone: "success", title: "Shop đã hiểu nhu cầu của bạn" },
  NEED_CLARIFICATION: { tone: "info", title: "Shop cần thêm thông tin" },
  BUDGET_TOO_LOW: { tone: "danger", title: "Ngân sách chưa đủ cho nhu cầu này" },
  BUDGET_TOO_HIGH: { tone: "warning", title: "Ngân sách vượt bộ PC cao cấp nhất của shop" },
};

interface AnalysisPanelProps {
  analysis: AnalyzeResponse;
  isBusy: boolean;
  /** Phân tích lại với ngân sách khác (gợi ý của server). */
  onUseBudget: (budget: number) => void;
  /** BUDGET_TOO_LOW: build luôn với mục đích khách chọn. */
  onPickPurpose: (option: PurposeOption) => void;
}

/** Kết quả bước 1–3 (/requirements/analyze) và các lựa chọn tiếp theo cho khách. */
export function AnalysisPanel({ analysis, isBusy, onUseBudget, onPickPurpose }: AnalysisPanelProps) {
  const view = VIEW[analysis.status] ?? VIEW.NEED_CLARIFICATION;
  const budget = analysis.requirement?.budget ?? 0;

  // Nhu cầu mơ hồ: đưa khách về ô mô tả để bổ sung
  useEffect(() => {
    if (analysis.status === "NEED_CLARIFICATION") document.getElementById("inputNeed")?.focus();
  }, [analysis]);

  const budgetAction =
    analysis.status === "BUDGET_TOO_HIGH" && analysis.maxBuildPrice
      ? { label: `Dùng ngân sách ${money(analysis.maxBuildPrice)}`, value: analysis.maxBuildPrice }
      : analysis.status === "BUDGET_TOO_LOW" && analysis.minBudget && analysis.minBudget > budget
        ? { label: `Tăng ngân sách lên ${money(analysis.minBudget)}`, value: analysis.minBudget }
        : null;

  return (
    <div className="analysis-panel" id="analysisPanel" data-status={analysis.status}>
      <Notice tone={view.tone}>
        <strong className="analysis-title">{view.title}</strong>
        <p className="analysis-message">{analysis.message}</p>
        {analysis.status === "NEED_CLARIFICATION" && (
          <p className="analysis-hint">Bổ sung mô tả nhu cầu ở ô phía trên rồi bấm "Đề xuất cấu hình với AI".</p>
        )}
        {analysis.notes?.length > 0 && (
          <ul className="analysis-notes">
            {analysis.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        {analysis.status === "BUDGET_TOO_LOW" && analysis.suggestedPurposes?.length > 0 && (
          <div className="analysis-purposes" aria-label="Mục đích vừa ngân sách">
            {analysis.suggestedPurposes.map((option) => (
              <button
                key={option.purpose}
                type="button"
                className="analysis-purpose"
                disabled={isBusy}
                onClick={() => onPickPurpose(option)}
              >
                <strong>Build {option.label}</strong>
                <span>{option.description}</span>
                <small>Từ {money(option.minBudget)}</small>
              </button>
            ))}
          </div>
        )}
        {budgetAction && (
          <div className="analysis-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isBusy}
              onClick={() => onUseBudget(budgetAction.value)}
            >
              {budgetAction.label}
            </button>
          </div>
        )}
      </Notice>
    </div>
  );
}
