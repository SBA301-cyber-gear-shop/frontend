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
  disabled = false,
}) {
  return (
    <div className="panel">
      {lines.map((l) => {
        const p = products.find((p) => p.id === l.id);
        return (
          <div className="cart-line" key={l.id}>
            <Art
              type={p?.category}
              image={l.image || p?.image}
              name={l.name || p?.name}
              className="small-art"
            />
            <div>
              <Link to={"/san-pham/" + l.id}>
                <h3>{l.name || p?.name || "Không tìm thấy sản phẩm"}</h3>
              </Link>
              <p>{l.variant || p?.variant}</p>
              {l.available === false && (
                <p className="red">
                  Sản phẩm đã ngừng bán. Vui lòng xóa khỏi giỏ.
                </p>
              )}
              <p>
                Đơn giá <b>{money(l.unitPrice ?? p?.price)}</b>
              </p>
            </div>
            {editable ? (
              <fieldset
                disabled={disabled || l.available === false}
                style={{ border: 0, padding: 0, margin: 0 }}
              >
                <Quantity
                  label={"Số lượng " + (l.name || p?.name || "sản phẩm")}
                  value={l.quantity}
                  max={Math.max(1, l.stock ?? p?.stock ?? 0)}
                  onChange={(q) => onChange(l.id, q)}
                />
              </fieldset>
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
                  disabled={disabled}
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
