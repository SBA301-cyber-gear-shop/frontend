import { useState, useEffect } from "react";
import { Modal, Button, Notice } from "@/components/ui";
import { Field } from "@/components/form";

export function VariantModal({ variant, onSave, onClose }) {
  const [form, setForm] = useState({
    serialCode: "",
    variantName: "",
    slug: "",
    price: 0,
    originalPrice: 0,
    stockQuantity: 0,
    imageUrl: "",
  });

  const [specText, setSpecText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (variant) {
      setForm({
        serialCode: variant.serialCode || variant.sku || "",
        variantName: variant.variantName || variant.variant || "",
        slug: variant.slug || "",
        price: variant.price || 0,
        originalPrice: variant.originalPrice || 0,
        stockQuantity: variant.stockQuantity ?? variant.stock ?? 0,
        imageUrl: variant.imageUrl || variant.image || "",
      });

      if (variant.attributes && Array.isArray(variant.attributes)) {
        setSpecText(
          variant.attributes
            .map((a) => `${a.specificationName || a.name}: ${a.value}`)
            .join("\n")
        );
      } else if (variant.specs && typeof variant.specs === "object") {
        setSpecText(
          Object.entries(variant.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        );
      } else {
        setSpecText("");
      }
    } else {
      setForm({
        serialCode: "",
        variantName: "",
        slug: "",
        price: 0,
        originalPrice: 0,
        stockQuantity: 10,
        imageUrl: "",
      });
      setSpecText("");
    }
  }, [variant]);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

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
            type="number"
            min="1"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
          />
          <Field
            label="Giá gốc (₫)"
            hint="Để hiển thị giá gạch ngang (nếu có)"
            type="number"
            min="0"
            value={form.originalPrice}
            onChange={(e) => update("originalPrice", e.target.value)}
          />
          <Field
            label="Số lượng tồn kho *"
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

        <Field
          label="URL ảnh biến thể"
          placeholder="https://... hoặc /assets/..."
          value={form.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
        />

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

        <div className="row" style={{ justifyContent: "flex-end", marginTop: "1rem" }}>
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
