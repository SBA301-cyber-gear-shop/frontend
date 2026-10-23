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

export function ApiCustomerWarranty() {
  const svc = useAftersales(),
    [cards, setCards] = useState(null),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    svc
      .myCards()
      .then((found) => {
        if (alive) {
          setCards(found);
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
                  onClick={() => setSelected(t)}
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
          title={"Yêu cầu " + selected.requestCode}
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
            {selected.resolution && (
              <KV label="Kết quả">
                {CUSTOMER_RESOLUTION[selected.resolution]}
              </KV>
            )}
          </div>
          <RequestRoadmap request={selected} />
          <div className="info-grid two">
            <div>
              <h3>Lỗi bạn đã báo</h3>
              <p className="small">{selected.issueDescription}</p>
            </div>
            <div>
              <h3>Thông tin từ cửa hàng</h3>
              <p className="small">
                {selected.publicNote || "Cửa hàng đang xử lý yêu cầu."}
              </p>
            </div>
          </div>
          <p className="tiny muted">Cửa hàng sẽ cập nhật tiến trình tại đây.</p>
        </Modal>
      )}
    </>
  );
}
