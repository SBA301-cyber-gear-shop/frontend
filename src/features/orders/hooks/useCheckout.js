import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { totalOf } from "@/features/products";
import { promotionQuote } from "@/features/promotions";
import { placeOrder } from "../domain";
import { demoMode } from "@/utils";
import { useLiveCheckout } from "./useLiveCheckout";

export const useCheckout = demoMode ? useDemoCheckout : useLiveCheckout;

function useDemoCheckout() {
  const { data, user, commit, notify } = useStore(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    fromBuild = params.get("source") === "build";
  const lines = fromBuild ? data.build : data.cart,
    total = totalOf(lines, data.products);
  const [name, setName] = useState(user?.name || ""),
    [phone, setPhone] = useState(user?.phone || ""),
    [note, setNote] = useState(""),
    [method, setMethod] = useState("store"),
    [inputCode, setInputCode] = useState(""),
    [applied, setApplied] = useState(""),
    [error, setError] = useState(""),
    [promoError, setPromoError] = useState(""),
    [placing, setPlacing] = useState(false);
  let discount = 0;
  try {
    if (applied) {
      discount = promotionQuote(data, applied, user.id, total).discount;
    }
  } catch (e) {
    if (!promoError) setPromoError(e.message);
  }
  function apply() {
    const code = inputCode.trim();
    if (!code) {
      setPromoError("Vui lòng nhập mã giảm giá.");
      return;
    }
    try {
      promotionQuote(data, code, user.id, total);
      setApplied(code.toUpperCase());
      setInputCode(code.toUpperCase());
      setError("");
      setPromoError("");
      notify("Đã áp dụng mã cho giá dự kiến.");
    } catch (e) {
      setPromoError(e.message);
      setApplied("");
    }
  }
  function submit(e) {
    if (e?.preventDefault) e.preventDefault();
    setError("");
    if (placing) return;
    setPlacing(true);
    try {
      const id =
        "TZ-" +
        new Date().toISOString().slice(0, 10).replaceAll("-", "") +
        "-" +
        crypto.randomUUID().slice(0, 6).toUpperCase();
      commit(
        (current) =>
          placeOrder(current, {
            user,
            lines,
            expectedTotal: total,
            budget: current.budget,
            fromBuild,
            pickupName: name,
            pickupPhone: phone,
            note,
            method,
            code: applied,
            id,
          }).state,
      );
      navigate("/don-hang/" + id + "?created=1");
      notify("Đã tạo đơn demo. Chưa phát sinh thanh toán thật.");
    } catch (err) {
      setError(err.message);
      setPlacing(false);
    }
  }
  return {
    data,
    demoMode: true,
    user,
    fromBuild,
    lines,
    total,
    name,
    setName,
    phone,
    setPhone,
    note,
    setNote,
    method,
    setMethod,
    inputCode,
    setInputCode: (val) => {
      setInputCode(val);
      if (promoError) setPromoError("");
    },
    applied,
    setApplied: (val) => {
      setApplied(val);
      if (!val) {
        setInputCode("");
        setPromoError("");
      }
    },
    error,
    placing,
    applying: false,
    discount,
    promoError,
    apply,
    submit,
    validating: false,
    retryValidation: () => {},
    pendingAttempt: null,
    confirmOrder: submit,
  };
}
