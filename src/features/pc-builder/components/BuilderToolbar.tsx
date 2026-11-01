import type { KeyboardEvent } from "react";
import { money } from "@/utils";
import type { BuildOptionsResponse } from "../types/pcBuilder.types";

// Dùng khi /options chưa tải được; backend vẫn kiểm lại (DD 10.3)
const DEFAULT_MIN_BUDGET = 8_000_000;
const DEFAULT_MAX_BUDGET = 9_999_999_999;
const FALLBACK_EXAMPLES = [
  "Chơi game 2K, thỉnh thoảng stream",
  "Dựng phim 4K bằng DaVinci Resolve",
  "Văn phòng, Excel, họp online",
  "Lập trình web, chạy Docker",
];

interface BuilderToolbarProps {
  budget: number | "";
  onBudgetChange: (val: number | "") => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  userPrompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  isBusy: boolean;
  options?: BuildOptionsResponse | null;
}

export function BuilderToolbar({
  budget,
  onBudgetChange,
  purpose,
  onPurposeChange,
  userPrompt,
  onPromptChange,
  onSubmit,
  isBusy,
  options,
}: BuilderToolbarProps) {
  const minBudget = Math.max(options?.minBudget ?? DEFAULT_MIN_BUDGET, options?.floorPrice ?? 0);
  const maxBudget = options?.maxBudget ?? DEFAULT_MAX_BUDGET;
  const examples = options?.examples?.length ? options.examples : FALLBACK_EXAMPLES;

  // Enter gửi (Shift+Enter xuống dòng); đang tải thì không gửi (DD 10.4, chống gửi trùng)
  function submitOnEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (!isBusy) onSubmit();
  }

  return (
    <div className="builder-toolbar">
      <div className="toolbar-grid">
        <div className="field-group">
          <label htmlFor="inputBudget">Ngân sách dự chi (₫)</label>
          <input
            id="inputBudget"
            type="number"
            className="field-input"
            placeholder="Nhập số tiền (VD: 25000000)"
            value={budget}
            min={minBudget}
            max={maxBudget}
            step={500000}
            aria-describedby="inputBudgetHint"
            onChange={(e) =>
              onBudgetChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <small id="inputBudgetHint" className="field-hint">
            Từ {money(minBudget)} đến {money(maxBudget)}
          </small>
        </div>
        <div className="field-group">
          <label htmlFor="inputPurpose">Nhu cầu sử dụng chính *</label>
          <textarea
            id="inputPurpose"
            className="field-input field-textarea"
            placeholder="VD: Chơi game 2K mượt, thỉnh thoảng livestream..."
            value={purpose}
            maxLength={300}
            required
            rows={3}
            onChange={(e) => onPurposeChange(e.target.value)}
            onKeyDown={submitOnEnter}
          />
          <small className="field-hint">{purpose.length}/300 ký tự</small>
        </div>
        <div className="field-group">
          <label htmlFor="inputUserPrompt">Mong muốn thêm</label>
          <textarea
            id="inputUserPrompt"
            className="field-input field-textarea"
            placeholder="VD: Thích case trắng, máy chạy êm, ưu tiên Intel..."
            value={userPrompt}
            maxLength={500}
            rows={3}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={submitOnEnter}
          />
          <small className="field-hint">{userPrompt.length}/500 ký tự</small>
        </div>
      </div>

      <div className="prompt-row">
        <div className="example-chips" aria-label="Gợi ý nhu cầu">
          <span className="example-chips-label">Gợi ý:</span>
          {examples.map((text) => (
            <button
              key={text}
              type="button"
              className="example-chip"
              onClick={() => onPurposeChange(text)}
            >
              {text}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-ai-submit"
          id="btnRunAi"
          onClick={onSubmit}
          disabled={isBusy}
        >
          {isBusy ? (
            <>
              <div
                className="loading-spinner"
                style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }}
              />
              <span>AI đang tính toán...</span>
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
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
