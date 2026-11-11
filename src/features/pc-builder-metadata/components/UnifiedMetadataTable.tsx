import { useState, useEffect, Fragment } from "react";
import { Button, Badge, Icon } from "@/components/ui";
import { money } from "@/utils";
import { CategoryHardwareIcon } from "./CategoryHardwareIcon";
import { CreatePurposeModal } from "./CreatePurposeModal";
import type {
  TemplateSlot,
  BudgetProfilePurpose,
  TemplateSlotFormData,
  MetadataCategoryOptions,
} from "../types";

interface UnifiedMetadataTableProps {
  slots: TemplateSlot[];
  profiles: BudgetProfilePurpose[];
  categoryOptions: MetadataCategoryOptions | null;
  maxBuildPrice?: number;
  onSaveSlot: (data: TemplateSlotFormData, slotId?: number) => Promise<void>;
  onDeleteSlot: (slot: TemplateSlot) => void;
  onReorderSlots: (orderedSlotIds: number[]) => Promise<void>;
  onUpdatePurpose: (
    purpose: string,
    minBudget: number,
    shares: Record<number, number>
  ) => Promise<void>;
  onDeletePurpose: (purpose: string) => void;
  onSaveNewPurpose: (
    purpose: string,
    minBudget: number,
    shares: Record<number, number>
  ) => Promise<void>;
  isSaving: boolean;
}

function getPurposeIcon(purpose: string) {
  const p = (purpose || "").toUpperCase();
  if (p.includes("GAME") || p.includes("GAMING")) return "spark";
  if (p.includes("WORK") || p.includes("OFFICE") || p.includes("VAN_PHONG")) return "briefcase";
  if (p.includes("RENDER") || p.includes("GRAPHIC") || p.includes("DO_HOA")) return "layers";
  return "chip";
}

export function UnifiedMetadataTable({
  slots,
  profiles,
  categoryOptions,
  maxBuildPrice,
  onSaveSlot,
  onDeleteSlot,
  onReorderSlots,
  onUpdatePurpose,
  onDeletePurpose,
  onSaveNewPurpose,
  isSaving,
}: UnifiedMetadataTableProps) {
  // Purpose đang chọn xem
  const [selectedPurpose, setSelectedPurpose] = useState<string>("GAMING");

  // State danh sách slot hiển thị (phục vụ kéo thả reorder)
  const [localSlots, setLocalSlots] = useState<TemplateSlot[]>(slots);

  // Drag and Drop state
  const [draggedSlotId, setDraggedSlotId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedHeight, setDraggedHeight] = useState<number>(54);

  // State sửa slot inline
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [slotEditForm, setSlotEditForm] = useState<TemplateSlotFormData | null>(null);

  // State sửa toàn bộ phân bổ ngân sách inline
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editMinBudget, setEditMinBudget] = useState<number>(0);
  const [editShares, setEditShares] = useState<Record<number, number>>({});

  // State thêm slot inline
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [addSlotForm, setAddSlotForm] = useState<TemplateSlotFormData>({
    categoryId: 0,
    stepOrder: slots.length + 1,
    required: true,
    minQty: 1,
    maxQty: 1,
  });

  // State mở modal popup thêm purpose mới
  const [isAddingPurpose, setIsAddingPurpose] = useState(false);

  const currentProfile = profiles.find((p) => p.purpose === selectedPurpose) || profiles[0];

  // Đồng bộ localSlots khi prop slots thay đổi từ server
  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  useEffect(() => {
    if (currentProfile) {
      setEditMinBudget(currentProfile.minBudget || 0);
      const shares: Record<number, number> = {};
      currentProfile.slots.forEach((s) => {
        shares[s.slotId] = Number(s.sharePct) || 0;
      });
      setEditShares(shares);
    }
  }, [currentProfile, selectedPurpose]);

  // Kiểm tra thứ tự có thay đổi so với DB hay không
  const isOrderChanged =
    localSlots.length === slots.length &&
    localSlots.some((slot, idx) => slot.id !== slots[idx]?.id);

  const totalAllocation = isEditingBudget
    ? Object.values(editShares).reduce((sum, v) => sum + (Number(v) || 0), 0)
    : currentProfile?.totalSharePct || 100;
  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.01;

  // =========================================================================
  // DRAG AND DROP HANDLERS (Kéo & thả tạo khoảng trống)
  // =========================================================================

  const handleDragStart = (
    e: React.DragEvent<HTMLTableRowElement>,
    slot: TemplateSlot,
    index: number
  ) => {
    if (isEditingBudget || editingSlotId !== null) {
      e.preventDefault();
      return;
    }
    const rowEl = e.currentTarget;
    setDraggedHeight(rowEl.offsetHeight || 54);
    setDraggedSlotId(slot.id);
    setDragOverIndex(index);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(slot.id));
  };

  const handleDragOverRow = (
    e: React.DragEvent<HTMLTableRowElement>,
    targetIndex: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const newTarget = e.clientY > midY ? targetIndex + 1 : targetIndex;

    if (dragOverIndex !== newTarget) {
      setDragOverIndex(newTarget);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedSlotId === null || dragOverIndex === null) {
      setDraggedSlotId(null);
      setDragOverIndex(null);
      return;
    }

    const draggedSlot = localSlots.find((s) => s.id === draggedSlotId);
    if (!draggedSlot) {
      setDraggedSlotId(null);
      setDragOverIndex(null);
      return;
    }

    const remaining = localSlots.filter((s) => s.id !== draggedSlotId);
    const insertIdx = Math.min(Math.max(0, dragOverIndex), remaining.length);

    const newOrdered = [
      ...remaining.slice(0, insertIdx),
      draggedSlot,
      ...remaining.slice(insertIdx),
    ].map((s, idx) => ({
      ...s,
      stepOrder: idx + 1,
    }));

    setLocalSlots(newOrdered);
    setDraggedSlotId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverIndex(null);
  };

  const handleSaveReorder = async () => {
    const orderedIds = localSlots.map((s) => s.id);
    await onReorderSlots(orderedIds);
  };

  const handleCancelReorder = () => {
    setLocalSlots(slots);
  };

  // =========================================================================
  // INLINE FORM HANDLERS
  // =========================================================================

  const handleSaveSlotInline = async (slotId: number) => {
    if (!slotEditForm) return;
    await onSaveSlot(slotEditForm, slotId);
    setEditingSlotId(null);
    setSlotEditForm(null);
  };

  const handleSaveAddSlot = async () => {
    if (!addSlotForm.categoryId) {
      alert("Vui lòng chọn danh mục linh kiện!");
      return;
    }
    await onSaveSlot(addSlotForm);
    setIsAddingSlot(false);
  };

  const handleSaveBudgetInline = async () => {
    if (!currentProfile) return;
    if (editMinBudget <= 0) {
      alert("Ngân sách tối thiểu phải lớn hơn 0!");
      return;
    }
    if (maxBuildPrice && maxBuildPrice > 0 && editMinBudget > maxBuildPrice) {
      alert(
        `Ngân sách sàn đề xuất (${money(editMinBudget)}) không được vượt quá giá trị bộ PC đắt nhất hiện tại trong hệ thống (${money(maxBuildPrice)})!`
      );
      return;
    }
    await onUpdatePurpose(currentProfile.purpose, editMinBudget, editShares);
    setIsEditingBudget(false);
  };

  const remainingSlots =
    draggedSlotId !== null ? localSlots.filter((s) => s.id !== draggedSlotId) : localSlots;
  const insertIndex =
    dragOverIndex !== null
      ? Math.min(Math.max(0, dragOverIndex), remainingSlots.length)
      : null;

  return (
    <div className="unified-metadata-container">
      {/* 1. Page Header chuẩn TechZone Pro */}
      <div className="page-head between">
        <div>
          <div className="eyebrow">QUẢN TRỊ / METADATA BUILD PC</div>
          <h1>Cấu hình Meta Data</h1>
          <p className="muted">
            Quản lý slot linh kiện và tỷ lệ phân bổ ngân sách cho hệ thống AI PC Builder
          </p>
        </div>
        <div className="row gap8">
          <Button
            tone="primary"
            onClick={() => {
              const nextOrder =
                localSlots.length > 0
                  ? Math.max(...localSlots.map((s) => s.stepOrder)) + 1
                  : 1;
              const nextCat = categoryOptions?.categories.find((c) => !c.alreadyHasSlot);
              setAddSlotForm({
                categoryId: nextCat ? nextCat.id : 0,
                stepOrder: nextOrder,
                required: true,
                minQty: 1,
                maxQty: 1,
              });
              setIsAddingSlot(true);
            }}
            disabled={isAddingSlot || isSaving}
          >
            <Icon name="plus" />
            <span>Thêm slot</span>
          </Button>
          <Button
            tone="secondary"
            onClick={() => setIsAddingPurpose(true)}
            disabled={isSaving}
          >
            <Icon name="plus" />
            <span>Thêm mục đích</span>
          </Button>
        </div>
      </div>

      {/* Modal popup tạo mục đích cấu hình ngân sách mới */}
      <CreatePurposeModal
        isOpen={isAddingPurpose}
        slots={slots}
        existingProfiles={profiles}
        maxBuildPrice={maxBuildPrice}
        onClose={() => setIsAddingPurpose(false)}
        onSave={async (purpose, minBudget, shares) => {
          await onSaveNewPurpose(purpose, minBudget, shares);
          setIsAddingPurpose(false);
          setSelectedPurpose(purpose);
        }}
        isSaving={isSaving}
      />

      {/* 2. Khung bảng hợp nhất duy nhất */}
      <div className="unified-table-card">
        {/* Purpose Header Bar */}
        <div className="purpose-header-bar row between wrap-row">
          <div className="purpose-left-controls row gap12">
            <span className="purpose-title-prefix">Nhu cầu:</span>
            <div className="purpose-select-wrap">
              <Icon name={getPurposeIcon(selectedPurpose)} />
              <select
                className="purpose-select-box"
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                disabled={isEditingBudget}
              >
                {profiles.map((p) => (
                  <option key={p.purpose} value={p.purpose}>
                    {p.label} ({p.purpose})
                  </option>
                ))}
              </select>
            </div>
            <span className="header-divider muted">|</span>
            {isEditingBudget ? (
              <div className="row gap8">
                <span className="small muted">Ngân sách sàn:</span>
                <input
                  type="number"
                  className="input min-budget-input"
                  step={500000}
                  value={editMinBudget}
                  onChange={(e) => setEditMinBudget(parseInt(e.target.value, 10) || 0)}
                />
              </div>
            ) : (
              <span className="min-budget-tag small">
                Ngân sách tối thiểu: <strong>{money(currentProfile?.minBudget || 0)}</strong>
              </span>
            )}
          </div>

          <div className="purpose-right-actions row gap8">
            {/* Nút lưu thay đổi thứ tự khi có Drag & Drop */}
            {isOrderChanged && (
              <div className="row gap8 animate-fade-in">
                <Button
                  tone="primary"
                  size="small"
                  onClick={handleSaveReorder}
                  disabled={isSaving}
                  title="Lưu thứ tự lắp ráp mới vào hệ thống"
                >
                  <Icon name="check" />
                  <span>Lưu thứ tự</span>
                </Button>
                <Button
                  tone="secondary"
                  size="small"
                  onClick={handleCancelReorder}
                  disabled={isSaving}
                  title="Hủy và khôi phục thứ tự ban đầu"
                >
                  <span>Hủy</span>
                </Button>
              </div>
            )}

            {isEditingBudget ? (
              <div className="row gap8">
                <Button
                  tone="primary"
                  size="small"
                  onClick={handleSaveBudgetInline}
                  disabled={isSaving}
                >
                  <Icon name="check" />
                  <span>Lưu phân bổ ({totalAllocation.toFixed(1)}%)</span>
                </Button>
                <Button
                  tone="secondary"
                  size="small"
                  onClick={() => setIsEditingBudget(false)}
                  disabled={isSaving}
                >
                  <span>Hủy</span>
                </Button>
              </div>
            ) : (
              <div className="row gap8">
                <button
                  type="button"
                  className="btn-action-icon"
                  title="Chỉnh sửa phân bổ ngân sách"
                  onClick={() => setIsEditingBudget(true)}
                >
                  <Icon name="edit" />
                  <span>Sửa phần trăm ngân sách</span>
                </button>
                {selectedPurpose !== "GENERAL" && (
                  <button
                    type="button"
                    className="btn-action-icon danger"
                    title="Xóa mục đích này"
                    onClick={() => onDeletePurpose(selectedPurpose)}
                  >
                    <Icon name="trash" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bảng dữ liệu hợp nhất */}
        <div className="table-wrap">
          <table
            className="unified-grid-table"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <thead>
              <tr>
                <th style={{ width: "95px" }}>Thứ tự</th>
                <th style={{ width: "34%" }}>Linh kiện</th>
                <th style={{ width: "120px", textAlign: "center" }}>Bắt buộc</th>
                <th style={{ width: "130px", textAlign: "center" }}>Số lượng</th>
                <th>Phân bổ ngân sách</th>
                <th style={{ width: "150px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {/* Dòng thêm mới slot inline */}
              {isAddingSlot && (
                <tr className="row-inline-add">
                  <td className="step-order-cell">
                    <span className="step-order-badge">
                      {String(addSlotForm.stepOrder).padStart(2, "0")}
                    </span>
                  </td>
                  <td>
                    <select
                      className="input full"
                      value={addSlotForm.categoryId}
                      onChange={(e) =>
                        setAddSlotForm({
                          ...addSlotForm,
                          categoryId: Number(e.target.value),
                        })
                      }
                    >
                      <option value={0} disabled>
                        -- Chọn danh mục linh kiện --
                      </option>
                      {(categoryOptions?.categories || [])
                        .filter((c) => !c.alreadyHasSlot)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.slug})
                          </option>
                        ))}
                    </select>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <select
                      className="input input-sm"
                      value={addSlotForm.required ? "true" : "false"}
                      onChange={(e) => {
                        const req = e.target.value === "true";
                        setAddSlotForm({
                          ...addSlotForm,
                          required: req,
                          minQty: req ? 1 : 0,
                        });
                      }}
                    >
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="qty-input-group">
                      <input
                        type="number"
                        className="input input-inline-qty"
                        min={addSlotForm.required ? 1 : 0}
                        value={addSlotForm.minQty}
                        onChange={(e) =>
                          setAddSlotForm({
                            ...addSlotForm,
                            minQty: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        disabled={!addSlotForm.required}
                      />
                      <span>-</span>
                      <input
                        type="number"
                        className="input input-inline-qty"
                        min={addSlotForm.minQty}
                        value={addSlotForm.maxQty}
                        onChange={(e) =>
                          setAddSlotForm({
                            ...addSlotForm,
                            maxQty: parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </div>
                  </td>
                  <td>
                    <span className="small muted">Mặc định 0% (sửa theo nhu cầu sau)</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className="action-buttons-wrap">
                      <button
                        type="button"
                        className="btn-action-icon primary"
                        title="Lưu slot mới"
                        onClick={handleSaveAddSlot}
                        disabled={isSaving}
                      >
                        <Icon name="check" />
                        <span>Lưu</span>
                      </button>
                      <button
                        type="button"
                        className="btn-action-icon"
                        title="Hủy"
                        onClick={() => setIsAddingSlot(false)}
                      >
                        <Icon name="x" />
                        <span>Hủy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Các dòng slot hiện có kèm cơ chế Drag & Drop */}
              {remainingSlots.map((slot, index) => {
                const isEditing = editingSlotId === slot.id;
                const sharePct = isEditingBudget
                  ? editShares[slot.id] ?? 0
                  : currentProfile?.slots.find((s) => s.slotId === slot.id)?.sharePct ?? 0;

                const displayStepOrder =
                  draggedSlotId !== null
                    ? index >= (insertIndex ?? 0)
                      ? index + 2
                      : index + 1
                    : index + 1;

                const showPlaceholderBeforeThis =
                  draggedSlotId !== null && insertIndex === index;

                return (
                  <Fragment key={slot.id}>
                    {/* Khoảng trống drop target chèn vào trước dòng này khi kéo */}
                    {showPlaceholderBeforeThis && (
                      <tr
                        className="drag-placeholder-row"
                        style={{ height: `${draggedHeight}px` }}
                        onDragOver={(e) => handleDragOverRow(e, index)}
                      >
                        <td colSpan={6} className="drag-placeholder-cell">
                          <div className="placeholder-inner">
                            <Icon name="arrow" style={{ transform: "rotate(90deg)" }} />
                            <span>Vị trí chèn thứ {index + 1}</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {isEditing && slotEditForm ? (
                      <tr key={slot.id} className="row-inline-editing">
                        <td className="step-order-cell">
                          <span className="step-order-badge is-active">
                            {String(displayStepOrder).padStart(2, "0")}
                          </span>
                        </td>
                        <td>
                          <div className="component-category-cell">
                            <span className="cat-icon-badge">
                              <CategoryHardwareIcon name={slot.categoryName} size={16} />
                            </span>
                            <div className="cat-name-stack">
                              <span className="cat-name-text">{slot.categoryName}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <select
                            className="input input-sm"
                            value={slotEditForm.required ? "true" : "false"}
                            onChange={(e) => {
                              const req = e.target.value === "true";
                              setSlotEditForm({
                                ...slotEditForm,
                                required: req,
                                minQty: req
                                  ? Math.max(1, slotEditForm.minQty)
                                  : 0,
                              });
                            }}
                          >
                            <option value="true">Có</option>
                            <option value="false">Không</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="qty-input-group">
                            <input
                              type="number"
                              className="input input-inline-qty"
                              min={slotEditForm.required ? 1 : 0}
                              value={slotEditForm.minQty}
                              onChange={(e) =>
                                setSlotEditForm({
                                  ...slotEditForm,
                                  minQty: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              disabled={!slotEditForm.required}
                            />
                            <span>-</span>
                            <input
                              type="number"
                              className="input input-inline-qty"
                              min={slotEditForm.minQty}
                              value={slotEditForm.maxQty}
                              onChange={(e) =>
                                setSlotEditForm({
                                  ...slotEditForm,
                                  maxQty: parseInt(e.target.value, 10) || 1,
                                })
                              }
                            />
                          </div>
                        </td>
                        <td>
                          <span className="allocation-pct-text">{sharePct}%</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div className="action-buttons-wrap">
                            <button
                              type="button"
                              className="btn-action-icon primary"
                              title="Lưu thay đổi slot"
                              onClick={() => handleSaveSlotInline(slot.id)}
                              disabled={isSaving}
                            >
                              <Icon name="check" />
                              <span>Lưu</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-icon"
                              title="Hủy"
                              onClick={() => setEditingSlotId(null)}
                            >
                              <Icon name="x" />
                              <span>Hủy</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={slot.id}
                        className={`unified-slot-row ${draggedSlotId === slot.id ? "is-dragging" : ""
                          }`}
                        draggable={!isEditingBudget && editingSlotId === null}
                        onDragStart={(e) => handleDragStart(e, slot, index)}
                        onDragOver={(e) => handleDragOverRow(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* 1. Step Order với icon kéo thả SVG tinh gọn chuẩn TechZone */}
                        <td className="step-order-cell">
                          <div className="step-order-inner">
                            <span
                              className="drag-grip-handle"
                              title="Giữ và kéo để đổi thứ tự"
                            >
                              <Icon name="grip" />
                            </span>
                            <span className="step-order-badge">
                              {String(displayStepOrder).padStart(2, "0")}
                            </span>
                          </div>
                        </td>

                        {/* 2. Component Category với icon phần cứng đồng bộ TechZone */}
                        <td>
                          <div className="component-category-cell">
                            <span className="cat-icon-badge">
                              <CategoryHardwareIcon name={slot.categoryName} size={16} />
                            </span>
                            <div className="cat-name-stack">
                              <span className="cat-name-text">{slot.categoryName}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Is Required sử dụng Badge chính thức của hệ thống */}
                        <td style={{ textAlign: "center" }}>
                          <Badge tone={slot.required ? "success" : "muted"}>
                            {slot.required ? "Có" : "Không"}
                          </Badge>
                        </td>

                        {/* 4. Qty Range */}
                        <td style={{ textAlign: "center" }}>
                          <span className="qty-range-badge">
                            {slot.minQty} - {slot.maxQty}
                          </span>
                        </td>

                        {/* 5. Budget Allocation */}
                        <td>
                          {isEditingBudget ? (
                            <div className="budget-edit-cell">
                              <input
                                type="number"
                                className="input input-inline-qty"
                                min={0}
                                max={100}
                                step={0.5}
                                value={sharePct}
                                onChange={(e) =>
                                  setEditShares({
                                    ...editShares,
                                    [slot.id]: parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                              <span className="small muted">%</span>
                            </div>
                          ) : (
                            <div className="budget-capsule-wrap">
                              <div className="budget-capsule-track">
                                <div
                                  className="budget-capsule-fill"
                                  style={{ width: `${Math.min(100, Math.max(0, Number(sharePct)))}%` }}
                                />
                                <span
                                  className="budget-capsule-text"
                                  style={{
                                    left:
                                      Number(sharePct) > 55
                                        ? "12px"
                                        : `calc(${Math.min(100, Number(sharePct))}% + 8px)`,
                                    color: Number(sharePct) > 55 ? "#ffffff" : "var(--ink, #152237)",
                                  }}
                                >
                                  {sharePct}%
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 6. Actions với icon Sửa / Xóa chuẩn TechZone Pro */}
                        <td style={{ textAlign: "center" }}>
                          <div className="action-buttons-wrap">
                            <button
                              type="button"
                              className="btn-action-icon"
                              title="Sửa slot linh kiện"
                              onClick={() => {
                                setEditingSlotId(slot.id);
                                setSlotEditForm({
                                  categoryId: slot.categoryId,
                                  stepOrder: slot.stepOrder,
                                  required: slot.required,
                                  minQty: slot.minQty,
                                  maxQty: slot.maxQty,
                                });
                              }}
                            >
                              <Icon name="edit" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-icon danger"
                              title="Xóa slot"
                              onClick={() => onDeleteSlot(slot)}
                            >
                              <Icon name="trash" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* Nếu thả vào cuối danh sách */}
              {draggedSlotId !== null && insertIndex === remainingSlots.length && (
                <tr
                  className="drag-placeholder-row"
                  style={{ height: `${draggedHeight}px` }}
                  onDragOver={(e) => handleDragOverRow(e, remainingSlots.length)}
                >
                  <td colSpan={6} className="drag-placeholder-cell">
                    <div className="placeholder-inner">
                      <Icon name="arrow" style={{ transform: "rotate(90deg)" }} />
                      <span>Vị trí chèn cuối ({remainingSlots.length + 1})</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
