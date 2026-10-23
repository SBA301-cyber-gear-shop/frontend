import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { checkoutApi } from "../api/checkoutApi";
import { ordersApi } from "../api/ordersApi";

export function useLiveCheckout() {
  const { data, user, cartLoading, cartError, cartBusy, reloadCart, notify } =
    useStore();
  const navigate = useNavigate();
  const [checkoutKey] = useState(() => {
    const storageKey = "techzone-checkout-key-" + user.id;
    let key = sessionStorage.getItem(storageKey);
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem(storageKey, key);
    }
    return key;
  });
  const attemptStorageKey = "techzone-checkout-attempt-" + user.id;
  const [pendingAttempt, setPendingAttempt] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(attemptStorageKey));
      return saved?.key === checkoutKey && saved.payload ? saved : null;
    } catch {
      return null;
    }
  });
  const [params] = useSearchParams();
  const fromBuild = params.get("source") === "build";
  const [name, updateName] = useState(user?.name || "");
  const [phone, updatePhone] = useState(user?.phone || "");
  const [note, updateNote] = useState("");
  const [inputCode, updateInputCode] = useState("");
  const [applied, updateApplied] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const request = useRef(0),
    busy = useRef(false),
    controller = useRef(null);

  useEffect(() => {
    if (fromBuild || pendingAttempt) return;
    const abort = new AbortController();
    checkoutApi
      .validate(abort.signal)
      .then((cart) => {
        if (!abort.signal.aborted)
          setValidation({ source: data.cart, attempt, cart });
      })
      .catch((failure) => {
        if (!abort.signal.aborted)
          setValidation({ source: data.cart, attempt, error: failure.message });
      });
    return () => abort.abort();
  }, [data.cart, attempt, fromBuild, pendingAttempt]);

  useEffect(() => () => controller.current?.abort(), []);

  const validationCurrent =
    validation?.source === data.cart && validation?.attempt === attempt;
  const validating = !fromBuild && !validationCurrent;
  const validationError = validationCurrent ? validation.error || "" : "";
  const quote = preview?.source === data.cart ? preview.value : null;
  const cart = quote || (validationCurrent ? validation.cart : null);
  const lines = cart
    ? cart.items.map((item) => ({
        id: String(item.productVariantId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        name: item.productName,
        variant: item.variantName,
        image: item.imageUrl,
        stock: item.stockQuantity,
      }))
    : data.cart;

  function edit(setter, value) {
    ++request.current;
    controller.current?.abort();
    setPreview(null);
    setError("");
    setter(value);
  }

  async function previewDetails(code) {
    if (busy.current || validating || validationError || fromBuild) return;
    busy.current = true;
    const revision = ++request.current;
    const source = data.cart;
    const abort = new AbortController();
    controller.current = abort;
    setPlacing(true);
    setError("");
    setPreview(null);
    try {
      const result = await checkoutApi.preview(
        {
          pickupName: name,
          pickupPhone: phone,
          note,
          promotionCode: code.trim(),
        },
        abort.signal,
      );
      if (revision !== request.current || abort.signal.aborted) return;
      setPreview({ source, value: result });
      updateApplied(result.promotionCode || "");
    } catch (failure) {
      if (revision === request.current && !abort.signal.aborted) {
        setError(failure.message);
        updateApplied("");
      }
    } finally {
      busy.current = false;
      setPlacing(false);
    }
  }

  function retryValidation() {
    ++request.current;
    controller.current?.abort();
    setPreview(null);
    setError("");
    setAttempt((value) => value + 1);
  }

  async function confirmOrder() {
    if (
      busy.current ||
      (!pendingAttempt && (!quote || validating || validationError))
    )
      return;
    const submission = pendingAttempt || {
      key: checkoutKey,
      payload: {
        pickupName: name,
        pickupPhone: phone,
        note,
        promotionCode: quote.promotionCode || "",
        method: "store",
        expectedTotal: quote.totalAmount,
        expectedDiscount: quote.discountAmount,
      },
    };
    busy.current = true;
    setPlacing(true);
    setError("");
    try {
      // Keep the exact request across reloads until its result is known.
      sessionStorage.setItem(attemptStorageKey, JSON.stringify(submission));
      const order = await ordersApi.place(submission.payload, submission.key);
      sessionStorage.removeItem(attemptStorageKey);
      sessionStorage.removeItem("techzone-checkout-key-" + user.id);
      notify("Đã tạo đơn hàng. Vui lòng chờ cửa hàng xác nhận sẵn sàng nhận.");
      navigate("/don-hang/" + order.id + "?created=1");
      void reloadCart();
    } catch (failure) {
      const rejected =
        failure.response?.status >= 400 && failure.response?.status < 500;
      if (rejected) {
        sessionStorage.removeItem(attemptStorageKey);
        setPendingAttempt(null);
        setPreview(null);
      } else {
        setPendingAttempt(submission);
      }
      setError(
        rejected
          ? failure.message
          : "Chưa xác định được kết quả đặt hàng. Bạn có thể xem mục Đơn hàng hoặc thử xác nhận lại để kiểm tra cùng yêu cầu.",
      );
    } finally {
      busy.current = false;
      setPlacing(false);
    }
  }

  return {
    data,
    user,
    demoMode: false,
    pendingAttempt,
    fromBuild,
    lines,
    total:
      cart?.totalAmount ??
      lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    name,
    setName: (value) => edit(updateName, value),
    phone,
    setPhone: (value) => edit(updatePhone, value),
    note,
    setNote: (value) => edit(updateNote, value),
    inputCode,
    setInputCode: (value) => {
      edit(updateInputCode, value);
      updateApplied("");
    },
    applied,
    setApplied: (value) => {
      edit(updateApplied, value);
      if (!value) updateInputCode("");
    },
    method: "store",
    setMethod: () => {},
    error: error || validationError || cartError,
    placing,
    validating: !pendingAttempt && (validating || cartLoading || cartBusy),
    retryValidation,
    discount: quote?.discountAmount || 0,
    previewed: Boolean(quote),
    confirmOrder,
    promoError: "",
    apply: () => previewDetails(inputCode),
    submit: (event) => {
      event.preventDefault();
      void previewDetails(applied || inputCode);
    },
  };
}
