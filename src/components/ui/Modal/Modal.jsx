import { useEffect, useRef, useId } from "react";
import "./Modal.scss";

export function Modal({ title, children, onClose }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="between">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default Modal;
