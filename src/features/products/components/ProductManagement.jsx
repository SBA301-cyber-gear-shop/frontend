import { Button, Heading } from "@/components/ui";
import { ProductEditor } from "./ProductEditor";
import { useProductManagement } from "../hooks/useProductManagement";

export function ProductManagement() {
  const { distinctProducts, selected, setSelected, selectedProduct } =
    useProductManagement();

  return (
    <>
      <Heading
        title="Sản phẩm & phiên bản"
        sub="Quản lý thông tin sản phẩm và các biến thể SKU bán lẻ."
        eyebrow="QUẢN TRỊ / SẢN PHẨM"
        action={
          <Button onClick={() => setSelected("new")}>+ Thêm sản phẩm</Button>
        }
      />
      <select
        className="input section-title"
        aria-label="Chọn sản phẩm quản trị"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="new">Tạo sản phẩm mới</option>
        {distinctProducts.map((p) => (
          <option key={p.productId} value={p.id}>
            {p.name} ({p.variantCount} phiên bản) · {p.brand}
          </option>
        ))}
      </select>
      <ProductEditor
        key={selected}
        product={selectedProduct}
        onCreated={setSelected}
      />
    </>
  );
}
