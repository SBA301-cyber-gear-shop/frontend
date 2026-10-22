import { dateTime } from "@/utils";
import { Badge } from "@/components/ui";
import { REQUEST_RESOLUTION, REQUEST_STATUS } from "../constants";

export function RequestHistory({ requests }) {
  if (!requests.length)
    return <p className="small muted">Thẻ chưa có phiếu bảo hành nào.</p>;
  return requests.map((r) => (
    <div className="ticket-preview row wrap-row between" key={r.id}>
      <b className="mono">{r.requestCode}</b>
      <span className="small muted">{dateTime(r.createdAt)}</span>
      <Badge tone="info">{REQUEST_STATUS[r.status]}</Badge>
      {r.resolution && <Badge>{REQUEST_RESOLUTION[r.resolution]}</Badge>}
    </div>
  ));
}

export function Timeline({ events }) {
  return events.map((e, i) => (
    <div className="ticket-preview" key={i}>
      <div className="row wrap-row between">
        <b>
          {e.fromStatus === e.toStatus ? "Ghi chú" : REQUEST_STATUS[e.toStatus]}
        </b>
        <span className="small muted">
          {dateTime(e.createdAt)} · {e.actorName}
        </span>
      </div>
      {e.internalNote && <p className="small">{e.internalNote}</p>}
      {e.publicNote && <p className="small muted">Cho khách: {e.publicNote}</p>}
    </div>
  ));
}
