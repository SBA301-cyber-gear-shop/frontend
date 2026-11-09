import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      "TechZone Pro · " +
      (pathname === "/"
        ? "Hiệu năng mang dấu ấn của bạn"
        : decodeURIComponent(pathname.split("/")[1]).replaceAll("-", " "));
  }, [pathname, search]);
  return null;
}
