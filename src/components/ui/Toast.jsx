import { useEffect } from "react";
import { Icon } from "./Icon";

export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={"tz-toast " + type} role="status" aria-live="polite">
      <span className="tz-toast-icon">
        {type === "success" && <Icon name="check" />}
        {type === "info" && <Icon name="spark" />}
        {type === "error" && <Icon name="shield" />}
      </span>
      <span className="tz-toast-msg">{message}</span>
      <button
        type="button"
        className="tz-toast-close"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
}
