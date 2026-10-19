import "./KV.scss";

export function KV({ label, children, total = false }) {
  return (
    <div className={"kv " + (total ? "total" : "")}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export default KV;
