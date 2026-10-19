import { useState } from "react";
import { dateTime } from "@/utils";
import { TICKET_STATUS } from "../../constants";
import { Badge, Button, KV, Notice, Panel } from "@/components/ui";
import { Field } from "@/components/form";
import "./TicketEditor.scss";

export function TicketEditor({ ticket: t, data, onSave }) {
  const [note, setNote] = useState(t.note),
    [publicNote, setPublicNote] = useState(t.publicNote);
  const next = {
    received: ["inspecting"],
    inspecting: ["repairing", "rejected"],
    repairing: ["completed"],
    completed: ["returned", "inspecting"],
    rejected: ["returned"],
    returned: [],
  };
  return (
    <div className="stack">
      <Panel
        title={t.id}
        action={<Badge tone="info">{TICKET_STATUS[t.status]}</Badge>}
      >
        <KV label="Serial">
          {data.warranties.find((w) => w.id === t.warrantyId)?.serial}
        </KV>
        <KV label="Tiếp nhận">{dateTime(t.createdAt)}</KV>
        <h3 className="section">Lỗi khách báo</h3>
        <p>{t.issue}</p>
        <KV label="Ngoại quan">{t.condition || "Chưa ghi nhận"}</KV>
        <KV label="Phụ kiện">{t.accessories || "Chưa ghi nhận"}</KV>
        <div className="section">
          <Field label="Ghi chú nội bộ kỹ thuật">
            {(id) => (
              <textarea
                id={id}
                className="input full"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows="5"
              />
            )}
          </Field>
          <Field label="Thông tin hiển thị cho khách">
            {(id) => (
              <textarea
                id={id}
                className="input full"
                value={publicNote}
                onChange={(e) => setPublicNote(e.target.value)}
                rows="3"
              />
            )}
          </Field>
        </div>
        <div className="row wrap-row section">
          {next[t.status].map((s) => (
            <Button
              key={s}
              tone={s === "rejected" ? "ghost" : "primary"}
              onClick={() => onSave(s, note, publicNote)}
            >
              {s === "inspecting"
                ? "Bắt đầu kiểm tra"
                : s === "repairing"
                  ? "Bắt đầu sửa chữa"
                  : s === "completed"
                    ? "Hoàn tất sửa chữa"
                    : s === "returned"
                      ? "Xác nhận đã trả khách"
                      : "Từ chối bảo hành"}
            </Button>
          ))}
        </div>
      </Panel>
      <Notice tone="neutral">
        Ghi chú nội bộ không hiển thị ở trang khách. Ticket đã trả khách được
        giữ lại để đối chiếu lần tiếp nhận tiếp theo.
      </Notice>
    </div>
  );
}

export default TicketEditor;
