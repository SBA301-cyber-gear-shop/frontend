import { Link } from "react-router-dom";
import { dateTime } from "@/utils";
import { TICKET_STATUS } from "../constants";
import {
  Art,
  Button,
  Badge,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { useCustomerWarranty } from "../hooks/useCustomerWarranty";

export function CustomerWarranty() {
  const {
    data,
    user,
    search,
    setSearch,
    selected,
    setSelected,
    cards,
    loading,
    error,
    refresh,
  } = useCustomerWarranty();
  if (loading) return <Notice>Đang tải thẻ bảo hành…</Notice>;
  if (error)
    return (
      <div className="stack">
        <Notice tone="danger">{error}</Notice>
        <Button onClick={refresh}>Tải lại bảo hành</Button>
      </div>
    );
  return (
    <>
      <Heading
        title="Bảo hành của tôi"
        sub="Mỗi thiết bị, một serial. Theo dõi rõ từng yêu cầu."
      />
      <input
        className="input full section-title"
        aria-label="Tìm serial bảo hành"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo serial thiết bị"
      />
      <Notice>
        Để yêu cầu bảo hành, mang thiết bị đến cửa hàng. Nhân viên sẽ đối chiếu
        serial và tiếp nhận trực tiếp.
      </Notice>
      <div className="stack section">
        {cards.length ? (
          cards.map((w) => {
            const p = data.products.find((p) => p.id === w.productId),
              tickets = data.tickets.filter(
                (t) => t.warrantyId === w.id && t.userId === user.id,
              );
            return (
              <Panel key={w.id}>
                <div className="between">
                  <div className="row">
                    <Art type={p?.category} className="mini" />
                    <div>
                      <h3>{w.productName || p?.name}</h3>
                      <p className="small mono">{w.serial}</p>
                    </div>
                  </div>
                  <Badge
                    tone={new Date(w.end) > new Date() ? "success" : "warning"}
                  >
                    {new Date(w.end) > new Date() ? "Còn bảo hành" : "Hết hạn"}
                  </Badge>
                </div>
                <div className="two-col section">
                  <KV label="Bắt đầu">
                    {new Date(w.start).toLocaleDateString("vi-VN")}
                  </KV>
                  <KV label="Kết thúc">
                    {new Date(w.end).toLocaleDateString("vi-VN")}
                  </KV>
                </div>
                <Link className="text-button" to={"/don-hang/" + w.orderId}>
                  Xem đơn mua →
                </Link>
                {tickets.map((t) => (
                  <button
                    className="ticket-preview between full"
                    key={t.id}
                    onClick={() => setSelected(t)}
                  >
                    <b>{t.id}</b>
                    <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
                    <span>Xem tiến trình →</span>
                  </button>
                ))}
              </Panel>
            );
          })
        ) : (
          <Empty
            title="Chưa có thiết bị phù hợp"
            description="Thẻ bảo hành xuất hiện sau khi đơn được bàn giao."
          />
        )}
      </div>
      {selected && (
        <Modal
          title={"Yêu cầu " + selected.id}
          onClose={() => setSelected(null)}
        >
          <Badge tone="info">{TICKET_STATUS[selected.status]}</Badge>
          <KV label="Tiếp nhận">{dateTime(selected.createdAt)}</KV>
          <h3 className="section">Lỗi đã báo</h3>
          <p>{selected.issue}</p>
          <h3 className="section">Thông tin từ cửa hàng</h3>
          <p>{selected.publicNote || "Cửa hàng đang xử lý yêu cầu."}</p>
          <p className="tiny muted section">
            Ghi chú nội bộ chỉ dành cho nhân viên phụ trách.
          </p>
        </Modal>
      )}
    </>
  );
}
