export function AiLoadingBox() {
  return (
    <div className="ai-loading-box" id="aiLoadingBox">
      <div className="loading-spinner" />
      <h3 className="ai-loading-title">
        AI đang phân tích kho linh kiện & thẩm định tương thích...
      </h3>
      <p className="ai-loading-desc">
        Đang chạy thuật toán Budget Heuristic, đối chiếu các quy tắc phần cứng
        và triệu gọi Google Gemini 2.0 Flash.
      </p>
    </div>
  );
}
