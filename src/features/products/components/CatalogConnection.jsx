import { useStore } from "@/store";
import { Button, Notice } from "@/components/ui";

export function CatalogConnection() {
  const { data, catalogLoading, catalogError, reloadCatalog } = useStore();
  if (catalogLoading && (!data?.products || data.products.length === 0))
    return <Notice>Đang tải sản phẩm từ cửa hàng…</Notice>;
  if (catalogError)
    return (
      <div className="stack section">
        <Notice tone="danger">Không tải được sản phẩm: {catalogError}</Notice>
        <Button onClick={() => reloadCatalog()}>Tải lại sản phẩm</Button>
      </div>
    );
  return null;
}
