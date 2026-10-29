import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { transitionOrder } from "../domain";
import { ORDER_STATUS } from "../constants";
import { ordersApi } from "../api/ordersApi";
import { useApiOrders } from "./useApiOrders";
import { useDebounce } from "@/hooks";

export function useOrderOperations() {
  const { data, commit, notify, demoMode, reloadCatalog } = useStore(),
    [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [confirm, setConfirm] = useState(false),
    navigate = useNavigate();
  const remote = useApiOrders({
    operations: true,
    search: useDebounce(search, 300),
    status: "all",
  });
  const pending = useRef(false),
    [busy, setBusy] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [recipientPhones, setRecipientPhones] = useState({});
  const [amounts, setAmounts] = useState({}),
    [references, setReferences] = useState({});
  const orders = demoMode ? data.orders : remote.orders;

  const statusCounts = useMemo(() => {
    const list = orders || [];
    const counts = { all: list.length };
    for (const key of Object.keys(ORDER_STATUS)) {
      counts[key] = 0;
    }
    for (const o of list) {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    }
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    return (orders || []).filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (o.id + " " + (o.pickupPhone || "") + " " + (o.pickupName || ""))
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  }, [orders, status, search]);
  const selected = params.has("id")
    ? filtered.find((o) => o.id === params.get("id"))
    : filtered[0];
  const [serials, setSerials] = useState({}),
    [checkedOrder, setCheckedOrder] = useState(null);
  const checked = Boolean(selected && checkedOrder === selected.id);
  const setChecked = (value) =>
    setCheckedOrder(value && selected ? selected.id : null);
  const openConfirm = (setter) => {
    if (!selected || busy) return;
    setParams({ id: selected.id });
    setter(true);
  };
  const update = async (action) => {
    if (!demoMode) {
      if (pending.current || !selected) return;
      setParams({ id: selected.id });
      pending.current = true;
      setBusy(true);
      try {
        let result;
        if (action === "advance")
          result = await ordersApi.advance(
            selected.id,
            {
              pending: "confirmed",
              confirmed: "preparing",
              preparing: "ready_for_pickup",
            }[selected.status],
          );
        else if (action === "pay") {
          const value = amounts[selected.id] || "";
          if (!String(value).trim() || !Number.isFinite(Number(value)))
            throw new Error("Nhập số tiền thực tế đã nhận.");
          result = await ordersApi.collect(
            selected.id,
            Number(value),
            references[selected.id] || "",
          );
        } else if (action === "cancel")
          result = await ordersApi.cancel(selected.id, true);
        if (result) remote.replaceOrder(result);
        setConfirm(false);
        setCancelConfirm(false);
        notify("Đã cập nhật đơn hàng.");
      } catch (error) {
        notify(error.message, "danger");
        remote.refresh();
      } finally {
        pending.current = false;
        setBusy(false);
      }
      return;
    }
    try {
      commit((d) => transitionOrder(d, selected.id, action));
      notify("Đã cập nhật trạng thái demo.");
      setConfirm(false);
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const warrantyLines =
    selected?.lines.filter((line) => demoMode || line.warranty > 0) || [];
  const count = warrantyLines.reduce((sum, line) => sum + line.quantity, 0);
  async function finish() {
    if (!demoMode) {
      if (pending.current || !selected) return;
      pending.current = true;
      setBusy(true);
      try {
        if (!checked)
          throw new Error("Xác nhận đối chiếu người nhận và thiết bị.");
        const units = warrantyLines.flatMap((line) =>
          Array.from({ length: line.quantity }, () => line),
        );
        const result = await ordersApi.handover(selected.id, {
          recipientPhone: recipientPhones[selected.id] || "",
          recipientVerified: checked,
          devices: units.map((line, index) => ({
            orderItemId: line.orderItemId,
            serialNumber: serials[selected.id + "-" + index] || "",
          })),
        });
        remote.replaceOrder(result);
        notify(
          count
            ? "Đã bàn giao và kích hoạt bảo hành cho từng thiết bị."
            : "Đã bàn giao đơn hàng.",
        );
        void reloadCatalog();
        navigate("/van-hanh/don-hang?id=" + selected.id);
      } catch (error) {
        notify(error.message, "danger");
        remote.refresh();
      } finally {
        pending.current = false;
        setBusy(false);
      }
      return;
    }
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
    setConfirm: (value) =>
      value ? openConfirm(setConfirm) : setConfirm(false),
    navigate,
    filtered,
    statusCounts,
    selected,
    serials,
    setSerials,
    checked,
    setChecked,
    update,
    count,
    finish,
    demoMode,
    busy,
    loading: remote.loading,
    error: remote.error,
    refresh: remote.refresh,
    warrantyLines,
    cancelConfirm,
    setCancelConfirm: (value) =>
      value ? openConfirm(setCancelConfirm) : setCancelConfirm(false),
    recipientPhone: recipientPhones[selected?.id] !== undefined ? recipientPhones[selected?.id] : (selected?.pickupPhone || ""),
    setRecipientPhone: (value) =>
      setRecipientPhones((previous) => ({ ...previous, [selected.id]: value })),
    receivedAmount: amounts[selected?.id] || "",
    setReceivedAmount: (value) =>
      setAmounts((previous) => ({ ...previous, [selected.id]: value })),
    reference: references[selected?.id] || "",
    setReference: (value) =>
      setReferences((previous) => ({ ...previous, [selected.id]: value })),
  };
}
