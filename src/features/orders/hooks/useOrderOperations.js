import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { transitionOrder } from "../domain";

export function useOrderOperations() {
  const { data, commit, notify } = useStore(),
    [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [confirm, setConfirm] = useState(false),
    navigate = useNavigate();
  const filtered = data.orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (o.id + " " + o.pickupPhone + " " + o.pickupName)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = data.orders.find(
    (o) => o.id === (params.get("id") || "TZ-261001-0128"),
  );
  const [serials, setSerials] = useState({}),
    [checked, setChecked] = useState(false);
  const update = (action) => {
    try {
      commit((d) => transitionOrder(d, selected.id, action));
      notify("Đã cập nhật trạng thái demo.");
      setConfirm(false);
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const count = selected?.lines.reduce((s, l) => s + l.quantity, 0) || 0;
  function finish() {
    try {
      if (!checked)
        throw new Error("Xác nhận đối chiếu người nhận và thiết bị.");
      const units = Array.from(
        { length: count },
        (_, i) => serials[selected.id + "-" + i] || "",
      );
      commit((d) => transitionOrder(d, selected.id, "handover", units));
      notify("Đã bàn giao và tạo thẻ bảo hành theo serial.");
      navigate("/van-hanh/don-hang?id=" + selected.id);
    } catch (e) {
      notify(e.message, "danger");
    }
  }
  return {
    data,
    setParams,
    search,
    setSearch,
    status,
    setStatus,
    confirm,
    setConfirm,
    navigate,
    filtered,
    selected,
    serials,
    setSerials,
    checked,
    setChecked,
    update,
    count,
    finish,
  };
}
