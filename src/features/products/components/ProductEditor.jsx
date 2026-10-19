import { categories } from "../constants";
import { money } from "@/utils";
import { Art, Badge, Button, Notice, Panel, Empty } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { useProductEditor } from "../hooks/useProductEditor";
import { VariantModal } from "./VariantModal";

export function ProductEditor({ product, onCreated }) {
  const {
    productForm,
    updateProduct,
    variants,
    activePreviewVariant,
    setPreviewVariantId,
    modalOpen,
    editingVariant,
    openAddVariantModal,
    openEditVariantModal,
    closeVariantModal,
    handleSaveVariant,
    handleDeleteVariant,
    handleSaveProduct,
  } = useProductEditor({ product, onCreated });

  return (
    <>
      <div className="split">
        <div className="stack">
          {/* MASTER PRODUCT DETAILS */}
          <Panel title="Thông tin chung sản phẩm">
            <div className="two-col">
              <Field
                label="Tên sản phẩm *"
                value={productForm.name}
                onChange={(e) => updateProduct("name", e.target.value)}
              />
              <Field
                label="Thương hiệu *"
                value={productForm.brand}
                onChange={(e) => updateProduct("brand", e.target.value)}
              />
              <Select
                label="Danh mục"
                value={productForm.category}
                onChange={(e) => updateProduct("category", e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <Field
                label="Bảo hành (tháng)"
                type="number"
                min="0"
                value={productForm.warranty}
                onChange={(e) => updateProduct("warranty", e.target.value)}
              />
            </div>
            <div className="section">
              <Field label="Mô tả sản phẩm">
                {(id) => (
                  <textarea
                    id={id}
                    className="input full"
                    rows="3"
                    value={productForm.description || ""}
                    onChange={(e) => updateProduct("description", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>

          {/* VARIANTS (DETAIL) MANAGEMENT */}
          <Panel
            title={`Danh sách biến thể (SKU) · ${variants.length} phiên bản`}
            action={
              <Button onClick={openAddVariantModal}>+ Thêm biến thể</Button>
            }
          >
            {variants.length === 0 ? (
              <Empty
                title="Chưa có phiên bản nào"
                sub="Sản phẩm cần có ít nhất một phiên bản (SKU) với giá bán và tồn kho để đăng bán."
                action={
                  <Button onClick={openAddVariantModal}>
                    + Tạo phiên bản đầu tiên
                  </Button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Phiên bản</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Thông số</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const isSelected = activePreviewVariant?.id === v.id;
                      const specSummary = v.specs
                        ? Object.entries(v.specs)
                            .map(([k, val]) => `${k}: ${val}`)
                            .slice(0, 2)
                            .join(", ")
                        : "";

                      return (
                        <tr
                          key={v.id}
                          style={{
                            backgroundColor: isSelected
                              ? "var(--surface-active, rgba(255,255,255,0.05))"
                              : undefined,
                          }}
                        >
                          <td>
                            <code className="mono">{v.sku || v.serialCode}</code>
                          </td>
                          <td>
                            <strong>{v.variant || v.variantName || "Mặc định"}</strong>
                          </td>
                          <td>
                            <strong>{money(Number(v.price))}</strong>
                            {v.originalPrice > v.price && (
                              <div className="small muted strike" style={{ textDecoration: "line-through" }}>
                                {money(Number(v.originalPrice))}
                              </div>
                            )}
                          </td>
                          <td>
                            <Badge tone={Number(v.stock) > 0 ? "success" : "danger"}>
                              {v.stock || 0} cái
                            </Badge>
                          </td>
                          <td className="small muted">
                            {specSummary || "—"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="row" style={{ justifyContent: "flex-end", gap: "0.5rem" }}>
                              <Button
                                size="small"
                                tone={isSelected ? "primary" : "secondary"}
                                onClick={() => setPreviewVariantId(v.id)}
                              >
                                {isSelected ? "Đang xem" : "Xem"}
                              </Button>
                              <Button
                                size="small"
                                tone="secondary"
                                onClick={() => openEditVariantModal(v)}
                              >
                                Sửa
                              </Button>
                              <Button
                                size="small"
                                tone="danger"
                                onClick={() => handleDeleteVariant(v.id)}
                              >
                                Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* ASIDE PREVIEW */}
        <aside className="stack">
          <Panel title="Xem trước trên cửa hàng">
            <Art
              type={productForm.category}
              image={activePreviewVariant?.image || activePreviewVariant?.imageUrl}
              name={productForm.name}
            />
            <div className="eyebrow section">{productForm.brand || "THƯƠNG HIỆU"}</div>
            <h3>{productForm.name || "Tên sản phẩm"}</h3>
            <p className="muted small">
              {activePreviewVariant
                ? activePreviewVariant.variant || activePreviewVariant.variantName
                : "Chưa chọn phiên bản"}
            </p>
            <div className="price section">
              {money(Number(activePreviewVariant?.price || 0))}
            </div>
            <div className="row" style={{ gap: "0.5rem" }}>
              <Badge tone={productForm.status === "active" ? "success" : "warning"}>
                {productForm.status === "active" ? "Đang bán" : "Bản nháp"}
              </Badge>
              {activePreviewVariant && (
                <Badge tone={Number(activePreviewVariant.stock) > 0 ? "success" : "danger"}>
                  Tồn kho: {activePreviewVariant.stock || 0}
                </Badge>
              )}
            </div>
          </Panel>

          <Notice tone="neutral">
            Sản phẩm cần có ít nhất 1 biến thể SKU có thông số chính xác trước khi Đăng bán ra toàn hệ thống.
          </Notice>
        </aside>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="editor-actions">
        <p className="small muted">
          {variants.length} biến thể khả dụng · Trạng thái hiện tại:{" "}
          <strong>{productForm.status === "active" ? "ACTIVE" : "DRAFT"}</strong>
        </p>
        <div className="row">
          <Button tone="secondary" onClick={() => handleSaveProduct("draft")}>
            Lưu nháp
          </Button>
          <Button onClick={() => handleSaveProduct("active")}>
            Đăng bán sản phẩm (Publish)
          </Button>
        </div>
      </div>

      {/* VARIANT ADD / EDIT MODAL */}
      {modalOpen && (
        <VariantModal
          variant={editingVariant}
          onSave={handleSaveVariant}
          onClose={closeVariantModal}
        />
      )}
    </>
  );
}
