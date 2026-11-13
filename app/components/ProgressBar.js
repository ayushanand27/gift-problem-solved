import { inr } from '@/lib/validate';

export default function ProgressBar({ raised, target }) {
  const percent = Math.min(100, Math.round((raised / target) * 100));
  return (
    <div className="progress">
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="progress-text">
        <strong>{inr(raised)}</strong> of {inr(target)} <span>· {percent}%</span>
      </p>
    </div>
  );
}
