import { useId } from "react";

export function Field({ label, hint, error, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? (
        children(id)
      ) : (
        <input
          id={id}
          className="input"
          aria-invalid={!!error}
          aria-describedby={error ? id + "-error" : undefined}
          {...props}
        />
      )}{" "}
      {hint && <small>{hint}</small>}
      {error && (
        <small className="error-text" id={id + "-error"}>
          {error}
        </small>
      )}
    </div>
  );
}
