import { useCart } from "../hooks/useCart";
import { money } from "@/utils";
import { OrderLines } from "@/features/products";
import {
  Button,
  Empty,
  Heading,
  KV,
  Notice,
  Panel,
  Steps,
} from "@/components/ui";

export function CartView() {
  const {
    data,
    totalCount,
    totalAmount,
    hasRam,
    updateQuantity,
    removeFromCart,
  } = useCart();
  if (!data.cart.length)
    return (
      <>
        <Heading title="Giỏ hàng của bạn" />
        <Empty
          title="Giỏ hàng đang trống"
          description="Bắt đầu bằng một linh kiện phù hợp với góc máy của bạn."
          action={<Button to="/san-pham">Khám phá sản phẩm →</Button>}
        />
      </>
    );
  return (
    <>
      <Heading
        title="Giỏ hàng của bạn"
        sub={data.cart.length + " phiên bản · " + totalCount + " sản phẩm"}
        action={
          <Button to="/san-pham" tone="secondary">
            ← Tiếp tục mua sắm
          </Button>
        }
      />
      <Steps
        labels={["Giỏ hàng", "Thông tin & thanh toán", "Theo dõi đơn"]}
        current={0}
      />
      <div className="split">
        <div className="stack">
          <OrderLines
            lines={data.cart}
            products={data.products}
            editable
            onChange={updateQuantity}
            onRemove={removeFromCart}
          />
          <Notice>
            Nhận trực tiếp tại cửa hàng. Thông tin người nhận được xác nhận ở
            bước tiếp theo.
          </Notice>
          {hasRam && (
            <Panel title="Kiểm tra số lượng RAM">
              <p className="muted small">
                RAM được bán theo từng thanh. Hai thanh 16GB tương ứng số lượng
                2 và tổng dung lượng 32GB.
              </p>
            </Panel>
          )}
        </div>
        <aside className="stack">
          <Panel title="Tóm tắt giỏ hàng" className="summary">
            <KV label="Tiền hàng">{money(totalAmount)}</KV>
            <KV label="Tạm tính" total>
              {money(totalAmount)}
            </KV>
            <Button className="full" to="/thanh-toan">
              Tiếp tục đặt hàng →
            </Button>
            <p className="small muted section">
              Áp dụng một mã giảm giá ở bước thanh toán.
            </p>
          </Panel>
          <Notice tone="neutral">
            Giỏ hàng chưa giữ tồn kho. Giá và số lượng được kiểm tra lại khi xác
            nhận.
          </Notice>
        </aside>
      </div>
    </>
  );
}
