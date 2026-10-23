import { useEffect, useRef, useId } from "react";

export function Modal({ title, children, onClose, className = "" }) {
  const ref = useRef(null);
  const id = useId();
  const mouseDownTargetRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={"modal " + className}
      aria-labelledby={id}
      onCancel={onClose}
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        // Only close if BOTH mousedown and click originated on the dialog backdrop
        if (
          e.target === e.currentTarget &&
          mouseDownTargetRef.current === e.currentTarget
        ) {
          onClose();
        }
        mouseDownTargetRef.current = null;
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
