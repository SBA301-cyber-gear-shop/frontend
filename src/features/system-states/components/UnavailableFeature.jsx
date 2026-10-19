import { Button, Empty } from "@/components/ui";

export function UnavailableFeature({
  title = "Chức năng đang được hoàn thiện",
}) {
  return (
    <Empty
      title={title}
      description="Hiện bạn có thể xem sản phẩm, chỉnh sửa giỏ hàng và kiểm tra thông tin nhận hàng cùng voucher."
      action={<Button to="/san-pham">Xem sản phẩm</Button>}
    />
  );
}
