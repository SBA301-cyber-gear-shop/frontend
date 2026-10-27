import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dateTime } from "@/utils";
import {
  Art,
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

// Roadmap của cả lần gửi: trạng thái chung kèm tiến trình gộp của mọi linh kiện, mốc mới nhất thắng.
const intakeRoadmap = (intake) => ({
  status: intake.status,
  timeline: intake.components
    .flatMap((c) => c.timeline)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
});
// Phiếu cũ chưa có trong danh sách lần gửi (hiếm): hiển thị như một lần gửi một linh kiện.
const asIntake = (request) => ({
  intakeCode: request.intakeCode || request.requestCode,
  status: request.status,
  createdAt: request.createdAt,
  expectedReturnDate: request.expectedReturnDate,
  issueDescription: request.issueDescription,
  components: [request],
});

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
      {intakes.length > 0 && (
        <Panel title="Yêu cầu bảo hành của tôi" className="section">
          {intakes.map((i) => (
            <button
              className="ticket-preview between full"
              key={i.intakeCode}
              onClick={() => setSelected(i)}
            >
              <b>{i.intakeCode}</b>
              <span className="small muted">
                Đơn {i.orderCode} · {i.components.length} linh kiện
              </span>
              <Badge tone="info">{CUSTOMER_STATUS[i.status]}</Badge>
              <span>Xem tiến trình →</span>
            </button>
          ))}
        </Panel>
      )}
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
                      ? "Thẻ không còn hiệu lực"
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
              <Link className="text-button" to={"/don-hang/" + c.orderCode}>
                Xem đơn mua {c.orderCode} →
              </Link>
              {c.requests.map((t) => (
                <button
                  className="ticket-preview between full"
                  key={t.id}
                  onClick={() =>
                    setSelected(
                      intakes.find((i) => i.intakeCode === t.intakeCode) ||
                        asIntake(t),
                    )
                  }
                >
                  <b>{t.requestCode}</b>
                  <Badge tone="info">{CUSTOMER_STATUS[t.status]}</Badge>
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
          <div className="info-grid">
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
          <h3>Kết quả từng linh kiện</h3>
          {/* Lưới gọn để cả bộ máy nhiều linh kiện vẫn vừa một màn hình; lời nhắn dài xem khi rê chuột. */}
          <div className="parts-grid">
            {selected.components.map((c) => {
              const result =
                (c.resolution
                  ? CUSTOMER_RESOLUTION[c.resolution]
                  : CUSTOMER_STATUS[c.status]) +
                (c.publicNote ? " · " + c.publicNote : "");
              return (
                <p
                  className="small"
                  key={c.id}
                  title={c.productName + " " + c.serialNumber + ": " + result}
                >
                  <b>{c.productName}</b>
                  <span>
                    <span className="mono">{c.serialNumber}</span> · {result}
                  </span>
                </p>
              );
            })}
          </div>
          <p className="tiny muted">Cửa hàng sẽ cập nhật tiến trình tại đây.</p>
        </Modal>
      )}
    </>
  );
}
