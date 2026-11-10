import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/ui";

const CONFIG_KEY_OPTIONS = [
  { value: "PC_BUILD_ANA", label: "PC_BUILD_ANA — Phân tích nhu cầu PC" },
  { value: "CHAT_BOX", label: "CHAT_BOX — CyberBot CSKH & Hỗ trợ kỹ thuật" },
  { value: "PC_BUILD_EXPLAIN", label: "PC_BUILD_EXPLAIN — Tóm tắt cấu hình & linh kiện" },
  { value: "EMBEDDING_CONFIG", label: "EMBEDDING_CONFIG — Sinh Vector 768D (RAG tri thức & kho hàng)" },
];

export function AiConfigModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
  isSubmitting,
}) {
  const [formData, setFormData] = useState({
    configKey: "PC_BUILD_ANA",
    configName: "",
    provider: "",
    modelName: "gemini-3.5-flash-lite",
    apiKey: "",
    systemPrompt: "",
    isActive: true,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        configKey: initialData.configKey,
        configName: initialData.configName,
        provider: initialData.provider,
        modelName: initialData.modelName,
        apiKey: initialData.apiKey,
        systemPrompt: initialData.systemPrompt || "",
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        configKey: "PC_BUILD_ANA",
        configName: "",
        provider: "",
        modelName: "gemini-3.5-flash-lite",
        apiKey: "",
        systemPrompt: "",
        isActive: true,
      });
    }
    setErrors({});
    setShowApiKey(false);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.configName.trim()) {
      errs.configName = "Vui lòng nhập tên chức năng";
    }
    if (!formData.configKey.trim()) {
      errs.configKey = "Vui lòng chọn mã định danh";
    }
    if (!formData.provider.trim()) {
      errs.provider = "Vui lòng nhập nhà cung cấp";
    }
    if (!formData.modelName.trim()) {
      errs.modelName = "Vui lòng nhập tên model";
    }
    if (!formData.apiKey.trim()) {
      errs.apiKey = "Vui lòng nhập API Key";
    }
    if (formData.configKey !== "EMBEDDING_CONFIG" && !formData.systemPrompt.trim()) {
      errs.systemPrompt = "System Prompt không được để trống";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      systemPrompt: formData.configKey === "EMBEDDING_CONFIG" && !formData.systemPrompt.trim() ? null : formData.systemPrompt,
    });
  };

  return (
    <Modal
      title={mode === "create" ? "Thêm cấu hình AI" : "Chỉnh sửa cấu hình AI"}
      onClose={onClose}
      className="ai-config-form-modal"
    >
      <form onSubmit={handleSubmit} className="ai-config-form">
        <div className="grid-2-col two-col">
          {/* Tên chức năng: dạng text */}
          <div className="field">
            <label htmlFor="cfg-name">
              Tên chức năng <span className="req">*</span>
            </label>
            <input
              id="cfg-name"
              type="text"
              className="input"
              value={formData.configName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, configName: e.target.value }))
              }
              placeholder="VD: Phân tích nhu cầu PC Build"
            />
            {errors.configName && (
              <small className="error-text">{errors.configName}</small>
            )}
          </div>

          {/* Mã định danh: dạng select lựa chọn các key hệ thống */}
          <div className="field">
            <label htmlFor="cfg-key">
              Mã định danh (config_key) <span className="req">*</span>
            </label>
            <select
              id="cfg-key"
              className="input code-font"
              value={formData.configKey}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, configKey: e.target.value }))
              }
              disabled={mode === "edit"}
            >
              <option value="">-- Chọn mã định danh --</option>
              {CONFIG_KEY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.configKey && (
              <small className="error-text">{errors.configKey}</small>
            )}
          </div>
        </div>

        <div className="grid-2-col two-col">
          {/* Nhà cung cấp: dạng text thuần túy */}
          <div className="field">
            <label htmlFor="cfg-provider">
              Nhà cung cấp <span className="req">*</span>
            </label>
            <input
              id="cfg-provider"
              type="text"
              className="input"
              value={formData.provider}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, provider: e.target.value }))
              }
              placeholder="VD: GEMINI, OPENAI..."
            />
            {errors.provider && (
              <small className="error-text">{errors.provider}</small>
            )}
          </div>

          {/* Tên mô hình (Model): dạng text */}
          <div className="field">
            <label htmlFor="cfg-model">
              Tên mô hình (Model) <span className="req">*</span>
            </label>
            <input
              id="cfg-model"
              type="text"
              className="input code-font"
              value={formData.modelName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, modelName: e.target.value }))
              }
              placeholder="VD: gemini-3.5-flash-lite, gpt-4o..."
            />
            {errors.modelName && (
              <small className="error-text">{errors.modelName}</small>
            )}
          </div>
        </div>

        {/* API Key: dạng text/password */}
        <div className="field">
          <label htmlFor="cfg-apikey">
            API Key <span className="req">*</span>
          </label>
          <div className={`input-group ${errors.apiKey ? "has-error" : ""}`}>
            <input
              id="cfg-apikey"
              type={showApiKey ? "text" : "password"}
              className="input code-font"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="Nhập khóa API (VD: AQ.Ab8... hoặc sk-proj-...)"
            />
            <button
              type="button"
              className="input-group-btn"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? "Ẩn" : "Hiện"}
            </button>
          </div>
          {errors.apiKey && (
            <small className="error-text">{errors.apiKey}</small>
          )}
        </div>

        {/* System Prompt */}
        <div className="field">
          <div className="between">
            <label htmlFor="cfg-prompt">
              System Prompt
            </label>
            <span className="small muted">
              {formData.systemPrompt.length} ký tự
            </span>
          </div>
          <textarea
            id="cfg-prompt"
            className="input textarea-field prompt-textarea"
            rows={5}
            value={formData.systemPrompt}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                systemPrompt: e.target.value,
              }))
            }
            placeholder="Nội dung chỉ dẫn hệ thống..."
          />
          {errors.systemPrompt && (
            <small className="error-text">{errors.systemPrompt}</small>
          )}
        </div>

        {/* Trạng thái Bật/Tắt */}
        <div className="field-checkbox row">
          <label className="switch-label">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            <span className="switch-text">Kích hoạt cấu hình này</span>
          </label>
        </div>

        {/* Modal Buttons */}
        <div className="ai-config-modal-actions">
          <Button type="button" tone="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" tone="primary" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
