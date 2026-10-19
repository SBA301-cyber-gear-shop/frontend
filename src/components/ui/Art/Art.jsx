import "./Art.scss";

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

export default Art;
