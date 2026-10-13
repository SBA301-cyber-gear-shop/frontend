import { useState } from "react";
import { useStore } from "@/store";

export function useSpecificationManagement() {
  const { data, commit, notify } = useStore(),
    [category, setCategory] = useState("ram"),
    [newName, setNewName] = useState(""),
    [draft, setDraft] = useState(data.specSettings.ram || []);
  function choose(id) {
    setCategory(id);
    setDraft(data.specSettings[id] || []);
  }
  function toggle(i, key) {
    setDraft((d) => d.map((s, n) => (n === i ? { ...s, [key]: !s[key] } : s)));
  }
  return {
    data,
    commit,
    notify,
    category,
    newName,
    setNewName,
    draft,
    setDraft,
    choose,
    toggle,
  };
}
