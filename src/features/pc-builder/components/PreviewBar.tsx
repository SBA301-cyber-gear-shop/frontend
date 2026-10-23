import type { BuilderStatus } from "../types/pcBuilder.types";

interface PreviewBarProps {
  status: BuilderStatus;
  onSwitchState: (state: BuilderStatus) => void;
  onOpenModal: () => void;
}

export function PreviewBar({
  status,
  onSwitchState,
  onOpenModal,
}: PreviewBarProps) {
  return (
    <div className="preview-bar">
      <div className="preview-info">
        <span className="preview-pill">Bản xem trước UI Docs</span>
        <span className="preview-title">
          Màn hình: <strong>AI PC Builder & Rule Engine</strong> (Đồng bộ theo{" "}
          <code>AI_PC_BUILDER_CODE_IMPLEMENTATION_GUIDE.md</code>)
        </span>
      </div>
      <div className="preview-actions">
        <button
          type="button"
          className={`preview-btn ${status === "success" ? "active" : ""}`}
          onClick={() => onSwitchState("success")}
        >
          ✨ Kết quả AI Đầy đủ
        </button>
        <button
          type="button"
          className={`preview-btn ${status === "loading" ? "active" : ""}`}
          onClick={() => onSwitchState("loading")}
        >
          ⏳ Trạng thái AI Loading
        </button>
        <button
          type="button"
          className={`preview-btn ${status === "empty" ? "active" : ""}`}
          onClick={() => onSwitchState("empty")}
        >
          📄 Trạng thái ban đầu
        </button>
        <button
          type="button"
          className={`preview-btn ${status === "error" ? "active" : ""}`}
          onClick={() => onSwitchState("error")}
        >
          ⚠️ Trạng thái AI Lỗi
        </button>
        <button
          type="button"
          className="preview-btn"
          onClick={onOpenModal}
        >
          🔄 Bật Modal Thay linh kiện
        </button>
      </div>
    </div>
  );
}
