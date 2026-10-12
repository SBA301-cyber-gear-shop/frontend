import { useEffect, useState } from "react";

/**
 * Hook trì hoãn cập nhật giá trị (Debounce).
 * Thường dùng cho ô tìm kiếm sản phẩm để tránh gọi API hoặc tính toán quá nhiều lần.
 *
 * @param value Giá trị cần debounce (string, number, object...)
 * @param delay Thời gian chờ (mặc định 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
