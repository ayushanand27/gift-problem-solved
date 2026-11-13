'use client';

import { useState } from 'react';
import RangeField from './RangeField';

// The smallest gift can never go above the largest: moving one slider past the other drags the other along.
export default function GiftRange({ defaultMin = 501, defaultMax = 51000 }) {
  const [min, setMin] = useState(defaultMin);
  const [max, setMax] = useState(defaultMax);

  const changeMin = (value) => {
    setMin(value);
    if (value > max) setMax(Math.min(100000, Math.ceil(value / 1000) * 1000));
  };
  const changeMax = (value) => {
    setMax(value);
    if (value < min) setMin(Math.max(1, Math.floor((value - 1) / 100) * 100 + 1)); // the smallest-gift slider steps are 1, 101, 201, ...
  };

  return (
    <>
      <RangeField name="min_amount" label="Smallest gift" min={1} max={5001} step={100} value={min} onChange={changeMin} />
      <RangeField name="max_amount" label="Largest gift" min={1000} max={100000} step={1000} value={max} onChange={changeMax} />
      <p className="hint">The largest gift is never below the smallest. UPI allows up to ₹1,00,000 in one payment.</p>
    </>
  );
}
