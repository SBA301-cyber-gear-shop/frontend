import { useEffect, useRef, useState } from "react";
import { readState, writeState } from "./demo/persistence";
import { StoreContext } from "./context";
export default function StoreProvider({ children }) {
  const [data, setData] = useState(readState),
    [user, setUser] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("techzone-session"));
      } catch {
        return null;
      }
    }),
    [toast, setToast] = useState(null);
  const current = useRef(data),
    timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function notify(message, tone = "success") {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4500);
  }
  function commit(update) {
    const next =
      typeof update === "function" ? update(current.current) : update;
    try {
      writeState(next);
    } catch {
      throw new Error(
        "Không thể lưu dữ liệu trên trình duyệt. Kiểm tra dung lượng hoặc quyền lưu trữ.",
      );
    }
    current.current = next;
    setData(next);
    return next;
  }
  function signIn(profile) {
    const { password, demoPasswordHash, ...safe } = profile;
    void password;
    void demoPasswordHash;
    sessionStorage.setItem("techzone-session", JSON.stringify(safe));
    setUser(safe);
  }
  function signOut() {
    sessionStorage.removeItem("techzone-session");
    sessionStorage.removeItem("techzone-token");
    setUser(null);
  }
  return (
    <StoreContext.Provider
      value={{ data, user, commit, notify, signIn, signOut }}
    >
      {children}
      {toast && (
        <div
          className={"toast " + toast.tone}
          role={toast.tone === "danger" ? "alert" : "status"}
        >
          <span>{toast.tone === "danger" ? "!" : "✓"}</span>
          {toast.message}
          <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}
