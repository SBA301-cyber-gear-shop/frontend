import { useEffect, useState } from "react";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim();
const time = (value) =>
  value
    ? new Date(
        value + (/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? "" : "+07:00"),
      ).getTime()
    : 0;
export const listStatusLabels = {
  active: "Đang áp dụng",
  disabled: "Đã tắt",
  upcoming: "Sắp diễn ra",
  expired: "Đã hết hạn",
  exhausted: "Hết lượt",
};
export const listStatusTones = {
  active: "success",
  disabled: "neutral",
  upcoming: "upcoming",
  expired: "neutral",
  exhausted: "neutral",
};

export function promotionListStatus(item, kind, now) {
  if (!(kind === "voucher" ? item.active : item.enabled)) return "disabled";
  if (now < time(item.start)) return "upcoming";
  if (kind === "sale" ? now >= time(item.end) : now > time(item.end))
    return "expired";
  if (
    kind === "voucher" &&
    (item.used || 0) + (item.reserved || 0) >= item.limit
  )
    return "exhausted";
  return "active";
}

const defaults = (kind) => ({
  search: "",
  segment: "all",
  status: "all",
  type: "all",
  remaining: "all",
  variantCount: "all",
  sort: kind === "voucher" ? "newest" : "start_desc",
});

export function usePromotionListFilters(items, kind) {
  const [filters, setFilters] = useState(() => defaults(kind));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const counts = { all: items.length, active: 0, disabled: 0 };
  for (const item of items) {
    const status = promotionListStatus(item, kind, now);
    if (status in counts) counts[status]++;
  }
  const query = normalize(filters.search);
  const selectedStatus =
    filters.segment !== "all" ? filters.segment : filters.status;
  const filtered = items
    .filter((item) => {
      if (
        selectedStatus !== "all" &&
        promotionListStatus(item, kind, now) !== selectedStatus
      )
        return false;
      const text =
        kind === "voucher"
          ? [item.id, item.code, item.name]
          : [
              item.productId,
              `#${item.productId}`,
              item.productName,
              ...(item.variants || []).flatMap((variant) => [
                variant.id,
                variant.name,
              ]),
            ];
      if (query && !normalize(text.join(" ")).includes(query)) return false;
      if (kind === "voucher") {
        if (filters.type !== "all" && item.type !== filters.type) return false;
        const remaining = Math.max(
          0,
          item.limit - (item.used || 0) - (item.reserved || 0),
        );
        if (filters.remaining === "available" && remaining <= 0) return false;
        if (filters.remaining === "empty" && remaining > 0) return false;
      } else {
        const type = item.discountType || "percentage";
        if (filters.type !== "all" && type !== filters.type) return false;
        const count = item.variants?.length || 0;
        if (filters.variantCount === "single" && count !== 1) return false;
        if (filters.variantCount === "multiple" && count < 2) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "end_asc") return time(a.end) - time(b.end);
      if (filters.sort === "start_desc") return time(b.start) - time(a.start);
      if (filters.sort === "discount_desc")
        return (
          String(a.discountType || "percentage").localeCompare(
            String(b.discountType || "percentage"),
          ) ||
          Number(b.discountValue ?? b.percentage) -
            Number(a.discountValue ?? a.percentage)
        );
      if (filters.sort === "usage_desc")
        return (
          (b.used || 0) + (b.reserved || 0) - (a.used || 0) - (a.reserved || 0)
        );
      if (filters.sort === "name_asc")
        return String(
          kind === "voucher" ? a.code : a.productName,
        ).localeCompare(
          String(kind === "voucher" ? b.code : b.productName),
          "vi",
          { numeric: true },
        );
      return String(b.id).localeCompare(String(a.id), "vi", { numeric: true });
    });
  return {
    now,
    filters,
    counts,
    filtered,
    hasFilters: Object.entries(defaults(kind)).some(
      ([key, value]) => filters[key] !== value,
    ),
    setFilter: (name, value) =>
      setFilters((current) => ({
        ...current,
        [name]: value,
        ...(name === "segment"
          ? { status: "all" }
          : name === "status"
            ? { segment: "all" }
            : {}),
      })),
    resetFilters: () => setFilters(defaults(kind)),
  };
}
