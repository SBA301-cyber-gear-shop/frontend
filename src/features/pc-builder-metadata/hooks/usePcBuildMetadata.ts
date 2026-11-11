import { useState, useEffect, useCallback } from "react";
import type {
  TemplateSlot,
  TemplateSlotFormData,
  BudgetProfilePurpose,
  BudgetProfileFormData,
  MetadataCategoryOptions,
} from "../types";
import * as api from "../api/pcBuildMetadataApi";

export function usePcBuildMetadata() {
  const [activeTab, setActiveTab] = useState<"slots" | "budget">("slots");
  const [slots, setSlots] = useState<TemplateSlot[]>([]);
  const [budgetProfiles, setBudgetProfiles] = useState<BudgetProfilePurpose[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<MetadataCategoryOptions | null>(null);
  const [maxBuildPrice, setMaxBuildPrice] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modal Slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TemplateSlot | null>(null);

  // Modal Budget Purpose
  const [isPurposeModalOpen, setIsPurposeModalOpen] = useState(false);
  const [selectedPurposeCode, setSelectedPurposeCode] = useState<string>("");

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [slotsData, profilesData, optionsData, pcConfig] = await Promise.all([
          api.getTemplateSlots(),
          api.getBudgetProfiles(),
          api.getAvailableCategoryOptions(),
          api.getPcBuildConfig().catch(() => null),
        ]);
        setSlots(slotsData);
        setBudgetProfiles(profilesData);
        setCategoryOptions(optionsData);
        if (pcConfig?.maxBuildPrice) {
          setMaxBuildPrice(pcConfig.maxBuildPrice);
        }

        // Chọn purpose đầu tiên mặc định nếu chưa chọn
        if (profilesData.length > 0) {
          setSelectedPurposeCode((prev) => {
            const exists = profilesData.some((p) => p.purpose === prev);
            return exists ? prev : profilesData[0].purpose;
          });
        }
      } catch (err: unknown) {
        const errMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Không thể tải dữ liệu cấu hình.";
        showToast(errMsg, "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Slot Handlers
  const handleOpenCreateSlot = () => {
    setEditingSlot(null);
    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: TemplateSlot) => {
    setEditingSlot(slot);
    setIsSlotModalOpen(true);
  };

  const handleCloseSlotModal = () => {
    setIsSlotModalOpen(false);
    setEditingSlot(null);
  };

  const handleSaveSlot = async (formData: TemplateSlotFormData, slotId?: number) => {
    setIsSaving(true);
    try {
      const targetId = slotId ?? editingSlot?.id;
      if (targetId) {
        await api.updateTemplateSlot(targetId, formData);
        showToast("Cập nhật slot linh kiện thành công!");
      } else {
        await api.createTemplateSlot(formData);
        showToast("Thêm mới slot linh kiện thành công!");
      }
      handleCloseSlotModal();
      await loadData(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Lưu cấu hình slot thất bại.";
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slot: TemplateSlot) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa slot '${slot.categoryName}' (Bước ${slot.stepOrder})?`)) {
      return;
    }
    try {
      await api.deleteTemplateSlot(slot.id);
      showToast(`Đã xóa slot '${slot.categoryName}' thành công.`);
      await loadData(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Xóa slot thất bại.";
      showToast(errMsg, "error");
    }
  };

  const handleReorderSlots = async (orderedSlotIds: number[]) => {
    setIsSaving(true);
    try {
      const updatedSlots = await api.reorderTemplateSlots(orderedSlotIds);
      setSlots(updatedSlots);
      showToast("Cập nhật thứ tự linh kiện thành công!");
      await loadData(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Cập nhật thứ tự thất bại.";
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Purpose Handlers
  const handleOpenCreatePurpose = () => {
    setIsPurposeModalOpen(true);
  };

  const handleClosePurposeModal = () => {
    setIsPurposeModalOpen(false);
  };

  const handleSavePurpose = async (formData: BudgetProfileFormData) => {
    setIsSaving(true);
    try {
      await api.createBudgetProfilePurpose(formData);
      showToast(`Tạo mới mục đích '${formData.purpose}' thành công!`);
      handleClosePurposeModal();
      await loadData(true);
      if (formData.purpose) {
        setSelectedPurposeCode(formData.purpose.toUpperCase());
      }
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Tạo mục đích thất bại.";
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCurrentPurpose = async (
    purpose: string,
    minBudget: number,
    slotShares: Record<number, number>
  ) => {
    setIsSaving(true);
    try {
      await api.updateBudgetProfilePurpose(purpose, { minBudget, slotShares });
      showToast(`Lưu phân bổ ngân sách cho mục đích '${purpose}' thành công!`);
      await loadData(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Lưu phân bổ ngân sách thất bại.";
      showToast(errMsg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePurpose = async (purpose: string) => {
    if (purpose === "GENERAL") {
      showToast("Không thể xóa mục đích mặc định bắt buộc GENERAL.", "error");
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn xóa toàn bộ hồ sơ mục đích '${purpose}'?`)) {
      return;
    }
    try {
      await api.deleteBudgetProfilePurpose(purpose);
      showToast(`Đã xóa mục đích '${purpose}' thành công.`);
      await loadData(true);
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Xóa mục đích thất bại.";
      showToast(errMsg, "error");
    }
  };

  return {
    activeTab,
    setActiveTab,
    slots,
    budgetProfiles,
    categoryOptions,
    maxBuildPrice,
    loading,
    isSaving,
    toast,
    dismissToast: () => setToast(null),
    // Slot modal
    isSlotModalOpen,
    editingSlot,
    handleOpenCreateSlot,
    handleOpenEditSlot,
    handleCloseSlotModal,
    handleSaveSlot,
    handleDeleteSlot,
    handleReorderSlots,
    // Purpose modal & edit
    isPurposeModalOpen,
    selectedPurposeCode,
    setSelectedPurposeCode,
    handleOpenCreatePurpose,
    handleClosePurposeModal,
    handleSavePurpose,
    handleUpdateCurrentPurpose,
    handleDeletePurpose,
  };
}

