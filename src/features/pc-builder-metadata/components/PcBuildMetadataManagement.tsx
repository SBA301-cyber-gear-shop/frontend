import { usePcBuildMetadata } from "../hooks/usePcBuildMetadata";
import { UnifiedMetadataTable } from "./UnifiedMetadataTable";
import { Toast } from "@/components/ui";

export function PcBuildMetadataManagement() {
  const {
    slots,
    budgetProfiles,
    categoryOptions,
    maxBuildPrice,
    loading,
    isSaving,
    toast,
    dismissToast,
    handleSaveSlot,
    handleDeleteSlot,
    handleReorderSlots,
    handleSavePurpose,
    handleUpdateCurrentPurpose,
    handleDeletePurpose,
  } = usePcBuildMetadata();

  return (
    <div className="metadata-management-wrapper">
      {/* Toast chuẩn TechZone Pro */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      {loading ? (
        <div className="loading-state" style={{ padding: "60px 0", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
          <p className="muted">Đang tải dữ liệu metadata...</p>
        </div>
      ) : (
        <UnifiedMetadataTable
          slots={slots}
          profiles={budgetProfiles}
          categoryOptions={categoryOptions}
          maxBuildPrice={maxBuildPrice}
          onSaveSlot={handleSaveSlot}
          onDeleteSlot={handleDeleteSlot}
          onReorderSlots={handleReorderSlots}
          onUpdatePurpose={handleUpdateCurrentPurpose}
          onDeletePurpose={handleDeletePurpose}
          onSaveNewPurpose={async (purpose, minBudget, shares) => {
            await handleSavePurpose({ purpose, minBudget, slotShares: shares });
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
