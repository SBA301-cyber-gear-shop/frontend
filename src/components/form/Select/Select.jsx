import { Field } from "../Field";

export function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      {(id) => (
        <select id={id} className="input" {...props}>
          {options.map((o) => (
            <option value={o.value ?? o} key={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
