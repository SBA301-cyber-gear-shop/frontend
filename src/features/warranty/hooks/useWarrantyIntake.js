import { useState } from "react";
import { useStore } from "@/store";
import { createTicket } from "../domain";

export function useWarrantyIntake() {
  const { data, commit, notify } = useStore(),
    [search, setSearch] = useState("KST26A000428"),
    [selectedId, setSelectedId] = useState("wc1"),
    [issue, setIssue] = useState(""),
    [condition, setCondition] = useState(""),
    [accessories, setAccessories] = useState(""),
    [verified, setVerified] = useState(false),
    [created, setCreated] = useState(null);
  const card = data.warranties.find((w) => w.id === selectedId),
    product = data.products.find((p) => p.id === card?.productId),
    existing = data.tickets.find(
      (t) => t.warrantyId === card?.id && t.status !== "returned",
    );
  const matches = data.warranties.filter((w) => {
    const o = data.orders.find((o) => o.id === w.orderId);
    return (w.serial + " " + w.orderId + " " + o?.pickupPhone)
      .toLowerCase()
      .includes(search.toLowerCase().replaceAll(" ", ""));
  });
  function submit(e) {
    e.preventDefault();
    try {
      if (!verified)
        throw new Error("Đối chiếu serial và xác nhận đã nhận thiết bị.");
      const id = "BH-" + crypto.randomUUID().slice(0, 8).toUpperCase();
      commit((d) =>
        createTicket(d, {
          id,
          warrantyId: card.id,
          issue,
          condition,
          accessories,
        }),
      );
      setCreated(id);
      notify("Đã tạo phiếu tiếp nhận.");
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  return {
    data,
    search,
    setSearch,
    selectedId,
    setSelectedId,
    issue,
    setIssue,
    condition,
    setCondition,
    accessories,
    setAccessories,
    verified,
    setVerified,
    created,
    setCreated,
    card,
    product,
    existing,
    matches,
    submit,
  };
}
