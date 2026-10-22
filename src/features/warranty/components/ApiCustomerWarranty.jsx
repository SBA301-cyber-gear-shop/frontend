import { useEffect, useState } from "react";
import { dateTime } from "@/utils";
import {
  Art,
  Badge,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { REQUEST_RESOLUTION, REQUEST_STATUS } from "../constants";
import { useAftersales } from "../hooks/useAftersales";

export function ApiCustomerWarranty() {
  const svc = useAftersales(),
    [cards, setCards] = useState(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  useEffect(() => {
    let alive = true;
    svc
      .myCards()
      .then((found) => alive && setCards(found))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [svc]);
  const shown = (cards || []).filter((c) =>
    c.serialNumber.toLowerCase().includes(search.toLowerCase()),
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
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="stack section">
        {shown.length ? (
          shown.map((c) => (
            <Panel key={c.id}>
              <div className="between">
                <div className="row">
                  <Art className="mini" />
                  <div>
                    <h3>{c.productName}</h3>
                    <p className="small mono">{c.serialNumber}</p>
                  </div>
                </div>
                <Badge tone={c.valid ? "success" : "warning"}>
                  {c.status === "replaced"
                    ? "Đã đổi thiết bị"
                    : c.status !== "active"
                      ? "Thẻ bị vô hiệu"
                      : c.valid
                        ? "Còn bảo hành"
                        : "Hết hạn"}
                </Badge>
              </div>
              <div className="two-col section">
                <KV label="Bắt đầu">
                  {new Date(c.startDate).toLocaleDateString("vi-VN")}
                </KV>
                <KV label="Kết thúc">
                  {new Date(c.endDate).toLocaleDateString("vi-VN")}
                </KV>
              </div>
              {c.replacedBySerialNumber && (
                <p className="small muted">
                  Thiết bị đã được đổi sang serial{" "}
                  <b className="mono">{c.replacedBySerialNumber}</b>.
                </p>
              )}
              <p className="small muted">Đơn mua {c.orderCode}</p>
              {c.requests.map((t) => (
                <button
                  className="ticket-preview between full"
                  key={t.id}
                  onClick={() => setSelected(t)}
                >
                  <b>{t.requestCode}</b>
                  <Badge tone="info">{REQUEST_STATUS[t.status]}</Badge>
                  <span>Xem tiến trình →</span>
                </button>
              ))}
            </Panel>
          ))
        ) : (
          <Empty
            title={
              cards
                ? "Chưa có thiết bị phù hợp"
                : error
                  ? "Không tải được thẻ bảo hành"
                  : "Đang tải thẻ bảo hành"
            }
            description="Thẻ bảo hành xuất hiện sau khi đơn được bàn giao."
          />
        )}
      </div>
      {selected && (
        <Modal
          title={"Yêu cầu " + selected.requestCode}
          onClose={() => setSelected(null)}
        >
          <Badge tone="info">{REQUEST_STATUS[selected.status]}</Badge>{" "}
          {selected.resolution && (
            <Badge>{REQUEST_RESOLUTION[selected.resolution]}</Badge>
          )}
          <KV label="Tiếp nhận">{dateTime(selected.createdAt)}</KV>
          {selected.expectedReturnDate && (
            <KV label="Ngày hẹn trả">
              {new Date(selected.expectedReturnDate).toLocaleDateString(
                "vi-VN",
              )}
            </KV>
          )}
          <h3 className="section">Lỗi đã báo</h3>
          <p>{selected.issueDescription}</p>
          <h3 className="section">Thông tin từ cửa hàng</h3>
          <p>{selected.publicNote || "Cửa hàng đang xử lý yêu cầu."}</p>
          <h3 className="section">Tiến trình</h3>
          {selected.timeline.map((e, i) => (
            <div className="ticket-preview" key={i}>
              <div className="row wrap-row between">
                <b>{REQUEST_STATUS[e.status]}</b>
                <span className="small muted">{dateTime(e.createdAt)}</span>
              </div>
              {e.publicNote && <p className="small">{e.publicNote}</p>}
            </div>
          ))}
          <p className="tiny muted section">
            Ghi chú nội bộ chỉ dành cho nhân viên phụ trách.
          </p>
        </Modal>
      )}
    </>
  );
}
