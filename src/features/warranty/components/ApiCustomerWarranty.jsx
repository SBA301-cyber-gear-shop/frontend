import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dateTime } from "@/utils";
import {
  Badge,
  Button,
  Empty,
  Heading,
  KV,
  Modal,
  Notice,
  Panel,
} from "@/components/ui";
import { CUSTOMER_RESOLUTION, CUSTOMER_STATUS } from "../constants";
import { useAftersales } from "../hooks/useAftersales";
import { RequestRoadmap } from "./RequestRoadmap";
import { groupByPc } from "../domain/requests";
import { HistoryCounts } from "./RequestHistory";
import { deviceChain, historyCounts } from "../domain/deviceHistory";

// Roadmap của cả lần gửi: trạng thái chung kèm tiến trình gộp của mọi linh kiện, mốc mới nhất thắng.
const intakeRoadmap = (intake) => ({
  status: intake.status,
  timeline: intake.components
    .flatMap((c) => c.timeline)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
});
const day = (value) => new Date(value).toLocaleDateString("vi-VN");
const cardState = (c) =>
  c.status === "replaced"
    ? "Đã đổi thiết bị"
    : c.status !== "active"
      ? "Thẻ không còn hiệu lực"
      : c.valid
        ? "Còn bảo hành"
        : "Hết hạn";

export function ApiCustomerWarranty() {
  const svc = useAftersales(),
    [cards, setCards] = useState(null),
    [intakes, setIntakes] = useState([]),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all([svc.myCards(), svc.myIntakes()])
      .then(([found, mine]) => {
        if (alive) {
          setCards(found);
          setIntakes(mine);
          setError("");
        }
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [svc, attempt]);
  const shown = (cards || []).filter((c) =>
    c.serialNumber.toLowerCase().includes(search.toLowerCase()),
  );
  // Gom thẻ theo đơn mua; Map giữ thứ tự BE trả về.
  const orders = new Map();
  for (const c of shown) {
    if (!orders.has(c.orderCode)) orders.set(c.orderCode, []);
    orders.get(c.orderCode).push(c);
  }
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
      {error && (
        <div className="stack section">
          <Notice tone="danger">{error}</Notice>
          <Button onClick={() => setAttempt((value) => value + 1)}>
            Tải lại bảo hành
          </Button>
        </div>
      )}
      <div className="stack section">
        {shown.length ? (
          [...orders].map(([orderCode, items]) => {
            const sent = intakes.filter((i) => i.orderCode === orderCode);
            return (
              <Panel key={orderCode}>
                {/* Thu gọn như trang kỹ thuật; đang tìm serial thì mở sẵn các đơn khớp. */}
                <details className="intake-group" open={search !== ""}>
                  <summary>
                    Đơn {orderCode} · {items.length} linh kiện
                    {sent.length > 0 && " · " + sent.length + " lần gửi bảo hành"}
                  </summary>
                  {/* Một lưới chung cho cả đơn để các cột thẳng hàng giữa mọi linh kiện. */}
                  {groupByPc(items).map((group) => <div key={group.id ?? "loose"}>
                  <h3 className="section">{group.label}</h3>
                  <div className="warranty-table">
                    <span className="th name">Linh kiện</span>
                    <span className="th">Bắt đầu</span>
                    <span className="th">Kết thúc</span>
                    <span className="th">Trạng thái</span>
                    {group.items.map((c) => (
                      <Fragment key={c.id}>
                        <div className="name">
                          <b>{c.productName}</b>
                          <p className="small mono">{c.serialNumber}</p>
                          {c.replacedBySerialNumber && (
                            <p className="replacement-serial">
                              Đã đổi sang serial{" "}
                              <b className="mono">{c.replacedBySerialNumber}</b>
                            </p>
                          )}
                        </div>
                        <span className="small">{day(c.startDate)}</span>
                        <span className="small">{day(c.endDate)}</span>
                        <span>
                          <Badge tone={c.valid ? "success" : "warning"}>
                            {cardState(c)}
                          </Badge>
                        </span>
                        <div className="customer-history-cell">
                          {(() => {
                            const chain = deviceChain(cards || [], c);
                            const own = historyCounts([c]);
                            const total = historyCounts(chain);
                            return <details className="small tech-history customer-device-history"><summary>Lịch sử thiết bị</summary>
                              <div className="tech-history-chain"><span>Serial này</span><strong>{c.serialNumber}</strong></div>
                              <HistoryCounts counts={own} />
                              {chain.length > 1 && <>
                                <div className="tech-history-chain"><span>Chuỗi serial</span><strong>{chain.map((item) => item.serialNumber).join(" → ")}</strong></div>
                                <HistoryCounts counts={total} />
                              </>}
                              {chain.some((item) => item.requests?.length > 0) && <div className="customer-history-events">
                                <span className="customer-history-heading">Lịch sử xử lý</span>
                                {chain.flatMap((item) => (item.requests || []).map((r) => <div className="customer-history-event" key={r.id}>
                                  <span className="customer-history-serial">{item.serialNumber}</span>
                                  <span className="customer-history-result">
                                    {r.resolution ? CUSTOMER_RESOLUTION[r.resolution] : CUSTOMER_STATUS[r.status]}
                                    {r.resolution === "replaced" && (r.replacementSerialNumber || item.replacedBySerialNumber) && <>
                                      {" · Serial mới: "}<strong className="customer-history-new-serial">{r.replacementSerialNumber || item.replacedBySerialNumber}</strong>
                                    </>}
                                  </span>
                                  {r.resolution && <span className="customer-history-status">{CUSTOMER_STATUS[r.status]}</span>}
                                </div>))}
                              </div>}
                            </details>;
                          })()}
                        </div>
                      </Fragment>
                    ))}
                  </div></div>)}
                  {sent.length > 0 && (
                    <>
                      <h3 className="section">Lần gửi bảo hành</h3>
                      <div className="customer-intakes">
                      {sent.map((i) => (
                        <button
                          className="ticket-preview intake-row full"
                          key={i.intakeCode}
                          onClick={() => setSelected(i)}
                        >
                          <b className="mono">{i.intakeCode}</b>
                          <span className="small intake-date">{dateTime(i.createdAt)}</span>
                          <span className="small intake-count">
                            {i.components.length} linh kiện
                          </span>
                          <span className="state">
                            <Badge tone="info">{CUSTOMER_STATUS[i.status]}</Badge>
                          </span>
                          <span className="small go">Xem tiến trình →</span>
                        </button>
                      ))}
                      </div>
                    </>
                  )}
                  <Link
                    className="text-button section"
                    to={"/don-hang/" + orderCode}
                  >
                    Xem đơn mua {orderCode} →
                  </Link>
                </details>
              </Panel>
            );
          })
        ) : (
          <Empty
            title={
              cards
                ? "Chưa có thiết bị phù hợp"
                : error
                  ? "Không tải được thẻ bảo hành"
                  : "Đang tải thẻ bảo hành"
            }
            description="Thẻ bảo hành xuất hiện sau khi bạn nhận hàng tại cửa hàng."
          />
        )}
      </div>
      {selected && (
        <Modal
          className="wide"
          title={"Yêu cầu " + selected.intakeCode}
          onClose={() => setSelected(null)}
        >
          <div className="info-grid customer-intake-summary">
            <KV label="Trạng thái">{CUSTOMER_STATUS[selected.status]}</KV>
            <KV label="Ngày gửi bảo hành">{dateTime(selected.createdAt)}</KV>
            <KV label="Hẹn nhận máy">
              {selected.expectedReturnDate
                ? new Date(selected.expectedReturnDate).toLocaleDateString(
                    "vi-VN",
                  )
                : "Chưa có"}
            </KV>
            <KV label="Linh kiện">{selected.components.length}</KV>
          </div>
          <RequestRoadmap request={intakeRoadmap(selected)} />
          <p className="small">
            <b>Lỗi bạn đã báo:</b> {selected.issueDescription}
          </p>
          <h3 className="section">Kết quả từng linh kiện</h3>
          {groupByPc(selected.components).map((group) => <div key={group.id ?? "loose"}>
          <h4 className="section">{group.label}</h4>
          <div className="parts-grid">
            {group.items.map((c) => {
              const result = c.resolution
                ? CUSTOMER_RESOLUTION[c.resolution]
                : CUSTOMER_STATUS[c.status];
              return (
                <article className="customer-part" key={c.id}>
                  <h4>{c.productName}</h4>
                  <p className="small muted">Serial: <span className="mono">{c.serialNumber}</span></p>
                  <div className="customer-part-badges">
                    <Badge tone="info">{result || "Đang cập nhật"}</Badge>
                    {c.underWarrantyAtIntake === false && <Badge tone="warning">Ngoài bảo hành lúc nhận</Badge>}
                  </div>
                  {c.publicNote && <p className="small customer-part-note">{c.publicNote}</p>}
                  {c.warrantyEndDate && <p className="small">Hạn bảo hành: {day(c.warrantyEndDate)}</p>}
                  {c.warrantyRemainingDays != null && (
                    <p className="small muted">Còn {c.warrantyRemainingDays} ngày tính tại {day(c.warrantyRemainingAsOf)}</p>
                  )}
                  {c.replacementSerialNumber && (
                    <p className="small">Đổi sang {c.replacementSerialNumber} · hạn {day(c.replacementWarrantyEndDate)}</p>
                  )}
                  {c.replacementWarrantyRemainingDays != null && (
                    <p className="small muted">Thẻ thay thế còn {c.replacementWarrantyRemainingDays} ngày tính từ hôm nay</p>
                  )}
                </article>
              );
            })}
          </div></div>)}
          <p className="tiny muted">Cửa hàng sẽ cập nhật tiến trình tại đây.</p>
        </Modal>
      )}
    </>
  );
}
