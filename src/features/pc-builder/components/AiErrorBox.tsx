import { useEffect, useState } from "react";
import { money } from "@/utils";
import type { PcBuilderApiError } from "../hooks/usePcBuilder";

const DEFAULT_MIN_BUDGET = 8_000_000;

interface ErrorData {
  clarifyingQuestion?: string;
  minBudget?: number;
  floorPrice?: number | null;
  minPriority1Price?: number | null;
  blockingItems?: { id: string; reason: string }[];
}

const TITLES: Record<string, string> = {
  AI_UNAVAILABLE: "Trợ lý AI đang bận",
  RATE_LIMITED: "Bạn thao tác hơi nhanh",
  NEEDS_UNCLEAR: "Hệ thống cần thêm thông tin về nhu cầu",
  NEEDS_REQUIRED: "Bạn chưa nhập nhu cầu sử dụng chính",
  BUDGET_BELOW_FLOOR: "Ngân sách chưa đủ để ráp một bộ máy",
  BUDGET_TOO_HIGH: "Ngân sách vượt mức tối đa",
  NO_FEASIBLE_BUILD: "Không ráp được bộ máy thỏa yêu cầu",
  INVALID_PROFILE: "Hồ sơ nhu cầu không hợp lệ",
  CATALOG_EMPTY: "Kho chưa có linh kiện",
};

// Lỗi do dữ liệu khách nhập: thử lại y nguyên vô ích, cần sửa đầu vào
const INPUT_ERRORS = ["NEEDS_UNCLEAR", "NEEDS_REQUIRED", "BUDGET_BELOW_FLOOR", "BUDGET_TOO_HIGH", "NO_FEASIBLE_BUILD", "INVALID_PROFILE"];

interface AiErrorBoxProps {
  message?: string | null;
  error?: PcBuilderApiError | null;
  retryLockedUntil?: number;
  isBusy?: boolean;
  onRetry: () => void;
  onReset: () => void;
  onSetBudget?: (value: number) => void;
}

export function AiErrorBox({
  message,
  error,
  retryLockedUntil = 0,
  isBusy = false,
  onRetry,
  onReset,
  onSetBudget,
}: AiErrorBoxProps) {
  const code = error?.code;
  const data = (error?.data ?? {}) as ErrorData;
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((retryLockedUntil - now) / 1000));

  // Đếm ngược Retry-After: nút "Thử lại" khóa tới khi hết giờ (DD 10.3)
  useEffect(() => {
    if (retryLockedUntil <= Date.now()) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= retryLockedUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [retryLockedUntil]);

  // Nhu cầu mơ hồ / thiếu: đưa khách về ô nhu cầu để bổ sung
  useEffect(() => {
    if (code === "NEEDS_UNCLEAR" || code === "NEEDS_REQUIRED")
      document.getElementById("inputPurpose")?.focus();
  }, [code]);

  const title = (code && TITLES[code]) || "Dịch vụ AI hiện không khả dụng";
  const description =
    code === "NEEDS_UNCLEAR"
      ? data.clarifyingQuestion || message
      : code === "AI_UNAVAILABLE"
        ? "Trợ lý AI đang bận hoặc phản hồi quá lâu. Hồ sơ nhu cầu của bạn vẫn được giữ, vui lòng bấm \"Thử lại\"."
        : message ||
          "Hệ thống AI tạm thời không thể đề xuất cấu hình lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau ít phút.";
  const minBudget = Math.max(data.minBudget ?? DEFAULT_MIN_BUDGET, data.floorPrice ?? 0);
  const canRetry = !code || !INPUT_ERRORS.includes(code);

  return (
    <div className="ai-error-box" id="aiErrorBox" role="alert" data-code={code}>
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
        <p className="ai-error-desc">{description}</p>

        {code === "NO_FEASIBLE_BUILD" && (
          <div className="ai-error-blocking">
            {!!data.blockingItems?.length && (
              <ul>
                {data.blockingItems.map((b) => (
                  <li key={b.id}>{b.reason}</li>
                ))}
              </ul>
            )}
            <p>
              {data.minPriority1Price != null
                ? `Mức tối thiểu là ${money(data.minPriority1Price)}.`
                : "Kho chưa có linh kiện thỏa yêu cầu này."}{" "}
              Hãy tăng ngân sách hoặc bỏ bớt yêu cầu trong hồ sơ bên dưới.
            </p>
          </div>
        )}

        {canRetry && (
          <div className="ai-error-notice">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              <strong>Lưu ý:</strong> CyberShop chỉ hiển thị cấu hình thực tế được AI đề xuất từ kho hàng có sẵn, tuyệt đối không dùng dữ liệu giả lập (mock data) để tránh gây nhầm lẫn cho bạn.
            </span>
          </div>
        )}

        <div className="ai-error-actions">
          {canRetry && (
            <button
              type="button"
              className="btn-ai-retry"
              onClick={onRetry}
              disabled={isBusy || secondsLeft > 0}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span>{secondsLeft > 0 ? `Thử lại sau ${secondsLeft} giây` : "Thử lại"}</span>
            </button>
          )}

          {code === "BUDGET_BELOW_FLOOR" && onSetBudget && (
            <button type="button" className="btn-ai-retry" onClick={() => onSetBudget(minBudget)}>
              <span>Đặt ngân sách tối thiểu ({money(minBudget)})</span>
            </button>
          )}

          {(code === "NEEDS_UNCLEAR" || code === "NEEDS_REQUIRED") && (
            <button
              type="button"
              className="btn-ai-retry"
              onClick={() => document.getElementById("inputPurpose")?.focus()}
            >
              <span>Bổ sung nhu cầu</span>
            </button>
          )}

          <button
            type="button"
            className="btn-ai-back"
            onClick={onReset}
          >
            <span>Quay về trạng thái ban đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
