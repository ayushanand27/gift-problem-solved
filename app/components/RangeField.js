'use client';

import { useState } from 'react';

// A slider that shows the chosen rupee amount next to its label.
export default function RangeField({ name, label, min, max, step, defaultValue }) {
  const [value, setValue] = useState(defaultValue);
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
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );
}
