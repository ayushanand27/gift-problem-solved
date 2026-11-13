'use client';

import { useState } from 'react';

// Copies a short piece of text, e.g. the UPI ID, so a guest can paste it into any UPI app.
export default function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* clipboard blocked: the ID is still shown on screen */
        }
      }}
    >
      {done ? 'Copied' : label}
    </button>
  );
}
