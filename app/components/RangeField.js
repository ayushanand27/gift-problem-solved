'use client';

// A slider that shows the chosen rupee amount next to its label. The parent owns the value.
export default function RangeField({ name, label, min, max, step, value, onChange }) {
  return (
    <label className="field">
      <span>
        {label} <strong className="range-value">₹{Number(value).toLocaleString('en-IN')}</strong>
      </span>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
