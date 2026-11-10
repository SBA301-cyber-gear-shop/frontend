import { useState, useEffect, useMemo, useCallback } from "react";
import type { AiConfig, AiConfigFilter, AiConfigFormInput } from "../types";
import {
  getAiConfigs,
  createAiConfig,
  updateAiConfig,
  deleteAiConfig,
  toggleAiConfigStatus,
} from "../api";

export function useAiConfigManagement() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "warn" | "error" } | null>(null);

  // Bộ lọc
  const [filter, setFilter] = useState<AiConfigFilter>({
    search: "",
    configKey: "ALL",
    provider: "ALL",
    status: "ALL",
  });

  // Modal State
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingConfig, setEditingConfig] = useState<AiConfig | null>(null);
  const [previewPromptConfig, setPreviewPromptConfig] = useState<AiConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<AiConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load configs từ backend (silent = true để tải ngầm không nhấp nháy màn hình)
  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await getAiConfigs();
      setConfigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách cấu hình AI");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotice = (message: string, tone: "success" | "warn" | "error" = "success") => {
    setNotice({ message, tone });
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm, configKey và provider
  const filteredConfigs = useMemo(() => {
    return configs.filter((item) => {
      const keyword = filter.search.toLowerCase().trim();
      const matchSearch =
        !keyword ||
        item.configKey.toLowerCase().includes(keyword) ||
        item.configName.toLowerCase().includes(keyword) ||
        item.modelName.toLowerCase().includes(keyword) ||
        item.provider.toLowerCase().includes(keyword);

      const matchConfigKey =
        !filter.configKey ||
        filter.configKey === "ALL" ||
        item.configKey.toUpperCase() === filter.configKey.toUpperCase();

      const matchProvider =
        !filter.provider ||
        filter.provider === "ALL" ||
        item.provider.toUpperCase() === filter.provider.toUpperCase();

      const matchStatus =
        filter.status === "ALL" ||
        (filter.status === "ACTIVE" && item.isActive) ||
        (filter.status === "INACTIVE" && !item.isActive);

      return matchSearch && matchConfigKey && matchProvider && matchStatus;
    });
  }, [configs, filter]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = configs.length;
    const active = configs.filter((c) => c.isActive).length;
    const inactive = total - active;
    const providers = Array.from(new Set(configs.map((c) => c.provider))).length;
    return { total, active, inactive, providers };
  }, [configs]);

  // Lấy danh sách duy nhất các mã config_key từ toàn bộ model/config hiện có trong hệ thống
  const availableConfigKeys = useMemo(() => {
    const set = new Set<string>();
    configs.forEach((item) => {
      const k = (item.configKey || "").trim();
      if (k) {
        set.add(k);
      }
    });
    return Array.from(set).sort();
  }, [configs]);

  // Tự động reset configKey filter về "ALL" nếu configKey đang chọn không còn tồn tại
  useEffect(() => {
    if (
      filter.configKey &&
      filter.configKey !== "ALL" &&
      !availableConfigKeys.some((k) => k.toUpperCase() === filter.configKey.toUpperCase())
    ) {
      setFilter((prev) => ({ ...prev, configKey: "ALL" }));
    }
  }, [availableConfigKeys, filter.configKey]);

  // Lấy danh sách duy nhất các nhà cung cấp từ toàn bộ model/config hiện có trong hệ thống
  const availableProviders = useMemo(() => {
    const map = new Map<string, string>();
    configs.forEach((item) => {
      const p = (item.provider || "").trim();
      if (p) {
        const upper = p.toUpperCase();
        if (!map.has(upper)) {
          map.set(upper, p);
        }
      }
    });
    return Array.from(map.values()).sort();
  }, [configs]);

  // Tự động reset provider filter về "ALL" nếu provider đang chọn không còn tồn tại
  useEffect(() => {
    if (
      filter.provider !== "ALL" &&
      !availableProviders.some((p) => p.toUpperCase() === filter.provider.toUpperCase())
    ) {
      setFilter((prev) => ({ ...prev, provider: "ALL" }));
    }
  }, [availableProviders, filter.provider]);

  // Hành động mở modal
  const openCreateModal = () => {
    setEditingConfig(null);
    setModalMode("create");
  };

  const openEditModal = (config: AiConfig) => {
    setEditingConfig(config);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingConfig(null);
  };

  // Lưu cấu hình (Tạo mới hoặc Sửa)
  const handleSave = async (formData: AiConfigFormInput) => {
    try {
      setIsSubmitting(true);
      if (modalMode === "create") {
        const created = await createAiConfig(formData);
        showNotice(`Đã thêm cấu hình '${created.configName}' thành công!`);
      } else if (modalMode === "edit" && editingConfig) {
        const updated = await updateAiConfig(editingConfig.id, formData);
        showNotice(`Đã cập nhật cấu hình '${updated.configName}' thành công!`);
      }
      closeModal();
      await loadData(true);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Thao tác thất bại", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa cấu hình
  const handleDelete = async (config: AiConfig) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cấu hình '${config.configName}' (${config.configKey}) không?`)) {
      return;
    }
    try {
      await deleteAiConfig(config.id);
      showNotice(`Đã xóa cấu hình '${config.configName}'`);
      await loadData(true);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Không thể xóa cấu hình", "error");
    }
  };

  // Bật/tắt trạng thái isActive (hoán đổi tự động cấu hình cùng key)
  const handleToggleActive = async (config: AiConfig) => {
    const nextState = !config.isActive;

    // Optimistic Update: Chuyển đổi trạng thái ngay lập tức trên UI để không bị giật/nhấp nháy
    setConfigs((prev) =>
      prev.map((item) => {
        if (item.id === config.id) {
          return { ...item, isActive: nextState };
        }
        if (nextState && item.configKey.toUpperCase() === config.configKey.toUpperCase()) {
          return { ...item, isActive: false };
        }
        return item;
      })
    );

    try {
      const updated = await toggleAiConfigStatus(config.id, nextState);
      showNotice(
        `Đã ${updated.isActive ? "kích hoạt" : "tạm dừng"} cấu hình '${updated.configName}'`
      );
      await loadData(true);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Không thể thay đổi trạng thái kích hoạt", "error");
      await loadData(true);
    }
  };

  return {
    configs,
    filteredConfigs,
    availableConfigKeys,
    availableProviders,
    loading,
    error,
    notice,
    filter,
    setFilter,
    stats,
    modalMode,
    editingConfig,
    previewPromptConfig,
    setPreviewPromptConfig,
    testingConfig,
    setTestingConfig,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleActive,
    reload: loadData,
  };
}
