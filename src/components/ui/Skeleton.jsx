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
