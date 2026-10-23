import { dateTime } from "@/utils";
import { CUSTOMER_STATUS } from "../constants";

// Các mốc khách thấy, theo thứ tự. Chờ linh kiện là một nhánh của bước sửa chữa.
const PATH = [
  "received",
  "inspecting",
  "repairing",
  "ready_for_return",
  "returned",
];
const milestoneOf = (status) =>
  status === "waiting_for_parts" ? "repairing" : status;
const DEFAULT_TEXT = {
  received: "Cửa hàng đã nhận thiết bị của bạn.",
  inspecting: "Kỹ thuật viên đang kiểm tra lỗi thiết bị.",
  repairing: "Thiết bị của bạn đang được sửa.",
  waiting_for_parts: "Cửa hàng đang chờ linh kiện thay thế.",
  ready_for_return: "Mời bạn đến cửa hàng nhận lại thiết bị.",
  returned: "Bạn đã nhận lại thiết bị.",
  canceled: "Yêu cầu bảo hành đã được hủy.",
};

// Roadmap ngang của một phiếu (MyServiceRequestDto): nội dung các mốc xen kẽ trên và dưới đường.
export function RequestRoadmap({ request }) {
  const current = milestoneOf(request.status);
  const lastEntry = (m) =>
    request.timeline.findLast((e) => milestoneOf(e.status) === m);
  // Phiếu hủy: chỉ giữ các mốc đã đi qua rồi kết thúc ở mốc "Đã hủy".
  const steps =
    request.status === "canceled"
      ? [...PATH.filter((m) => lastEntry(m)), "canceled"]
      : PATH;
  const at = steps.indexOf(current);
  return (
    <div className="roadmap-wrap">
      <ol className="roadmap" style={{ "--steps": steps.length }}>
        {steps.map((m, i) => {
          const entry = i <= at ? lastEntry(m) : null;
          const state =
            i > at
              ? "todo"
              : i < at
                ? entry
                  ? "done"
                  : "skipped"
                : m === "returned"
                  ? "final"
                  : m === "canceled"
                    ? "canceled"
                    : "current";
          const title =
            m === "repairing" && request.status === "waiting_for_parts"
              ? CUSTOMER_STATUS.waiting_for_parts
              : CUSTOMER_STATUS[m];
          const text =
            entry?.publicNote ||
            DEFAULT_TEXT[
              m === "repairing" && request.status === "waiting_for_parts"
                ? "waiting_for_parts"
                : m
            ];
          return (
            <li
              key={m}
              className={"roadmap-step " + state + (i % 2 ? " up" : " down")}
              aria-current={i === at ? "step" : undefined}
            >
              <div className="roadmap-text">
                <b>{title}</b>
                {state === "skipped" && <span>Không cần bước này</span>}
                {entry && <span>{dateTime(entry.createdAt)}</span>}
                {entry && <p title={text}>{text}</p>}
              </div>
              <span className="roadmap-node">
                {state === "done" || state === "final"
                  ? "✓"
                  : String(i + 1).padStart(2, "0")}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
