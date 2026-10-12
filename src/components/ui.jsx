import { useEffect, useRef, useId, Component } from "react";
import { Link } from "react-router-dom";
import { money } from "../domain/commerce";
export function Icon({ name = "grid", ...props }) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    cart: <path d="M2 3h3l3 13h10l3-9H6M9 21h.1M18 21h.1" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    chip: (
      <>
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    mail: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    lock: (
      <>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
      </>
    ),
    login: (
      <>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </>
    ),
    userPlus: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </>
    ),
    bag: (
      <>
        <rect x="4" y="7" width="16" height="15" rx="2" />
        <path d="M8 8V5a4 4 0 0 1 8 0v3" />
      </>
    ),
    spark: <path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" />,
    pin: (
      <>
        <path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 0 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    copy: (
      <>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </>
    ),
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
      </>
    ),
    plus: (
      <>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  };
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
export function Logo() {
  return (
    <Link to="/cua-hang" className="logo" aria-label="TechZone Pro - Cửa hàng">
      <span>
        <Icon name="chip" />
      </span>
      <div>
        TECH<span className="red">ZONE</span>
        <sup>PRO</sup>
        <small>PC & LINH KIỆN</small>
      </div>
    </Link>
  );
}
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
export function Badge({ tone = "neutral", children }) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Notice({ tone = "info", children }) {
  return (
    <div
      className={"notice " + tone}
      role={tone === "danger" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={"panel pad " + className}>
      {title && (
        <div className="between panel-title">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Heading({ title, sub, action, eyebrow = "TECHZONE PRO" }) {
  return (
    <div className="page-head between">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
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
export function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} className="input" {...props}>
          {options.map((o) => (
            <option value={o.value ?? o} key={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
export function Art({ type = "ram", className = "", image, name }) {
  return image ? (
    <img
      className={"product-image " + className}
      src={image}
      alt={name || "Ảnh sản phẩm"}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = "/assets/hero-pc.png";
        e.currentTarget.onerror = null;
      }}
    />
  ) : (
    <div
      className={"art art-" + type + " " + className}
      role="img"
      aria-label={"Ảnh minh họa " + (name || type)}
    />
  );
}
export function Quantity({ value, onChange, max = 99, label = "Số lượng" }) {
  return (
    <div className="qty">
      <button
        type="button"
        aria-label={"Giảm " + label}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <input
        aria-label={label}
        type="number"
        min="1"
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isInteger(n) && n >= 1 && n <= max) onChange(n);
        }}
      />
      <button
        type="button"
        aria-label={"Tăng " + label}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
export function KV({ label, children, total = false }) {
  return (
    <div className={"kv " + (total ? "total" : "")}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}
export function Steps({ labels, current = 0 }) {
  return (
    <ol className="steps">
      {labels.map((l, i) => (
        <li
          className={
            "step " + (i < current ? "done" : i === current ? "current" : "")
          }
          key={l}
          aria-current={i === current ? "step" : undefined}
        >
          <span>{i < current ? "✓" : i + 1}</span>
          <b>{l}</b>
        </li>
      ))}
    </ol>
  );
}
export function Empty({ title = "Chưa có dữ liệu", description, action }) {
  return (
    <div className="panel empty-state">
      <Icon name="bag" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
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
export function ProductCard({ product: p }) {
  return (
    <article className="product-card">
      <Link to={"/san-pham/" + p.id}>
        <Art type={p.category} image={p.image} name={p.name} />
        <div className="category">{p.brand}</div>
        <h3>{p.name}</h3>
      </Link>
      <p className="variant">{p.variant}</p>
      <div className="chips">
        {Object.values(p.specs)
          .slice(0, 3)
          .map((s, i) => (
            <span className="chip" key={i}>
              {s}
            </span>
          ))}
      </div>
      <p className="stock">
        {p.stock > 0 ? "● Còn hàng" : "Hết hàng"} · Bảo hành {p.warranty} tháng
      </p>
      <div className="buy">
        <div>
          <span className="old-price">{money(p.originalPrice)}</span>
          <div className="price">{money(p.price)}</div>
        </div>
        <Link to={"/san-pham/" + p.id}>Chọn phiên bản</Link>
      </div>
    </article>
  );
}
export class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <main className="wrap main">
          <Empty
            title="Trang chưa tải được"
            description="Dữ liệu đã lưu vẫn còn trên thiết bị. Hãy tải lại để thử tiếp."
            action={
              <Button onClick={() => window.location.reload()}>Tải lại</Button>
            }
          />
        </main>
      );
    return this.props.children;
  }
}

export function Skeleton({ className = "", width, height, radius = "6px", style = {} }) {
  return (
    <div
      className={"skeleton-pulse " + className}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

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
