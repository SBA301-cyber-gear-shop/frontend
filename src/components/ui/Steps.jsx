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
