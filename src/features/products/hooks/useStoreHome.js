import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { useVisiblePromotions } from "@/features/promotions";

export function useStoreHome() {
  const { data, demoMode } = useStore(),
    [slide, setSlide] = useState(0),
    [playing, setPlaying] = useState(false),
    [hover, setHover] = useState(false);
  useEffect(() => {
    if (
      !playing ||
      hover ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => setSlide((s) => (s + 1) % 3), 5500);
    return () => clearInterval(id);
  }, [playing, hover]);
  const slides = [
    [
      "Chiếc PC tiếp theo.",
      "Đúng với nhu cầu bạn.",
      "Khám phá linh kiện, chọn từng phiên bản và xây dựng cấu hình theo ngân sách. Đặt online, nhận trực tiếp tại cửa hàng.",
      "/build-pc",
      "Tư vấn cấu hình",
    ],
    [
      "Mở rộng góc nhìn.",
      "Nâng tầm trải nghiệm.",
      "Khám phá màn hình theo độ phân giải, tấm nền và tần số quét.",
      "/danh-muc/monitor",
      "Khám phá màn hình",
    ],
    [
      "Hiệu năng linh hoạt.",
      "Đồng hành mỗi ngày.",
      "Laptop cho học tập, làm việc và sáng tạo. Chọn đúng cấu hình cho nhu cầu của bạn.",
      "/danh-muc/laptop",
      "Khám phá laptop",
    ],
  ];
  const remote = useVisiblePromotions();
  const s = slides[slide],
    promos = (demoMode ? data.promotions : remote.promotions)
      .filter(
        (p) =>
          p.active &&
          p.bannerActive &&
          new Date() >= new Date(p.start) &&
          new Date() <= new Date(p.end),
      )
      .sort((a, b) => a.bannerOrder - b.bannerOrder);

  const featuredProducts = demoMode
    ? ["ram16", "cpu1", "gpu1", "monitor0"]
        .map((id) => data.products.find((p) => p.id === id))
        .filter((p) => p?.status === "active")
    : (() => {
        const active = data.products.filter(
          (p) => p?.status?.toLowerCase() === "active",
        );
        const chosen = [];
        const seenCats = new Set();
        for (const p of active) {
          if (!seenCats.has(p.category)) {
            seenCats.add(p.category);
            chosen.push(p);
            if (chosen.length === 4) break;
          }
        }
        if (chosen.length < 4) {
          for (const p of active) {
            if (!chosen.some((c) => c.id === p.id)) {
              chosen.push(p);
              if (chosen.length === 4) break;
            }
          }
        }
        return chosen;
      })();

  return {
    data,
    demoMode,
    slide,
    setSlide,
    playing,
    setPlaying,
    setHover,
    slides,
    s,
    promos,
    promotionError: remote.error,
    featuredProducts,
  };
}
