export const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n || 0,
  );
export const dateTime = (v) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));

export const formatShortOrderCode = (code) => {
  if (!code) return "";
  if (code.startsWith("TZ-") && code.length > 20) {
    const raw = code.slice(3);
    return `TZ-…${raw.slice(-6)}`;
  }
  return code;
};

export const formatOrderSuffix = (code) => {
  if (!code) return "";
  if (code.length > 8) {
    return code.slice(-6);
  }
  return code;
};
