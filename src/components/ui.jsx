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
