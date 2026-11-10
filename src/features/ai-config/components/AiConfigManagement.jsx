import { useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useAiConfigManagement } from "../hooks";
import { AiConfigModal } from "./AiConfigModal";

export function AiConfigManagement() {
  const {
    filteredConfigs,
    availableConfigKeys,
    loading,
    error,
    notice,
    setFilter,
    filter,
    modalMode,
    editingConfig,
    isSubmitting,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    handleDelete,
    handleToggleActive,
  } = useAiConfigManagement();

  const getProviderBadgeClass = (provider) => {
    switch (String(provider || "").toUpperCase()) {
      case "GEMINI":
        return "provider-badge gemini";
      case "OPENAI":
        return "provider-badge openai";
      case "ANTHROPIC":
        return "provider-badge anthropic";
      case "DEEPSEEK":
        return "provider-badge deepseek";
      default:
        return "provider-badge custom";
    }
  };

  return (
    <div className="ai-config-management">
      {/* Header tối giản: Tiêu đề + Nút Thêm */}
      <div className="ai-config-header row between">
        <h1>Cấu hình AI</h1>
        <Button tone="primary" onClick={openCreateModal}>
          + Thêm cấu hình
        </Button>
      </div>

      {/* Thông báo dạng Toast nổi ở góc dưới màn hình */}
      {notice && (
        <div className={`ai-toast-corner ${notice.tone}`}>
          <span className="toast-icon">
            {notice.tone === "error" ? "✕" : "✓"}
          </span>
          <span className="toast-message">{notice.message}</span>
        </div>
      )}

      {/* Thanh tìm kiếm & lọc tinh gọn */}
      <div className="ai-toolbar-minimal row between wrap-row">
        <div className="search-input-wrap">
          <input
            type="text"
            className="input"
            placeholder="Tìm theo tên, mã key, model..."
            value={filter.search}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>

        <select
          className="filter-select"
          value={filter.configKey}
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, configKey: e.target.value }))
          }
        >
          <option value="ALL">Tất cả chức năng (config_key)</option>
          {availableConfigKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      {/* Bảng dữ liệu tối giản: Không thông tin trùng lặp, không nút trùng chức năng */}
      <div className="ai-table-card">
        {loading ? (
          <div className="ai-empty-state">
            <p>Đang tải danh sách...</p>
          </div>
        ) : error ? (
          <div className="ai-empty-state">
            <p className="error-text">{error}</p>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="ai-empty-state">
            <p className="muted">Không có cấu hình nào phù hợp.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="ai-table">
              <thead>
                <tr>
                  <th style={{ width: "42%" }}>Chức năng & Mã định danh</th>
                  <th style={{ width: "26%" }}>Mô hình AI</th>
                  <th style={{ width: "16%", textAlign: "center" }}>Trạng thái</th>
                  <th style={{ width: "16%", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.map((config) => (
                  <tr key={config.id}>
                    {/* Cột 1: Gom Tên + Mã Key vào 1 chỗ để không dàn trải */}
                    <td>
                      <div className="config-identity-cell">
                        <span className="config-name-text">{config.configName}</span>
                        <span className="code-badge">{config.configKey}</span>
                      </div>
                    </td>

                    {/* Cột 2: Provider & Model */}
                    <td>
                      <div className="model-identity-cell">
                        <span className={getProviderBadgeClass(config.provider)}>
                          {config.provider}
                        </span>
                        <span className="code-font">{config.modelName}</span>
                      </div>
                    </td>

                    {/* Cột 3: Trạng thái (Bấm để bật/tắt nhanh) */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="toggle-switch-btn"
                        onClick={() => handleToggleActive(config)}
                        title="Bấm để đổi trạng thái"
                      >
                        <Badge tone={config.isActive ? "success" : "muted"}>
                          {config.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </button>
                    </td>

                    {/* Cột 4: Thao tác duy nhất (Căn giữa cân đối) */}
                    <td style={{ textAlign: "center" }}>
                      <div className="action-buttons-wrap">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => openEditModal(config)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() => handleDelete(config)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal duy nhất: Xem, chỉnh sửa và thử nghiệm prompt trọn gói */}
      <AiConfigModal
        isOpen={modalMode !== null}
        mode={modalMode}
        initialData={editingConfig}
        onClose={closeModal}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
