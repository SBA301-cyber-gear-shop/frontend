import type { KeyboardEvent } from "react";
import { money } from "@/utils";
import { MAX_BUDGET, MAX_MESSAGE_LENGTH } from "../domain/buildLines";

interface BuilderToolbarProps {
  budget: number | "";
  onBudgetChange: (value: number | "") => void;
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  isBusy: boolean;
  disabled?: boolean;
  maxBuildPrice?: number | null;
}

export function BuilderToolbar({
  budget,
  onBudgetChange,
  message,
  onMessageChange,
  onSubmit,
  isBusy,
  disabled = false,
  maxBuildPrice,
}: BuilderToolbarProps) {
  const maxLimit = maxBuildPrice && maxBuildPrice > 0 ? maxBuildPrice : MAX_BUDGET;

  // Enter gửi (Shift+Enter xuống dòng); đang chạy thì không gửi lại
  function submitOnEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (!isBusy && !disabled) onSubmit();
  }

  return (
    <div className="builder-toolbar">
      <div className="toolbar-grid two">
        <div className="field-group">
          <label htmlFor="inputBudget">Ngân sách dự chi (đ)</label>
          <input
            id="inputBudget"
            type="number"
            className="field-input"
            placeholder="VD: 25000000"
            value={budget}
            min={1}
            max={maxLimit}
            step={500000}
            aria-describedby="inputBudgetHint"
            onChange={(e) => onBudgetChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <small id="inputBudgetHint" className="field-hint">
            {typeof budget === "number" && budget > 0 ? money(budget) : `Tối đa ${money(maxLimit)}`}
          </small>
        </div>
        <div className="field-group">
          <label htmlFor="inputNeed">Nhu cầu sử dụng</label>
          <textarea
            id="inputNeed"
            className="field-input field-textarea"
            placeholder="VD: Chơi game 2K mượt, thỉnh thoảng livestream, thích case trắng..."
            value={message}
            maxLength={MAX_MESSAGE_LENGTH}
            required
            rows={3}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={submitOnEnter}
          />
          <small className="field-hint">
            {message.length}/{MAX_MESSAGE_LENGTH} ký tự
          </small>
        </div>
      </div>

      <div className="prompt-row">
        <button
          type="button"
          className="btn-ai-submit"
          id="btnRunAi"
          onClick={onSubmit}
          disabled={isBusy || disabled}
        >
          {isBusy ? (
            <>
              <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} />
              <span>AI đang tính toán...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
              </svg>
              <span>Đề xuất cấu hình với AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
