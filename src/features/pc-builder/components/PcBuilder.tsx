import { Notice } from "@/components/ui";
import { usePcBuilder } from "../hooks/usePcBuilder";
import { BuilderToolbar } from "./BuilderToolbar";
import { AnalysisPanel } from "./AnalysisPanel";
import { ExplanationPanel } from "./ExplanationPanel";
import { AiLoadingBox } from "./AiLoadingBox";
import { AiErrorBox } from "./AiErrorBox";
import { PartsTable } from "./PartsTable";
import { SummaryCard, buildVerdict } from "./SummaryCard";
import { ReplacePartModal } from "./ReplacePartModal";
import { ConfirmOverBudgetModal } from "./ConfirmOverBudgetModal";

export function PcBuilder() {
  const builder = usePcBuilder();
  const { build, analysis, phase, replace, confirm } = builder;
  const verdict = buildVerdict(build, builder.isChecking, builder.checkError);

  return (
    <div className="pc-builder-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI PC Builder — Cấu hình chuẩn xác từ kho thực tế</h1>
          <p className="page-sub">
            Nhập ngân sách và mô tả nhu cầu của bạn. AI hiểu nhu cầu và viết lời tư vấn; hệ thống chọn linh kiện còn
            hàng và kiểm tra tương thích phần cứng.
          </p>
        </div>
        <div className="badge-ai">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />
          </svg>
          <span>AI POWERED</span>
        </div>
      </div>

      {builder.demoMode && (
        <Notice tone="warning">
          Bản demo chạy không có backend nên chưa dùng được AI Build PC. Tắt VITE_USE_DEMO_DATA và chạy backend để
          dùng chức năng này.
        </Notice>
      )}

      <BuilderToolbar
        budget={builder.budget}
        onBudgetChange={builder.setBudget}
        message={builder.message}
        onMessageChange={builder.setMessage}
        onSubmit={() => builder.submit()}
        isBusy={builder.isBusy}
        disabled={builder.demoMode}
      />

      {phase === "loading" && <AiLoadingBox step={builder.step} />}

      {phase === "idle" && (
        <div className="builder-empty-state">
          <div className="builder-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12" rx="2" />
              <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
            </svg>
          </div>
          <h3>Chưa có cấu hình nào được thiết lập</h3>
          <p>
            Nhập ngân sách và mô tả nhu cầu ở phía trên, sau đó nhấn <strong>"Đề xuất cấu hình với AI"</strong> để
            nhận cấu hình từ kho hàng thực tế.
          </p>
        </div>
      )}

      {analysis && phase !== "loading" && (
        <AnalysisPanel
          analysis={analysis}
          isBusy={builder.isBusy}
          onUseBudget={(value) => builder.submit(value)}
          onPickPurpose={builder.buildWithPurpose}
        />
      )}

      {phase === "error" && builder.error && (
        <AiErrorBox
          error={builder.error}
          retryLockedUntil={builder.retryLockedUntil}
          isBusy={builder.isBusy}
          onRetry={builder.retry}
          onReset={builder.reset}
        />
      )}

      {phase === "done" && build && (
        <>
          {builder.explanation && <ExplanationPanel message={builder.explanation} isEdited={builder.isEdited} />}

          <div className="builder-split" id="builderMainSplit">
            <PartsTable
              items={build.items}
              verdict={verdict}
              disabled={builder.isBusy}
              onReplace={builder.openReplace}
              onChangeQty={builder.changeQty}
            />
            <SummaryCard
              build={build}
              isChecking={builder.isChecking}
              checkError={builder.checkError}
              savedBuildId={builder.savedBuildId}
              isSaving={builder.isSaving}
              isAdding={builder.isAdding}
              disabled={builder.isBusy}
              onRecheck={builder.recheck}
              onAddToCart={builder.addToCart}
              onSave={builder.save}
            />
          </div>
        </>
      )}

      {replace && (
        <ReplacePartModal
          category={replace.category}
          current={build?.items[replace.index] ?? null}
          options={replace.options}
          isLoading={replace.loading}
          error={replace.error}
          onSelect={builder.chooseReplacement}
          onClose={builder.closeReplace}
        />
      )}

      {confirm && (
        <ConfirmOverBudgetModal
          message={confirm.message}
          isBusy={builder.isBusy}
          onContinue={builder.confirmContinue}
          onCancel={builder.cancelConfirm}
        />
      )}
    </div>
  );
}
