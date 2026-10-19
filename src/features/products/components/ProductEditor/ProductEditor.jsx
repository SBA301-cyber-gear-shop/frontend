import { categories } from "../../constants";
import { money } from "@/utils";
import { Art, Badge, Button, Notice, Panel } from "@/components/ui";
import { Field, Select } from "@/components/form";
import { useProductEditor } from "../../hooks/useProductEditor";
import "./ProductEditor.scss";

export function ProductEditor({ product, onCreated }) {
  const { form, specText, setSpecText, update, save } = useProductEditor({
    product,
    onCreated,
  });
  return (
    <>
      <div className="split">
        <div className="stack">
          <Panel title="Thông tin sản phẩm">
            <div className="two-col">
              <Field
                label="Tên sản phẩm *"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Field
                label="Thương hiệu *"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
              />
              <Select
                label="Danh mục"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
              <Field
                label="Bảo hành (tháng)"
                type="number"
                min="0"
                value={form.warranty}
                onChange={(e) => update("warranty", e.target.value)}
              />
            </div>
            <div className="section">
              <Field label="Mô tả">
                {(id) => (
                  <textarea
                    id={id}
                    className="input full"
                    value={form.description || ""}
                    onChange={(e) => update("description", e.target.value)}
                  />
                )}
              </Field>
            </div>
          </Panel>
          <Panel title="Phiên bản đang chỉnh sửa">
            <div className="two-col">
              <Field
                label="Tên phiên bản *"
                value={form.variant}
                onChange={(e) => update("variant", e.target.value)}
              />
              <Field
                label="Mã SKU *"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
              />
              <Field
                label="Giá bán (₫)"
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
              <Field
                label="Giá gốc (₫)"
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={(e) => update("originalPrice", e.target.value)}
              />
              <Field
                label="Lượng còn có thể bán"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
              />
              <Field
                label="Mã nhóm sản phẩm"
                hint="Cùng mã nhóm để liên kết các phiên bản."
                value={form.productId}
                onChange={(e) => update("productId", e.target.value)}
              />
            </div>
            <div className="section">
              <Field
                label="URL ảnh phiên bản"
                value={form.image}
                onChange={(e) => update("image", e.target.value)}
                placeholder="/assets/... hoặc https://..."
              />
            </div>
          </Panel>
          <Panel title="Thông số của phiên bản">
            <Field
              label="Tên thông số: Giá trị"
              hint="Mỗi dòng một thông số. Dữ liệu kỹ thuật cần kiểm chứng trước khi đưa vào bộ kiểm tra build."
            >
              {(id) => (
                <textarea
                  id={id}
                  className="input full mono"
                  rows="7"
                  value={specText}
                  onChange={(e) => setSpecText(e.target.value)}
                  placeholder={"Chuẩn RAM: DDR5\nDung lượng: 16GB"}
                />
              )}
            </Field>
          </Panel>
        </div>
        <aside className="stack">
          <Panel title="Xem trước phiên bản">
            <Art type={form.category} image={form.image} name={form.name} />
            <div className="eyebrow section">{form.brand || "THƯƠNG HIỆU"}</div>
            <h3>{form.name || "Tên sản phẩm"}</h3>
            <p className="muted small">{form.variant}</p>
            <div className="price section">{money(Number(form.price))}</div>
            <Badge tone={form.status === "active" ? "success" : "warning"}>
              {form.status === "active" ? "Đang bán" : "Bản nháp"}
            </Badge>
          </Panel>
          <Notice tone="neutral">
            Giá mới áp dụng cho lần mua tiếp theo. Giá chụp trong đơn đã đặt
            được giữ nguyên.
          </Notice>
        </aside>
      </div>
      <div className="editor-actions">
        <p className="small muted">Chỉ áp dụng thay đổi sau khi lưu.</p>
        <div className="row">
          <Button tone="secondary" onClick={() => save("draft")}>
            Lưu nháp
          </Button>
          <Button onClick={() => save("active")}>Lưu & đăng bán</Button>
        </div>
      </div>
    </>
  );
}

export default ProductEditor;
