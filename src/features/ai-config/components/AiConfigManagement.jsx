import { Badge, Button, Icon, Toast } from "@/components/ui";
import { useAiConfigManagement } from "../hooks";
import { AiConfigModal } from "./AiConfigModal";

export function AiConfigManagement() {
  const {
    filteredConfigs,
    availableConfigKeys,
    loading,
    error,
    notice,
    dismissNotice,
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
      {/* 1. Header chuẩn TechZone Pro */}
      <div className="page-head between">
        <div>
          <div className="eyebrow">QUẢN TRỊ / CẤU HÌNH AI & PROMPT</div>
          <h1>Cấu hình AI & Prompt</h1>
          <p className="muted">
            Quản lý các mô hình ngôn ngữ lớn (LLM), API Key và System Prompt cho các tính năng thông minh
          </p>
        </div>
        <Button tone="primary" onClick={openCreateModal}>
          <Icon name="plus" />
          <span>Thêm cấu hình</span>
        </Button>
      </div>

      {/* 2. Thông báo dạng Toast chính thức của hệ thống */}
      {notice && (
        <Toast
          message={notice.message}
          type={notice.tone === "warn" ? "info" : notice.tone}
          onClose={dismissNotice}
        />
      )}

      {/* 3. Thanh tìm kiếm & lọc tinh gọn */}
      <div className="ai-toolbar-minimal row between wrap-row">
        <div className="search-box-wrap">
          <Icon name="search" />
          <input
            type="text"
            className="input search-input"
            placeholder="Tìm theo tên chức năng, mã định danh, model..."
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

      {/* 4. Bảng dữ liệu đồng bộ chuẩn TechZone */}
      <div className="ai-table-card">
        {loading ? (
          <div className="loading-state" style={{ padding: "48px 0", textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
            <p className="muted">Đang tải danh sách cấu hình AI...</p>
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
                  <tr key={config.id} className="ai-config-row">
                    {/* Cột 1: Tên + Icon Spark + Mã Key */}
                    <td>
                      <div className="config-identity-cell">
                        <div className="config-title-row">
                          <span className="ai-icon-chip">
                            <Icon name="spark" />
                          </span>
                          <span className="config-name-text">{config.configName}</span>
                        </div>
                        <span className="code-badge">{config.configKey}</span>
                      </div>
                    </td>

                    {/* Cột 2: Provider & Model */}
                    <td>
                      <div className="model-identity-cell">
                        <span className={getProviderBadgeClass(config.provider)}>
                          {config.provider}
                        </span>
                        <span className="model-name-text">{config.modelName}</span>
                      </div>
                    </td>

                    {/* Cột 3: Trạng thái (Bấm để bật/tắt nhanh) */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="toggle-switch-btn"
                        onClick={() => handleToggleActive(config)}
                        title="Bấm để đổi trạng thái kích hoạt"
                      >
                        <Badge tone={config.isActive ? "success" : "muted"}>
                          {config.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </button>
                    </td>

                    {/* Cột 4: Thao tác với icon Sửa / Xóa chuẩn TechZone */}
                    <td style={{ textAlign: "center" }}>
                      <div className="action-buttons-wrap">
                        <button
                          type="button"
                          className="btn-action-icon"
                          title="Sửa cấu hình AI"
                          onClick={() => openEditModal(config)}
                        >
                          <Icon name="edit" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon danger"
                          title="Xóa cấu hình"
                          onClick={() => handleDelete(config)}
                        >
                          <Icon name="trash" />
                          <span>Xóa</span>
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

      {/* Modal chỉnh sửa & thêm cấu hình AI */}
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
