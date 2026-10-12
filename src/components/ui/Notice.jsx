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
