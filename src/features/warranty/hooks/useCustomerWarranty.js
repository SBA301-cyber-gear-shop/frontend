import { useState } from "react";
import { useStore } from "@/store";

export function useCustomerWarranty() {
  const { data, user } = useStore(),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const cards = data.warranties.filter(
    (w) =>
      w.userId === user.id &&
      w.serial.toLowerCase().includes(search.toLowerCase()),
  );
  return { data, user, search, setSearch, selected, setSelected, cards };
}
