import { Link } from "react-router-dom";
import "./Button.scss";

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

export default Button;
