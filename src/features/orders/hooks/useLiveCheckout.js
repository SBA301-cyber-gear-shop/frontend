import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { checkoutApi } from "../api/checkoutApi";
import { ordersApi } from "../api/ordersApi";
import { shippingApi } from "../api/shippingApi";

function estimateHardwareWeightGram(productName) {
  if (!productName) return 500;
  const lower = String(productName).toLowerCase();
  if (/(case|vỏ máy|thùng máy|vỏ case|montech|nzxt h|corsair 4000|corsair 5000|mik|xigmatek|sama)/.test(lower)) return 6200;
  if (/(màn hình|monitor|inch|oled|ultrasharp|odyssey|viewsonic|proart)/.test(lower)) return 5200;
  if (/(nguồn|psu|corsair rm|corsair cv|msi mag a|cooler master mwe|deepcool pk|deepcool pn|fsp|seasonic|super flower)/.test(lower)) return 2200;
  if (/(vga|card|rtx|gtx|radeon|rx |arc |geforce|quadro)/.test(lower)) return 1600;
  if (/(tản nhiệt|cooler|aio|liquid|thermalright|deepcool ak|deepcool le|deepcool lt|noctua|id-cooling)/.test(lower)) return 1400;
  if (/(mainboard|bo mạch|motherboard|b760|z790|b650|x670|x870|z890|h610|a520|b550|b450)/.test(lower)) return 1300;
  if (/(hdd|seagate|wd blue|bàn phím|keyboard|akko|keychron)/.test(lower)) return 850;
  if (/(cpu|vi xử lý|core i|core ultra|ryzen|epyc|threadripper|pentium|athlon)/.test(lower)) return 450;
  if (/(ram|ddr4|ddr5|ssd|nvme|m\.2|chuột|mouse|keo tản|cáp|fan)/.test(lower)) return 250;
  return 600;
}

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
  const location = useLocation();
  const fromBuild = params.get("source") === "build";

  const selectedVariantIds = useMemo(() => {
    if (fromBuild) return null;
    if (Array.isArray(location.state?.selectedVariantIds) && location.state.selectedVariantIds.length > 0) {
      return location.state.selectedVariantIds.map(Number);
    }
    try {
      const stored = sessionStorage.getItem("techzone_checkout_selected_ids");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(Number);
        }
      }
    } catch {}
    return null;
  }, [location.state, fromBuild]);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState("store");
  const [deliveryType, setDeliveryType] = useState("store"); // "store" | "shipping"
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [addressDetail, setAddressDetail] = useState(user?.address || "");
  const [shippingFee, setShippingFee] = useState(0);
  const [calculatingFee, setCalculatingFee] = useState(false);

  useEffect(() => {
    shippingApi.getProvinces().then(setProvinces).catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setDistrictId("");
      setWards([]);
      setWardCode("");
      return;
    }
    shippingApi.getDistricts(Number(provinceId)).then(setDistricts).catch(() => {});
    setDistrictId("");
    setWards([]);
    setWardCode("");
  }, [provinceId]);

  useEffect(() => {
    if (!districtId) {
      setWards([]);
      setWardCode("");
      return;
    }
    shippingApi.getWards(Number(districtId)).then(setWards).catch(() => {});
    setWardCode("");
  }, [districtId]);



  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    setError("");
    const curFinal = total - discount + (type === "shipping" ? shippingFee : 0);
    if (type === "shipping" && method === "store") {
      setMethod(curFinal > 20000000 ? "vnpay" : "cod");
    } else if (type === "store" && method === "cod") {
      setMethod("store");
    }
  };
  const [inputCode, setInputCode] = useState("");
  const [applied, setApplied] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [promoError, setPromoError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [validation, setValidation] = useState(null);
  const busy = useRef(false);

  useEffect(() => {
    if (fromBuild || pendingAttempt) return;
    const abort = new AbortController();
    checkoutApi
      .validate(selectedVariantIds || undefined, abort.signal)
      .then((cart) => {
        if (!abort.signal.aborted)
          setValidation({ source: data.cart, attempt, cart });
      })
      .catch((failure) => {
        if (!abort.signal.aborted)
          setValidation({ source: data.cart, attempt, error: failure.message });
      });
    return () => abort.abort();
  }, [data.cart, attempt, fromBuild, pendingAttempt, selectedVariantIds]);

  const validationCurrent =
    validation?.source === data.cart && validation?.attempt === attempt;
  const validating = !fromBuild && !validationCurrent;
  const validationError = validationCurrent ? validation.error || "" : "";
  const cart = validationCurrent ? validation.cart : null;
  const rawLines = cart
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

  const lines = useMemo(() => {
    if (!selectedVariantIds || selectedVariantIds.length === 0) {
      return rawLines;
    }
    const selectedSet = new Set(selectedVariantIds.map(Number));
    return rawLines.filter((l) => selectedSet.has(Number(l.id)));
  }, [rawLines, selectedVariantIds]);

  const total = useMemo(() => {
    if (cart && (!selectedVariantIds || cart.items.length === lines.length)) {
      return cart.totalAmount;
    }
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }, [cart, selectedVariantIds, lines]);

  const totalWeightGram = useMemo(() => {
    if (!lines || lines.length === 0) return 500;
    const itemsWeight = lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 1;
      return sum + estimateHardwareWeightGram(line.name) * qty;
    }, 0);
    return Math.min(Math.max(itemsWeight + 300, 300), 30000);
  }, [lines]);

  useEffect(() => {
    if (!districtId || !wardCode || deliveryType !== "shipping") {
      setShippingFee(0);
      return;
    }
    setCalculatingFee(true);
    shippingApi
      .calculateFee(Number(districtId), wardCode, totalWeightGram)
      .then((res) => {
        setShippingFee(res.totalFee || 22000);
      })
      .catch(() => {
        const extraKg = Math.max(0, Math.ceil((totalWeightGram - 1000) / 1000));
        setShippingFee(22000 + extraKg * 5000);
      })
      .finally(() => setCalculatingFee(false));
  }, [districtId, wardCode, deliveryType, totalWeightGram]);

  async function apply() {
    const code = inputCode.trim();
    if (!code) {
      setPromoError("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (applying || placing || validating) return;
    setApplying(true);
    setPromoError("");
    try {
      const result = await checkoutApi.preview({
        pickupName: name.trim() || user?.name || "Khách nhận",
        pickupPhone: phone.trim() || user?.phone || "0900000128",
        note: note.trim(),
        promotionCode: code,
        itemVariantIds: selectedVariantIds || undefined,
      });
      const resolvedCode = result.promotionCode || code.toUpperCase();
      setApplied(resolvedCode);
      setInputCode(resolvedCode);
      setDiscount(result.discountAmount ?? 0);
      setPromoError("");
      notify("Đã áp dụng mã giảm giá thành công.");
    } catch (failure) {
      setPromoError(failure.message || "Mã giảm giá không hợp lệ.");
      setApplied("");
      setDiscount(0);
    } finally {
      setApplying(false);
    }
  }

  function handleSetApplied(val) {
    setApplied(val);
    if (!val) {
      setDiscount(0);
      setInputCode("");
      setPromoError("");
      notify("Đã bỏ áp dụng mã giảm giá.");
    }
  }

  function handleSetInputCode(val) {
    setInputCode(val);
    if (promoError) setPromoError("");
  }

  function retryValidation() {
    setError("");
    setPromoError("");
    setAttempt((value) => value + 1);
    if (applied) {
      checkoutApi
        .preview({
          pickupName: name.trim() || user?.name || "Khách nhận",
          pickupPhone: phone.trim() || user?.phone || "0900000128",
          note: note.trim(),
          promotionCode: applied,
          itemVariantIds: selectedVariantIds || undefined,
        })
        .then((result) => {
          setDiscount(result.discountAmount ?? 0);
        })
        .catch(() => {
          setApplied("");
          setDiscount(0);
        });
    }
  }

  async function submit(event) {
    if (event?.preventDefault) event.preventDefault();
    if (
      busy.current ||
      placing ||
      validating ||
      validationError ||
      fromBuild ||
      !lines.length
    )
      return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập họ tên người nhận.");
      return;
    }
    if (trimmedName.length > 100) {
      setError("Họ tên người nhận không được vượt quá 100 ký tự.");
      return;
    }
    if (!trimmedPhone) {
      setError("Vui lòng nhập số điện thoại người nhận.");
      return;
    }
    const normalizedPhone = trimmedPhone.replaceAll(/[ .()-]/g, "");
    if (!/^(?:0\d{9}|\+84\d{9})$/.test(normalizedPhone)) {
      setError(
        "Số điện thoại nhận hàng không hợp lệ (10 chữ số bắt đầu bằng 0 hoặc +84).",
      );
      return;
    }

    let fullShippingAddress = "";
    if (deliveryType === "shipping") {
      const finalAmt = total - discount + shippingFee;
      if (method === "cod" && finalAmt > 20000000) {
        setError("Phương thức COD chỉ áp dụng cho đơn hàng tối đa 20.000.000đ. Quý khách vui lòng chọn Cổng thanh toán VNPAY.");
        return;
      }
      if (!provinceId || !districtId || !wardCode || !addressDetail.trim()) {
        setError("Vui lòng chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập số nhà/tên đường cụ thể.");
        return;
      }
      const provName = provinces.find((p) => p.id === Number(provinceId))?.name || "";
      const distName = districts.find((d) => d.id === Number(districtId))?.name || "";
      const wardName = wards.find((w) => w.code === wardCode)?.name || "";
      fullShippingAddress = `${addressDetail.trim()}, ${wardName}, ${distName}, ${provName}`;
    }

    const submission = pendingAttempt || {
      key: checkoutKey,
      payload: {
        pickupName: trimmedName,
        pickupPhone: trimmedPhone,
        note: note.trim(),
        promotionCode: applied || "",
        method: method,
        expectedTotal: total,
        expectedDiscount: discount,
        itemVariantIds: selectedVariantIds || undefined,
        deliveryType,
        shippingFee: deliveryType === "shipping" ? shippingFee : 0,
        shippingAddress: fullShippingAddress || undefined,
        toProvinceId: deliveryType === "shipping" && provinceId ? Number(provinceId) : undefined,
        toDistrictId: deliveryType === "shipping" && districtId ? Number(districtId) : undefined,
        toWardCode: deliveryType === "shipping" && wardCode ? wardCode : undefined,
      },
    };

    busy.current = true;
    setPlacing(true);
    setError("");
    try {
      sessionStorage.setItem(attemptStorageKey, JSON.stringify(submission));
      const order = await ordersApi.place(submission.payload, submission.key);
      sessionStorage.removeItem(attemptStorageKey);
      sessionStorage.removeItem("techzone-checkout-key-" + user.id);
      sessionStorage.removeItem("techzone_checkout_selected_ids");
      sessionStorage.removeItem("techzone_cart_selected_ids");

      if (order.paymentUrl) {
        notify("Đang chuyển hướng tới cổng thanh toán trực tuyến VNPAY…");
        window.location.href = order.paymentUrl;
        return;
      }

      notify("Đã tạo đơn hàng. Vui lòng chờ cửa hàng xác nhận sẵn sàng nhận.");
      navigate("/don-hang/" + order.id + "?created=1");
      void reloadCart();
    } catch (failure) {
      const rejected =
        failure.response?.status >= 400 && failure.response?.status < 500;
      if (rejected) {
        sessionStorage.removeItem(attemptStorageKey);
        setPendingAttempt(null);
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
    total,
    name,
    setName: (val) => {
      setName(val);
      setError("");
    },
    phone,
    setPhone: (val) => {
      setPhone(val);
      setError("");
    },
    note,
    setNote: (val) => {
      setNote(val);
      setError("");
    },
    inputCode,
    setInputCode: handleSetInputCode,
    applied,
    setApplied: handleSetApplied,
    method,
    setMethod,
    deliveryType,
    setDeliveryType: handleDeliveryTypeChange,
    provinces,
    districts,
    wards,
    provinceId,
    setProvinceId,
    districtId,
    setDistrictId,
    wardCode,
    setWardCode,
    addressDetail,
    setAddressDetail,
    shippingFee,
    calculatingFee,
    totalWeightGram,
    error: error || validationError || cartError,
    placing,
    applying,
    validating: !pendingAttempt && (validating || cartLoading || cartBusy),
    retryValidation,
    discount,
    promoError,
    apply,
    submit,
    confirmOrder: submit,
  };
}
