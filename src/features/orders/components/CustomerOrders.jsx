import { Link } from "react-router-dom";
import { dateTime, money, formatShortOrderCode } from "@/utils";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants";
import {
  Art,
  Badge,
  Button,
  Empty,
  Heading,
  Panel,
  Notice,
} from "@/components/ui";
import { useCustomerOrders } from "../hooks/useCustomerOrders";

export function CustomerOrders() {
  const {
    data,
    filter,
    setFilter,
    search,
    setSearch,
    orders,
    loading,
    error,
    refresh,
  } = useCustomerOrders();
  if (loading) return <Notice>Đang tải đơn hàng…</Notice>;
  if (error)
    return (
      <div className="stack">
        <Notice tone="danger">{error}</Notice>
        <Button onClick={refresh}>Tải lại đơn hàng</Button>
      </div>
    );
  return (
    <>
      <Heading
        title="Đơn hàng của tôi"
        sub="Theo dõi từ lúc đặt đến khi nhận tại cửa hàng."
      />
      <div className="row section-title">
        <input
          className="input flex"
          aria-label="Tìm mã đơn"
          placeholder="Tìm theo mã đơn hàng"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          aria-label="Trạng thái đơn"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(ORDER_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="stack">
        {orders.length ? (
          orders.map((o) => (
            <Panel key={o.id}>
              <div className="between">
                <div>
                  <Link className="red" to={"/don-hang/" + o.id} title={"Mã đầy đủ: " + o.id}>
                    <b>{formatShortOrderCode(o.id)}</b>
                  </Link>
                  <p className="small muted">{dateTime(o.createdAt)}</p>
                </div>
                <Badge
                  tone={
                    o.status === "completed"
                      ? "success"
                      : o.status === "canceled"
                        ? "danger"
                        : "info"
                  }
                >
                  {ORDER_STATUS[o.status]}
                </Badge>
              </div>
              <div className="row section">
                <Art
                  type={
                    data.products.find((p) => p.id === o.lines[0]?.id)?.category
                  }
                  className="mini"
                />
                <div>
                  <b>{o.lines[0]?.name}</b>
                  <p className="small muted">
                    {o.lines.reduce((s, l) => s + l.quantity, 0)} sản phẩm ·{" "}
                    {o.deliveryType === "shipping" ? "🚚 Giao hàng GHN" : "🏪 Nhận tại cửa hàng"}
                  </p>
                </div>
              </div>
              <div className="between section">
                <Badge tone={o.payment === "SUCCESS" ? "success" : "warning"}>
                  {PAYMENT_STATUS[o.payment]}
                </Badge>
                <div className="row">
                  <strong className="price">{money(o.final)}</strong>
                  <Button to={"/don-hang/" + o.id} tone="secondary">
                    Xem chi tiết →
                  </Button>
                </div>
              </div>
            </Panel>
          ))
        ) : (
          <Empty
            title="Chưa có đơn phù hợp"
            action={<Button to="/san-pham">Khám phá sản phẩm</Button>}
          />
        )}
      </div>
    </>
  );
}
