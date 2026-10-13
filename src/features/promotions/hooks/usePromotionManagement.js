import { useState } from "react";
import { useStore } from "@/store";

export function usePromotionManagement() {
  const { data, commit, notify } = useStore(),
    [p, setP] = useState({ ...data.promotions[0] });
  const set = (k, v) => setP((f) => ({ ...f, [k]: v })),
    used = data.usages.filter(
      (u) => u.code === p.code && u.status === "USED",
    ).length,
    reserved = data.usages.filter(
      (u) => u.code === p.code && u.status === "RESERVED",
    ).length;
  function save(e) {
    e.preventDefault();
    try {
      if (
        !p.code.trim() ||
        !p.name.trim() ||
        Number(p.value) <= 0 ||
        !Number.isInteger(Number(p.limit)) ||
        Number(p.limit) < used + reserved ||
        Number(p.limit) < 1
      )
        throw new Error("Kiểm tra mã, tên, mức giảm và hạn mức.");
      if (p.type === "percentage" && Number(p.value) > 100)
        throw new Error("Phần trăm giảm phải từ 0 đến 100.");
      if (!p.start || !p.end || new Date(p.start) >= new Date(p.end))
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
      if (!p.bannerLink.startsWith("/") || p.bannerLink.startsWith("//"))
        throw new Error("Dùng đường dẫn nội bộ, ví dụ /san-pham.");
      const saved = {
        ...p,
        code: p.code.trim().toUpperCase(),
        value: Number(p.value),
        limit: Number(p.limit),
        bannerOrder: Number(p.bannerOrder) || 0,
      };
      commit((d) => {
        const old = d.promotions.find((x) => x.id === p.id);
        if (
          old.code !== saved.code &&
          d.usages.some((u) => u.code === old.code)
        )
          throw new Error("Mã đã có lượt sử dụng không được đổi.");
        return {
          ...d,
          promotions: d.promotions.map((x) => (x.id === p.id ? saved : x)),
        };
      });
      notify("Đã lưu khuyến mãi và banner.");
    } catch (err) {
      notify(err.message, "danger");
    }
  }
  return { p, set, used, reserved, save };
}
