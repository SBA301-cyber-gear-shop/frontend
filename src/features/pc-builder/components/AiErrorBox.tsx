import { useEffect, useState } from "react";
import type { PcBuilderApiError } from "../hooks/usePcBuilder";

const TITLES: Record<string, string> = {
  AI_UNAVAILABLE: "Trợ lý AI đang bận",
  RATE_LIMITED: "Bạn thao tác hơi nhanh",
  BUILD_NOT_FOUND: "Chưa ráp được bộ PC phù hợp",
  BUDGET_TOO_LOW: "Ngân sách chưa đủ",
  BUDGET_TOO_HIGH: "Ngân sách vượt mức tối đa",
  PURPOSE_INVALID: "Mục đích sử dụng không hợp lệ",
  VARIANT_NOT_FOUND: "Có linh kiện không còn trong kho",
  METADATA_INVALID: "Dữ liệu cấu hình của shop đang lỗi",
};

// Lỗi do dữ liệu khách nhập: gửi lại y nguyên vô ích, cần sửa đầu vào
const INPUT_ERRORS = ["BUILD_NOT_FOUND", "BUDGET_TOO_LOW", "BUDGET_TOO_HIGH", "PURPOSE_INVALID", "VARIANT_NOT_FOUND"];

interface AiErrorBoxProps {
  error: PcBuilderApiError;
  retryLockedUntil: number;
  isBusy: boolean;
  onRetry: () => void;
  onReset: () => void;
}

export function AiErrorBox({ error, retryLockedUntil, isBusy, onRetry, onReset }: AiErrorBoxProps) {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((retryLockedUntil - now) / 1000));

  // Đếm ngược Retry-After: nút "Thử lại" khóa tới khi hết giờ
  useEffect(() => {
    if (retryLockedUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= retryLockedUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [retryLockedUntil]);

  const canRetry = error.status !== 400 && !(error.code && INPUT_ERRORS.includes(error.code));
  const title = (error.code && TITLES[error.code]) || (error.status === 400 ? "Dữ liệu chưa hợp lệ" : "Không đề xuất được cấu hình");

  return (
    <div className="ai-error-box" id="aiErrorBox" role="alert" data-code={error.code}>
      <div className="ai-error-icon-wrapper">
        <svg
          className="ai-error-icon"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="ai-error-content">
        <h3 className="ai-error-title">{title}</h3>
        <p className="ai-error-desc">{error.message}</p>
        {!canRetry && <p className="ai-error-notice">Hãy đổi ngân sách hoặc mô tả nhu cầu rồi đề xuất lại.</p>}
        <div className="ai-error-actions">
          {canRetry && (
            <button type="button" className="btn-ai-retry" onClick={onRetry} disabled={isBusy || secondsLeft > 0}>
              {secondsLeft > 0 ? `Thử lại sau ${secondsLeft}s` : "Thử lại"}
            </button>
          )}
          <button type="button" className="btn-ai-back" onClick={onReset} disabled={isBusy}>
            Làm lại từ đầu
          </button>
        </div>
      </div>
    </div>
  );
}
