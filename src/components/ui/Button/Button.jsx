import { Link } from "react-router-dom";

/** @param {{ to?: string, tone?: string, children?: any, className?: string, [key: string]: any }} props */
export function Button({
  to,
  children,
  tone = "primary",
  className = "",
  ...props
}) {
  return to ? (
    <Link to={to} className={"btn btn-" + tone + " " + className} {...props}>
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={"btn btn-" + tone + " " + className}
      {...props}
    >
      {children}
    </button>
  );
}
