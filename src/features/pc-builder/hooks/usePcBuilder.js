import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { delay } from "@/utils";
import { totalOf } from "@/features/products";
import { validateBuild, suggestBuild } from "../domain";

export function usePcBuilder() {
  const { data, commit, notify } = useStore(),
    [params] = useSearchParams(),
    navigate = useNavigate();
  const [budget, setBudget] = useState(data.budget),
    [purpose, setPurpose] = useState(params.get("purpose") || "gaming"),
    [scope, setScope] = useState("tower"),
    [ramGb, setRamGb] = useState(32),
    [request, setRequest] = useState(
      "Ưu tiên RAM 32GB; chưa bao gồm màn hình và thiết bị ngoại vi.",
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [replace, setReplace] = useState(null),
    [saved, setSaved] = useState(false);
  const check = validateBuild(data.build, data.products, Number(budget)),
    total = totalOf(data.build, data.products);
  function change(lines) {
    commit((d) => ({ ...d, build: lines, budget: Number(budget) }));
    setSaved(false);
  }
  async function suggest() {
    setError("");
    setBusy(true);
    try {
      await delay(600);
      const lines = suggestBuild(
        data.products,
        Number(budget),
        purpose,
        Number(ramGb),
        scope,
      );
      change(lines);
      notify("Đã tạo đề xuất demo và kiểm tra dữ liệu mẫu.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return {
    data,
    commit,
    notify,
    navigate,
    budget,
    setBudget,
    purpose,
    setPurpose,
    scope,
    setScope,
    ramGb,
    setRamGb,
    request,
    setRequest,
    busy,
    error,
    replace,
    setReplace,
    saved,
    setSaved,
    check,
    total,
    change,
    suggest,
  };
}
