import { useState } from "react";
import { useStore } from "@/store";
import { createWarrantyApi } from "../api/warrantyApi";

export function useAftersales() {
  const { signOut, notify } = useStore();
  // Tạo một lần cho cả vòng đời màn hình, để effect tải dữ liệu không chạy lại mỗi lần vẽ.
  const [api] = useState(() =>
    createWarrantyApi((message) => {
      // Đăng xuất làm PrivateRoute chuyển về trang đăng nhập.
      signOut();
      notify(message, "danger");
    }),
  );
  return api;
}
