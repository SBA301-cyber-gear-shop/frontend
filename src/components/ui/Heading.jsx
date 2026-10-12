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
