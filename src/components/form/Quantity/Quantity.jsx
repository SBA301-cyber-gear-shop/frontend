import "./Quantity.scss";

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

export default Quantity;
