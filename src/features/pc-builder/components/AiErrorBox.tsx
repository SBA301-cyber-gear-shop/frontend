interface AiErrorBoxProps {
  message?: string | null;
  onRetry: () => void;
  onReset: () => void;
}

export function AiErrorBox({ message, onRetry, onReset }: AiErrorBoxProps) {
  return (
    <div className="ai-error-box" id="aiErrorBox" role="alert">
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
        <h3 className="ai-error-title">Dịch vụ AI hiện không khả dụng</h3>
        <p className="ai-error-desc">
          {message ||
            "Hệ thống AI tạm thời không thể đề xuất cấu hình lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau ít phút."}
        </p>

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

        <div className="ai-error-actions">
          <button
            type="button"
            className="btn-ai-retry"
            onClick={onRetry}
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
            <span>Thử lại đề xuất</span>
          </button>

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
