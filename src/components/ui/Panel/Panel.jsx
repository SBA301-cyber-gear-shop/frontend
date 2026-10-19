import "./Panel.scss";

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

export default Panel;
