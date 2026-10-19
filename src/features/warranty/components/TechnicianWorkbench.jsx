import { transitionTicket } from "../domain";
import { TICKET_STATUS } from "../constants";
import { Badge, Empty, Heading, Panel } from "@/components/ui";
import { TicketEditor } from "./TicketEditor";
import { useTechnicianWorkbench } from "../hooks/useTechnicianWorkbench";

export function TechnicianWorkbench() {
  const {
    data,
    commit,
    notify,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    ticket,
  } = useTechnicianWorkbench();
  return (
    <>
      <Heading
        title="Xử lý kỹ thuật"
        sub="Chẩn đoán, sửa chữa, kiểm tra và trả thiết bị."
        eyebrow="VẬN HÀNH / KỸ THUẬT"
      />
      <div className="two-col">
        <Panel title="Danh sách yêu cầu">
          <select
            className="input full"
            aria-label="Lọc phiếu bảo hành"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(TICKET_STATUS).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <div className="stack section">
            {data.tickets
              .filter((t) => filter === "all" || t.status === filter)
              .map((t) => (
                <button
                  className={
                    "selection " + (t.id === selectedId ? "selected" : "")
                  }
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div>
                    <b>{t.id}</b>
                    <p className="small muted">{t.issue}</p>
                    <Badge tone="info">{TICKET_STATUS[t.status]}</Badge>
                  </div>
                </button>
              ))}
          </div>
        </Panel>
        {ticket ? (
          <TicketEditor
            key={ticket.id + "-" + ticket.status}
            ticket={ticket}
            data={data}
            onSave={(status, note, publicNote) => {
              try {
                commit((d) =>
                  transitionTicket(d, ticket.id, status, note, publicNote),
                );
                notify("Đã cập nhật yêu cầu.");
              } catch (e) {
                notify(e.message, "danger");
              }
            }}
          />
        ) : (
          <Empty title="Chọn yêu cầu cần xử lý" />
        )}
      </div>
    </>
  );
}
