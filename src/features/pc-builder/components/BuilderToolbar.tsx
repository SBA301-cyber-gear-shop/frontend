interface BuilderToolbarProps {
  budget: number;
  onBudgetChange: (val: number) => void;
  purpose: string;
  onPurposeChange: (val: string) => void;
  ramGb: number;
  onRamGbChange: (val: number) => void;
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
            value={budget}
            min={5000000}
            step={500000}
            onChange={(e) => onBudgetChange(Number(e.target.value) || 0)}
          />
        </div>
        <div className="field-group">
          <label htmlFor="selectPurpose">Nhu cầu sử dụng chính</label>
          <select
            id="selectPurpose"
            className="field-select"
            value={purpose}
            onChange={(e) => onPurposeChange(e.target.value)}
          >
            <option value="gaming">🎮 Gaming & Esport đồ họa cao</option>
            <option value="creative">🎬 Thiết kế 3D, Đồ họa & Dựng phim 4K</option>
            <option value="work">💼 Học tập, Văn phòng & Lập trình phần mềm</option>
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="selectRam">Dung lượng RAM mong muốn</label>
          <select
            id="selectRam"
            className="field-select"
            value={ramGb}
            onChange={(e) => onRamGbChange(Number(e.target.value))}
          >
            <option value={16}>16 GB (Tiêu chuẩn)</option>
            <option value={32}>32 GB (Khuyên dùng cho Gaming 2026)</option>
            <option value={64}>64 GB (Chuyên nghiệp / Render 3D)</option>
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

      <div className="toolbar-footnote">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Dữ liệu linh kiện được lọc trực tiếp từ CSDL kho đang sẵn hàng. Thuật
          toán Rule Engine tự động thẩm định Socket, Chuẩn RAM, Chiều dài VGA, Khe
          tản nhiệt và Nguồn.
        </span>
      </div>
    </div>
  );
}
