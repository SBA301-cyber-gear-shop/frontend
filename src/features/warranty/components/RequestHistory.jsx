import { dateTime } from "@/utils";
import { Badge, KV } from "@/components/ui";
import { REQUEST_RESOLUTION, REQUEST_STATUS } from "../constants";
import { day } from "../domain/requests";

export function HistoryCounts({ counts }) {
  return <div className="tech-history-counts">
    <span><strong>{counts.received}</strong> lần tiếp nhận</span>
    <span><strong>{counts.repaired}</strong> lần sửa</span>
    <span><strong>{counts.replaced}</strong> lần đổi</span>
  </div>;
}

export function RequestHistory({ requests, onView }) {
  if (!requests.length)
    return <p className="small muted">Thẻ chưa có phiếu bảo hành nào.</p>;
  return requests.map((r) => (
    <div className="ticket-preview row wrap-row between" key={r.id}>
      <b className="mono">{r.requestCode}</b>
      <span className="small muted">{dateTime(r.createdAt)}</span>
      <Badge tone="info">{REQUEST_STATUS[r.status]}</Badge>
      {r.resolution && <Badge>{REQUEST_RESOLUTION[r.resolution]}</Badge>}
      {onView && (
        <button className="text-button" onClick={() => onView(r.id)}>
          Xem chi tiết
        </button>
      )}
    </div>
  ));
}

// Nội dung đầy đủ của một phiếu (ServiceRequestDto), dùng trong modal xem chi tiết.
export function RequestDetail({ ticket: t }) {
  return (
    <>
      <div className="row wrap-row">
        <Badge tone="info">{REQUEST_STATUS[t.status]}</Badge>
        {t.resolution && <Badge>{REQUEST_RESOLUTION[t.resolution]}</Badge>}
      </div>
      <KV label="Thiết bị">
        {t.card.productName} · {t.card.serialNumber}
      </KV>
      <KV label="Đơn mua">{t.card.orderCode}</KV>
      <KV label="Người mang máy">
        {t.contactName || "Chưa ghi nhận"} · {t.contactPhone || ""}
      </KV>
      <KV label="Tiếp nhận">{dateTime(t.createdAt)}</KV>
      <KV label="Ngày hẹn trả">{day(t.expectedReturnDate)}</KV>
      <KV label="Kỹ thuật viên">{t.assignedTechnicianName || "Chưa có"}</KV>
      <h3 className="section">Lỗi khách báo</h3>
      <p>{t.issueDescription}</p>
      <KV label="Ngoại quan">{t.conditionNote || "Chưa ghi nhận"}</KV>
      <KV label="Phụ kiện">{t.accessoriesNote || "Chưa ghi nhận"}</KV>
      <h3 className="section history-title">Lịch sử xử lý</h3>
      <Timeline events={t.events} />
    </>
  );
}

export function Timeline({ events }) {
  return events.map((e, i) => (
    <div className="ticket-preview history-event" key={i}>
      <div className="row wrap-row between">
        <b>
          {e.fromStatus === e.toStatus ? "Ghi chú" : REQUEST_STATUS[e.toStatus]}
        </b>
        <span className="small muted">
          {dateTime(e.createdAt)} · {e.actorName}
        </span>
      </div>
      {e.internalNote && <p className="small history-note history-note-internal"><span>Ghi chú nội bộ: </span>{e.internalNote}</p>}
      {e.publicNote && <p className="small history-note history-note-public"><span>Thông tin cho khách: </span>{e.publicNote}</p>}
    </div>
  ));
}
