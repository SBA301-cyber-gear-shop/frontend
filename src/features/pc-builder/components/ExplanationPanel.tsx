interface ExplanationPanelProps {
  /** Lời giải thích bước 8 của /builds/auto (AI viết hoặc câu mẫu khi số liệu AI sai). */
  message: string;
  /** Khách đã đổi món: lời giải thích tả bộ PC lúc tự build, không còn đúng từng món. */
  isEdited: boolean;
}

export function ExplanationPanel({ message, isEdited }: ExplanationPanelProps) {
  return (
    <div className="ai-insight-panel" id="aiInsightPanel">
      <div className="ai-header-row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
          <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
        </svg>
        <span className="ai-eyebrow">CHUYÊN GIA AI CYBERSHOP TƯ VẤN</span>
      </div>
      <p className="ai-reasoning" id="aiBuildReasoning">
        {message}
      </p>
      {isEdited && (
        <p className="ai-reason-note" id="aiEditedNote">
          Bạn đã thay đổi linh kiện. Lời tư vấn trên mô tả cấu hình ban đầu; tổng tiền và kiểm tra tương thích bên
          dưới là của cấu hình hiện tại.
        </p>
      )}
    </div>
  );
}
