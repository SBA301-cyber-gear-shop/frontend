import { useState } from "react";
import { useStore } from "@/store";

export function useProductManagement() {
  const { data } = useStore(),
    [selected, setSelected] = useState("ram16");
  return { data, selected, setSelected };
}
