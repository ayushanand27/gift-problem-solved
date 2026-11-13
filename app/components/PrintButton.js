'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button type="button" className="btn" onClick={() => window.print()}>
      <Printer size={14} strokeWidth={1.25} /> Print or save as PDF
    </button>
  );
}
