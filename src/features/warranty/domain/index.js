export function createTicket(
  state,
  { warrantyId, issue, condition, accessories, id, now = new Date() },
) {
  const w = state.warranties.find((w) => w.id === warrantyId);
  if (
    !w ||
    w.status !== "active" ||
    now < new Date(w.start) ||
    now > new Date(w.end)
  )
    throw new Error("Thẻ không còn hiệu lực tại thời điểm tiếp nhận.");
  if (
    state.tickets.some(
      (t) => t.warrantyId === warrantyId && t.status !== "returned",
    )
  )
    throw new Error("Thiết bị đã có phiếu chưa đóng.");
  if (!issue.trim()) throw new Error("Vui lòng nhập mô tả lỗi.");
  const next = structuredClone(state);
  next.tickets.unshift({
    id,
    warrantyId,
    userId: w.userId,
    issue,
    condition,
    accessories,
    status: "received",
    note: "",
    publicNote: "Đã tiếp nhận thiết bị.",
    createdAt: now.toISOString(),
  });
  return next;
}
export function transitionTicket(state, id, status, note, publicNote) {
  const next = structuredClone(state),
    t = next.tickets.find((t) => t.id === id);
  const allowed = {
    received: ["inspecting"],
    inspecting: ["repairing", "rejected"],
    repairing: ["completed"],
    completed: ["returned", "inspecting"],
    rejected: ["returned"],
  };
  if (!t || !allowed[t.status]?.includes(status))
    throw new Error("Chuyển trạng thái bảo hành không hợp lệ.");
  if (!note.trim())
    throw new Error("Ghi nội dung kiểm tra hoặc bàn giao trước khi cập nhật.");
  t.status = status;
  t.note = note;
  t.publicNote = publicNote;
  if (status === "rejected") t.resolution = "REJECTED";
  if (status === "completed") {
    t.completedAt = new Date().toISOString();
    t.resolution = "REPAIRED";
  }
  if (status === "returned") t.returnedAt = new Date().toISOString();
  return next;
}
