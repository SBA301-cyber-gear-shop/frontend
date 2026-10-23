import { useState } from "react";
import { usePcBuilder } from "../hooks/usePcBuilder";
import { BuilderToolbar } from "./BuilderToolbar";
import { AiInsightPanel } from "./AiInsightPanel";
import { AiLoadingBox } from "./AiLoadingBox";
import { AiErrorBox } from "./AiErrorBox";
import { PartsTable } from "./PartsTable";
import { SummaryCard } from "./SummaryCard";
import { ReplacePartModal } from "./ReplacePartModal";
import { SavedBuildsList } from "./SavedBuildsList";

export function PcBuilder() {
  const [activeTab, setActiveTab] = useState<"builder" | "saved">("builder");

  const {
    budget,
    setBudget,
    purpose,
    setPurpose,
    ramGb,
    setRamGb,
    userPrompt,
    setUserPrompt,
    status,
    errorMessage,
    isBusy,
    isFetchingCandidates,
    buildParts,
    aiInsight,
    activeReplaceRole,
    isModalOpen,
    isSaved,
    grandTotal,
    remainingBudget,
    rules,
    allRulesPassed,
    modalCandidates,
    handleAiSuggest,
    handleReset,
    openReplaceModal,
    closeReplaceModal,
    selectReplacement,
    updateQuantity,
    handleAddToCart,
    handleSaveBuild,
    loadSavedBuildIntoBuilder,
    addSavedBuildToCart,
  } = usePcBuilder();

  return (
    <div className="pc-builder-container">
      {/* 1. BREADCRUMB */}
      <div className="breadcrumb">
        <a href="#home">Trang chủ</a>
        <span>/</span>
        <a href="#parts">Xây dựng cấu hình</a>
        <span>/</span>
        <span>AI PC Builder</span>
      </div>

      {/* 3. TIÊU ĐỀ TRANG */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            AI PC Builder — Cấu hình chuẩn xác từ kho thực tế
          </h1>
          <p className="page-sub">
            Nhập mong muốn và ngân sách của bạn, AI sẽ tự động tính toán tương
            thích phần cứng và đề xuất dàn máy tối ưu nhất.
          </p>
        </div>
        <div className="badge-ai">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
          </svg>
          <span>AI POWERED 2.0</span>
        </div>
      </div>

      {/* 4. THANH CHUYỂN TAB: TẠO CẤU HÌNH AI / CẤU HÌNH ĐÃ LƯU */}
      <div className="builder-tabs" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "builder" ? "active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
          </svg>
          <span>Tạo cấu hình mới (AI)</span>
        </button>

        <button
          type="button"
          className={`builder-tab-btn ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>Cấu hình đã lưu của tôi</span>
        </button>
      </div>

      {/* TAB 1: TẠO CẤU HÌNH MỚI (AI) */}
      {activeTab === "builder" && (
        <>
          {/* THANH NHẬP THÔNG MINH CHO AI (BUILDER TOOLBAR) */}
          <BuilderToolbar
            budget={budget}
            onBudgetChange={setBudget}
            purpose={purpose}
            onPurposeChange={setPurpose}
            ramGb={ramGb}
            onRamGbChange={setRamGb}
            userPrompt={userPrompt}
            onPromptChange={setUserPrompt}
            onSubmit={handleAiSuggest}
            isBusy={isBusy}
          />

          {/* CÁC TRẠNG THÁI HIỂN THỊ */}
          {status === "loading" && <AiLoadingBox />}

          {status === "empty" && (
            <div className="builder-empty-state">
              <div className="builder-empty-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                  <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
                </svg>
              </div>
              <h3>Chưa có cấu hình nào được thiết lập</h3>
              <p>
                Hãy nhập mức ngân sách và mô tả mong muốn của bạn ở thanh công cụ
                phía trên, sau đó nhấn <strong>"Đề xuất cấu hình với AI"</strong> để
                nhận cấu hình tối ưu tức thì từ kho hàng thực tế.
              </p>
              <button
                type="button"
                className="btn-ai-submit"
                onClick={handleAiSuggest}
              >
                Bắt đầu đề xuất với AI
              </button>
            </div>
          )}

          {status === "error" && (
            <AiErrorBox
              message={errorMessage}
              onRetry={handleAiSuggest}
              onReset={handleReset}
            />
          )}

          {status === "success" && buildParts.length > 0 && (
            <>
              {/* THẺ NHẬN XÉT CỦA CHUYÊN GIA AI */}
              {aiInsight && <AiInsightPanel insight={aiInsight} />}

              {/* BỐ CỤC CHIA ĐÔI: BẢNG LINH KIỆN & SIDEBAR TỔNG QUAN */}
              <div className="builder-split" id="builderMainSplit">
                <PartsTable
                  parts={buildParts}
                  onReplacePart={openReplaceModal}
                  onUpdateQuantity={updateQuantity}
                />

                <SummaryCard
                  budget={budget}
                  grandTotal={grandTotal}
                  remainingBudget={remainingBudget}
                  rules={rules}
                  allRulesPassed={allRulesPassed}
                  isSaved={isSaved}
                  onAddToCart={handleAddToCart}
                  onSaveBuild={handleSaveBuild}
                />
              </div>
            </>
          )}

          {/* MODAL THAY LINH KIỆN THÔNG MINH */}
          <ReplacePartModal
            isOpen={isModalOpen}
            role={activeReplaceRole}
            candidates={modalCandidates}
            isLoading={isFetchingCandidates}
            onSelect={selectReplacement}
            onClose={closeReplaceModal}
          />
        </>
      )}

      {/* TAB 2: CẤU HÌNH ĐÃ LƯU CỦA TÔI */}
      {activeTab === "saved" && (
        <SavedBuildsList
          onLoadToBuilder={(detail) => {
            loadSavedBuildIntoBuilder(detail);
            setActiveTab("builder");
          }}
          onSwitchToBuilder={() => setActiveTab("builder")}
          onAddToCart={addSavedBuildToCart}
        />
      )}
    </div>
  );
}
