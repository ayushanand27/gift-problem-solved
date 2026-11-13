import { LEGAL_UPDATED } from '@/lib/site';

export default function LegalPage({ eyebrow, title, children }) {
  return (
    <div className="medium legal">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="hint">Last updated {LEGAL_UPDATED}</p>
      {children}
    </div>
  );
}
