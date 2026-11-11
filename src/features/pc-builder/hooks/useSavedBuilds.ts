import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { isAbortError, pcBuilderApi } from "../api/pcBuilderApi";
import type { SavedBuild } from "../types/pcBuilder.types";

/** Danh sách bộ PC đã lưu của tài khoản đang đăng nhập; `builds` là null khi chưa tải xong. */
export function useSavedBuilds() {
  const { demoMode } = useStore();
  const [builds, setBuilds] = useState<SavedBuild[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (demoMode) return;
    const controller = new AbortController();
    pcBuilderApi
      .listSaved({ signal: controller.signal })
      .then((list) => {
        setBuilds(list);
        setError(null);
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        console.warn("[PC Builder] Không tải được cấu hình đã lưu:", err);
        setError(err instanceof Error && err.message ? err.message : "Máy chủ không phản hồi, vui lòng thử lại sau.");
      });
    return () => controller.abort();
  }, [demoMode, attempt]);

  return {
    demoMode,
    builds,
    error,
    isLoading: !demoMode && builds === null && !error,
    reload: () => {
      setError(null);
      setAttempt((count) => count + 1);
    },
  };
}
