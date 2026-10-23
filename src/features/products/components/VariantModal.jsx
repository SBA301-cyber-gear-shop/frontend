import { useState } from "react";
import { Modal, Button, Notice } from "@/components/ui";
import { Field } from "@/components/form";
import { money } from "@/utils";
import { getCategoryMockImage } from "../constants/mockImages";

export function VariantModal({ variant, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    serialCode: variant?.serialCode || variant?.sku || "",
    variantName: variant?.variantName || variant?.variant || "",
    slug: variant?.slug || "",
    price: variant?.price ?? 0,
    originalPrice: variant?.originalPrice ?? 0,
    stockQuantity: variant?.stockQuantity ?? variant?.stock ?? 10,
    imageUrl: variant?.imageUrl || variant?.image || "",
  }));

  const [specText, setSpecText] = useState(() => {
    if (Array.isArray(variant?.attributes))
      return variant.attributes
        .map(
          (attribute) =>
            `${attribute.specificationName || attribute.name}: ${attribute.value}`,
        )
        .join("\n");
    return Object.entries(variant?.specs || {})
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n");
  });
  const [error, setError] = useState("");

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handlePriceInput = (key, e) => {
    const input = e.target;
    const rawBefore = input.value;
    const cursorPos = input.selectionStart || 0;
    const digitsOnly = rawBefore.replace(/\D/g, "");
    const num = digitsOnly ? Number(digitsOnly) : 0;

    // Count digits before cursor to maintain position
    const digitsBeforeCursor = rawBefore
      .slice(0, cursorPos)
      .replace(/\D/g, "").length;

    update(key, num);

    requestAnimationFrame(() => {
      if (!input) return;
      const formatted = num ? new Intl.NumberFormat("vi-VN").format(num) : "";
      let count = 0;
      let newCursorPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          count++;
          if (count === digitsBeforeCursor) {
            newCursorPos = i + 1;
            break;
          }
        }
      }
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.serialCode.trim()) {
      setError("Mã SKU (serial_code) không được để trống.");
      return;
    }

    const priceNum = Number(form.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Giá bán phải lớn hơn 0.");
      return;
    }

    const origPriceNum = Number(form.originalPrice);
    if (origPriceNum > 0 && origPriceNum < priceNum) {
      setError("Giá gốc tham chiếu không được nhỏ hơn giá bán.");
      return;
    }

    const stockNum = Number(form.stockQuantity);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError("Số lượng tồn kho phải là số nguyên không âm.");
      return;
    }

    // Parse specifications text
    const specs = {};
    for (const line of specText.split("\n").filter((l) => l.trim())) {
      const pos = line.indexOf(":");
      if (pos < 1 || !line.slice(pos + 1).trim()) {
        setError("Thông số phải theo định dạng 'Tên: Giá trị' trên mỗi dòng.");
        return;
      }
      const k = line.slice(0, pos).trim();
      const v = line.slice(pos + 1).trim();
      specs[k] = v;
    }

    try {
      onSave({
        ...form,
        id: variant?.id,
        serialCode: form.serialCode.trim().toUpperCase(),
        sku: form.serialCode.trim().toUpperCase(),
        variant: form.variantName,
        price: priceNum,
        originalPrice: origPriceNum > 0 ? origPriceNum : null,
        stockQuantity: stockNum,
        stock: stockNum,
        imageUrl: form.imageUrl.trim(),
        image: form.imageUrl.trim(),
        specs,
      });
    } catch (err) {
      setError(err.message || "Không thể lưu biến thể.");
    }
  };

  return (
    <Modal
      title={variant ? "Chỉnh sửa biến thể (SKU)" : "Thêm biến thể mới"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="stack">
        {error && <Notice tone="danger">{error}</Notice>}

        <div className="two-col">
          <Field
            label="Mã SKU (serial_code) *"
            hint="Mã định danh duy nhất cho phiên bản"
            value={form.serialCode}
            onChange={(e) => update("serialCode", e.target.value)}
          />
          <Field
            label="Tên phiên bản *"
            placeholder="VD: Đen / 16GB / 5600 MT/s"
            value={form.variantName}
            onChange={(e) => update("variantName", e.target.value)}
          />
          <Field
            label="Giá bán (₫) *"
            hint={
              form.price > 0 ? (
                <span
                  style={{
                    color: "var(--brand-teal, #008779)",
                    fontWeight: 600,
                  }}
                >
                  ✓ {money(form.price)}
                </span>
              ) : (
                "Nhập giá bán cho biến thể (VNĐ)"
              )
            }
          >
            {(id) => (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  id={id}
                  className="input full"
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 1.500.000"
                  value={
                    form.price
                      ? new Intl.NumberFormat("vi-VN").format(form.price)
                      : ""
                  }
                  onChange={(e) => handlePriceInput("price", e)}
                  style={{
                    paddingRight: "2.5rem",
                    fontWeight: 600,
                    fontSize: "15px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "0.85rem",
                    fontWeight: 700,
                    color: "var(--ink-muted, #64748b)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  ₫
                </span>
              </div>
            )}
          </Field>
          <Field
            label="Giá gốc tham chiếu (₫)"
            hint={
              form.originalPrice > 0 ? (
                <span style={{ color: "var(--ink-muted, #64748b)" }}>
                  Gốc: <del>{money(form.originalPrice)}</del>
                </span>
              ) : (
                "Để hiển thị giá gạch ngang (nếu có)"
              )
            }
          >
            {(id) => (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  id={id}
                  className="input full"
                  type="text"
                  inputMode="numeric"
                  placeholder="VD: 2.000.000"
                  value={
                    form.originalPrice
                      ? new Intl.NumberFormat("vi-VN").format(
                          form.originalPrice,
                        )
                      : ""
                  }
                  onChange={(e) => handlePriceInput("originalPrice", e)}
                  style={{
                    paddingRight: "2.5rem",
                    fontWeight: 600,
                    fontSize: "15px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "0.85rem",
                    fontWeight: 700,
                    color: "var(--ink-muted, #64748b)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  ₫
                </span>
              </div>
            )}
          </Field>
          <Field
            label="Số lượng tồn kho *"
            hint={
              form.stockQuantity > 0
                ? `${new Intl.NumberFormat("vi-VN").format(form.stockQuantity)} sản phẩm khả dụng`
                : "Hết hàng nếu = 0"
            }
            type="number"
            min="0"
            value={form.stockQuantity}
            onChange={(e) => update("stockQuantity", e.target.value)}
          />
          <Field
            label="Slug biến thể (tùy chọn)"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
          />
        </div>

        <div className="row" style={{ alignItems: "flex-end", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <Field
              label="URL ảnh biến thể"
              placeholder="https://... hoặc /assets/..."
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
            />
          </div>
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="Preview"
              style={{
                width: "42px",
                height: "42px",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid var(--line, #e2e7ed)",
                marginBottom: "6px",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        <div
          className="row"
          style={{
            gap: "0.5rem",
            marginTop: "-0.5rem",
            marginBottom: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="small muted" style={{ fontSize: "12px" }}>
            Chọn ảnh mẫu:
          </span>
          {[
            { id: "ram", label: "RAM" },
            { id: "ssd", label: "SSD" },
            { id: "gpu", label: "GPU" },
            { id: "cpu", label: "CPU" },
            { id: "mainboard", label: "Mainboard" },
            { id: "case", label: "Case" },
            { id: "monitor", label: "Màn hình" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid var(--line, #e2e7ed)",
                background: "#f8fafc",
                cursor: "pointer",
                color: "var(--ink)",
              }}
              onClick={() => update("imageUrl", getCategoryMockImage(item.id))}
            >
              + {item.label}
            </button>
          ))}
        </div>

        <Field
          label="Thông số kỹ thuật của biến thể (EAV)"
          hint="Mỗi dòng một thông số dạng 'Tên: Giá trị' (VD: Chuẩn RAM: DDR5)"
        >
          {(id) => (
            <textarea
              id={id}
              className="input full mono"
              rows="5"
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              placeholder={"Chuẩn RAM: DDR5\nDung lượng: 16GB\nBus: 5600 MT/s"}
            />
          )}
        </Field>

        <div
          className="row"
          style={{ justifyContent: "flex-end", marginTop: "1rem" }}
        >
          <Button type="button" tone="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">
            {variant ? "Lưu thay đổi" : "Thêm biến thể"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
