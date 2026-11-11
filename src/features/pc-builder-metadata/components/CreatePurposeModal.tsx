import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Badge, Icon } from "@/components/ui";
import { money } from "@/utils";
import { CategoryHardwareIcon } from "./CategoryHardwareIcon";
import type { TemplateSlot, BudgetProfilePurpose } from "../types";

interface CreatePurposeModalProps {
  isOpen: boolean;
  slots: TemplateSlot[];
  existingProfiles: BudgetProfilePurpose[];
  maxBuildPrice?: number;
  onClose: () => void;
  onSave: (
    purpose: string,
    minBudget: number,
    shares: Record<number, number>
  ) => Promise<void>;
  isSaving: boolean;
}

export function CreatePurposeModal({
  isOpen,
  slots,
  existingProfiles,
  maxBuildPrice = 0,
  onClose,
  onSave,
  isSaving,
}: CreatePurposeModalProps) {
  const [purposeCode, setPurposeCode] = useState("");
  const [minBudget, setMinBudget] = useState<number>(15000000);
  const [shares, setShares] = useState<Record<number, number>>({});
  const [selectedTemplateToCopy, setSelectedTemplateToCopy] = useState<string>("");
  const [errors, setErrors] = useState<{ purpose?: string; minBudget?: string; shares?: string }>({});

  // Khởi tạo tỷ lệ ban đầu khi mở modal
  useEffect(() => {
    if (isOpen) {
      setPurposeCode("");
      setErrors({});

      // Lấy profile đầu tiên làm mẫu mặc định nếu có
      const defaultProfile = existingProfiles[0];
      if (defaultProfile) {
        setMinBudget(defaultProfile.minBudget || 15000000);
        setSelectedTemplateToCopy(defaultProfile.purpose);
        const initialShares: Record<number, number> = {};
        defaultProfile.slots.forEach((s) => {
          initialShares[s.slotId] = Number(s.sharePct) || 0;
        });
        // Bổ sung những slot chưa có trong defaultProfile (nếu có)
        slots.forEach((s) => {
          if (initialShares[s.id] === undefined) {
            initialShares[s.id] = 0;
          }
        });
        setShares(initialShares);
      } else {
        setMinBudget(15000000);
        const initialShares: Record<number, number> = {};
        const count = slots.length || 1;
        const avg = Math.floor((100 / count) * 10) / 10;
        slots.forEach((s) => {
          initialShares[s.id] = avg;
        });
        setShares(initialShares);
      }
    }
  }, [isOpen, existingProfiles, slots]);

  // Sao chép tỷ lệ từ mục đích có sẵn
  const handleApplyTemplate = () => {
    const target = existingProfiles.find((p) => p.purpose === selectedTemplateToCopy);
    if (!target) return;
    const copied: Record<number, number> = {};
    target.slots.forEach((s) => {
      copied[s.slotId] = Number(s.sharePct) || 0;
    });
    slots.forEach((s) => {
      if (copied[s.id] === undefined) {
        copied[s.id] = 0;
      }
    });
    setShares(copied);
    setMinBudget(target.minBudget || 15000000);
  };

  // Tính tổng phân bổ
  const totalAllocation = useMemo(() => {
    return Object.values(shares).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [shares]);

  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.01;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { purpose?: string; minBudget?: string; shares?: string } = {};

    const cleanCode = purposeCode.trim().toUpperCase();
    if (!cleanCode) {
      newErrors.purpose = "Vui lòng nhập mã mục đích (ví dụ: STREAMING, WORKSTATION)";
    } else if (existingProfiles.some((p) => p.purpose.toUpperCase() === cleanCode)) {
      newErrors.purpose = `Mã mục đích '${cleanCode}' đã tồn tại trong hệ thống!`;
    }

    if (minBudget <= 0) {
      newErrors.minBudget = "Ngân sách tối thiểu phải lớn hơn 0 VNĐ";
    } else if (maxBuildPrice > 0 && minBudget > maxBuildPrice) {
      newErrors.minBudget = `Ngân sách sàn đề xuất không được vượt quá giá trị bộ PC đắt nhất hiện tại (${money(maxBuildPrice)})`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave(cleanCode, minBudget, shares);
  };

  return (
    <Modal
      title="Thêm mục đích cấu hình ngân sách mới"
      onClose={onClose}
      className="create-purpose-modal"
    >
      <form onSubmit={handleSubmit} className="purpose-modal-form">
        {/* Phần 1: Thông tin cơ bản */}
        <div className="grid-2-col two-col mb-16">
          <div className="field">
            <label htmlFor="purpose-code" className="field-label">
              Mã mục đích (Code) <span className="req">*</span>
            </label>
            <input
              id="purpose-code"
              type="text"
              className="input full"
              placeholder="VD: STREAMING, WORKSTATION, AI_DATA..."
              value={purposeCode}
              onChange={(e) => {
                setPurposeCode(e.target.value.toUpperCase());
                if (errors.purpose) setErrors((prev) => ({ ...prev, purpose: undefined }));
              }}
              autoFocus
            />
            {errors.purpose ? (
              <small className="error-text">{errors.purpose}</small>
            ) : (
              <small className="muted">Mã viết hoa không dấu dùng cho AI định danh</small>
            )}
          </div>

          <div className="field">
            <label htmlFor="purpose-min-budget" className="field-label">
              Ngân sách sàn đề xuất (VNĐ) <span className="req">*</span>
            </label>
            <input
              id="purpose-min-budget"
              type="number"
              className="input full"
              step={500000}
              min={1000000}
              max={maxBuildPrice > 0 ? maxBuildPrice : undefined}
              value={minBudget}
              onChange={(e) => {
                setMinBudget(parseInt(e.target.value, 10) || 0);
                if (errors.minBudget) setErrors((prev) => ({ ...prev, minBudget: undefined }));
              }}
            />
            {errors.minBudget ? (
              <small className="error-text">{errors.minBudget}</small>
            ) : (
              <small className="muted">
                Giá sàn tối thiểu: <strong>{money(minBudget)}</strong>
                {maxBuildPrice > 0 && (
                  <> (Tối đa: <strong style={{ color: "var(--red, #d91f31)" }}>{money(maxBuildPrice)}</strong> theo PC đắt nhất)</>
                )}
              </small>
            )}
          </div>
        </div>

        {/* Tiện ích sao chép tỷ lệ mẫu */}
        {existingProfiles.length > 0 && (
          <div className="purpose-template-copy-bar row between items-center mb-16">
            <div className="row gap8 items-center">
              <Icon name="spark" />
              <span className="small font-medium text-dark">
                Sao chép tỷ lệ từ mục đích mẫu:
              </span>
              <select
                className="filter-select select-sm"
                value={selectedTemplateToCopy}
                onChange={(e) => setSelectedTemplateToCopy(e.target.value)}
              >
                {existingProfiles.map((p) => (
                  <option key={p.purpose} value={p.purpose}>
                    {p.label} ({p.purpose})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-action-icon"
              onClick={handleApplyTemplate}
              title="Áp dụng tỷ lệ từ mục đích đã chọn"
            >
              <Icon name="copy" />
              <span>Áp dụng mẫu</span>
            </button>
          </div>
        )}

        {/* Thanh trạng thái tổng tỷ lệ phân bổ ngân sách */}
        <div className="allocation-status-card mb-12">
          <div className="row between items-center mb-8">
            <div className="row gap8 items-center">
              <span className="font-semibold text-dark">
                Phân bổ ngân sách theo từng linh kiện:
              </span>
              <Badge tone={isValidAllocation ? "success" : "muted"}>
                {`Tổng: ${totalAllocation.toFixed(1)}%`}
              </Badge>
            </div>
            <span className="allocation-sum-value font-bold">
              {totalAllocation.toFixed(1)}%
            </span>
          </div>
          <div className="mini-progress-track full-width">
            <div
              className="mini-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, totalAllocation))}%` }}
            />
          </div>
        </div>

        {/* Bảng danh sách các slot để nhập tỷ lệ % */}
        <div className="modal-slot-shares-table-wrap mb-16">
          <table className="modal-slot-shares-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Thứ tự</th>
                <th>Linh kiện</th>
                <th style={{ width: "140px", textAlign: "right" }}>Tỷ lệ ngân sách (%)</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const currentPct = shares[slot.id] ?? 0;
                return (
                  <tr key={slot.id}>
                    <td>
                      <span className="step-order-badge">
                        {String(slot.stepOrder).padStart(2, "0")}
                      </span>
                    </td>
                    <td>
                      <div className="component-category-cell">
                        <span className="cat-icon-badge">
                          <CategoryHardwareIcon name={slot.categoryName} size={15} />
                        </span>
                        <span className="cat-name-text">{slot.categoryName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="share-input-cell row end gap6 items-center">
                        <input
                          type="number"
                          className="input input-share-pct"
                          min={0}
                          max={100}
                          step={0.5}
                          value={currentPct}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setShares((prev) => ({
                              ...prev,
                              [slot.id]: val,
                            }));
                            if (errors.shares) {
                              setErrors((prev) => ({ ...prev, shares: undefined }));
                            }
                          }}
                        />
                        <span className="small muted">%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="modal-actions-bar row end gap8">
          <Button
            type="button"
            tone="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            tone="primary"
            disabled={isSaving || !purposeCode.trim()}
          >
            <Icon name="check" />
            <span>{isSaving ? "Đang tạo..." : "Tạo mục đích"}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

