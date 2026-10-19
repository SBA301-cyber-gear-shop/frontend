import { Button, Heading } from "@/components/ui";
import { ProductEditor } from "../ProductEditor";
import { useProductManagement } from "../../hooks/useProductManagement";
import "./ProductManagement.scss";

export function ProductManagement() {
  const { data, selected, setSelected } = useProductManagement();
  return (
    <div className="product-management">
      <Heading
        title="Sản phẩm & phiên bản"
        sub="Thông tin chung của sản phẩm và dữ liệu của từng SKU."
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
        {data.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.variant}
          </option>
        ))}
      </select>
      <ProductEditor
        key={selected}
        product={data.products.find((p) => p.id === selected)}
        onCreated={setSelected}
      />
    </div>
  );
}

export default ProductManagement;
