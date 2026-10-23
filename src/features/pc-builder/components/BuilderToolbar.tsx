interface BuilderToolbarProps {
  budget: number | "";
  onBudgetChange: (val: number | "") => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  ramGb: number | "";
  onRamGbChange: (val: number | "") => void;
  userPrompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  isBusy: boolean;
}

export function BuilderToolbar({
  budget,
  onBudgetChange,
  purpose,
  onPurposeChange,
  ramGb,
  onRamGbChange,
  userPrompt,
  onPromptChange,
  onSubmit,
  isBusy,
}: BuilderToolbarProps) {
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
            min={5000000}
            step={500000}
            onChange={(e) =>
              onBudgetChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
        </div>
        <div className="field-group">
          <label htmlFor="inputPurpose">Nhu cầu sử dụng chính</label>
          <input
            id="inputPurpose"
            type="text"
            className="field-input"
            placeholder="VD: Gaming đồ họa cao, thiết kế 3D, lập trình..."
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isBusy) {
                onSubmit();
              }
            }}
          />
        </div>
        <div className="field-group">
          <label htmlFor="selectRam">Dung lượng RAM mong muốn</label>
          <select
            id="selectRam"
            className="field-select"
            value={ramGb}
            onChange={(e) =>
              onRamGbChange(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">-- Chọn dung lượng RAM --</option>
            <option value={16}>16 GB (Tiêu chuẩn)</option>
            <option value={32}>32 GB (Khuyên dùng cho Gaming 2026)</option>
            <option value={64}>64 GB (Chuyên nghiệp / Render 3D)</option>
            <option value={128}>128 GB (Máy trạm / Workstation)</option>
          </select>
        </div>
      </div>

      <div className="prompt-row">
        <input
          type="text"
          id="inputUserPrompt"
          className="prompt-input"
          placeholder="Mô tả thêm mong muốn của bạn (VD: Thích vỏ case đen Montech, tản nhiệt êm, chơi Black Myth Wukong 2K, quạt ARGB...)"
          value={userPrompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isBusy) {
              onSubmit();
            }
          }}
        />
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
