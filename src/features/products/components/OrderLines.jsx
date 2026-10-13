import { Link } from "react-router-dom";
import { money } from "@/utils";
import { Art } from "@/components/ui";
import { Quantity } from "@/components/form";

export function OrderLines({
  lines,
  products,
  editable = false,
  onChange,
  onRemove,
}) {
  return (
    <div className="panel">
      {lines.map((l) => {
        const p = products.find((p) => p.id === l.id);
        return (
          <div className="cart-line" key={l.id}>
            <Art type={p?.category} className="small-art" />
            <div>
              <Link to={"/san-pham/" + l.id}>
                <h3>{l.name || p?.name || "Không tìm thấy sản phẩm"}</h3>
              </Link>
              <p>{l.variant || p?.variant}</p>
              <p>
                Đơn giá <b>{money(l.unitPrice ?? p?.price)}</b>
              </p>
            </div>
            {editable ? (
              <Quantity
                label={"Số lượng " + p?.name}
                value={l.quantity}
                max={Math.max(l.quantity, p?.stock || 0)}
                onChange={(q) => onChange(l.id, q)}
              />
            ) : (
              <span>SL: {l.quantity}</span>
            )}
            <div>
              <div className="price">
                {money(l.quantity * (l.unitPrice ?? p?.price ?? 0))}
              </div>
              {editable && (
                <button
                  className="remove text-button"
                  onClick={() => onRemove(l.id)}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
