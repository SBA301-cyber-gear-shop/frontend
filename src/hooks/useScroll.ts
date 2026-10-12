import { useEffect, useState } from "react";

/**
 * Hook theo dõi trạng thái cuộn trang của người dùng.
 * Phục vụ cho Sticky Header, nút cuộn lên đầu trang (Back to top), hiệu ứng xuất hiện khi scroll.
 *
 * @param threshold Ngưỡng pixel để coi là trang đã cuộn (mặc định 50px)
 */
export function useScroll(threshold = 50) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > threshold);
    }

    // Khởi tạo trạng thái ban đầu
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  const scrollToTop = (smooth = true) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return {
    scrollY,
    isScrolled,
    scrollToTop,
  };
}
