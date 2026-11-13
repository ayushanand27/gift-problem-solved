import { notFound } from 'next/navigation';
import { hasUnlocked } from '@/lib/auth';
import { goalsWithTotals, weddingBySlug } from '@/lib/data';
import { SLUG, inr, niceDate } from '@/lib/validate';
import { enterCode } from '@/app/actions';
import Notice from '@/app/components/Notice';
import ProgressBar from '@/app/components/ProgressBar';

export const metadata = { title: 'Wedding gift', robots: { index: false, follow: false } };

export default async function GuestPage({ params, searchParams }) {
  const { slug } = await params;
  const { e } = await searchParams;
  if (!SLUG.test(slug)) notFound();
  const wedding = await weddingBySlug(slug);
  if (!wedding) notFound();

  if (!(await hasUnlocked(slug))) {
    return (
      <div className="narrow card center">
        <p className="eyebrow">You are invited</p>
        <h1>Enter the code on the card</h1>
        <p className="hint">It is the 6-digit number printed next to the QR on the wedding card.</p>
        <Notice code={e} />
        <form action={enterCode} className="stack">
          <input type="hidden" name="slug" value={slug} />
          <input className="code-input" name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" aria-label="6-digit code" placeholder="000000" />
          <button className="btn primary">Open the page</button>
        </form>
      </div>
    );
  }

  const goals = await goalsWithTotals(wedding.id);

  return (
    <div className="medium">
      <header className="couple center">
        <p className="eyebrow">The wedding of</p>
        <h1>{wedding.partner_one} &amp; {wedding.partner_two}</h1>
        {wedding.wedding_date && <p className="hint">{niceDate(wedding.wedding_date)}</p>}
        <p className="lead">Instead of a boxed gift, help us with something we are really saving for.</p>
      </header>
      <Notice code={e} />

      <form action={`/w/${slug}/pay`} method="get" className="stack">
        <fieldset className="plain">
          <legend>1. Choose what to gift towards</legend>
          <div className="grid">
            {goals.map((goal, i) => (
              <label className="card goal pick" key={goal.id}>
                <input type="radio" name="goal_id" value={goal.id} required defaultChecked={i === 0} />
                <h3>{goal.title}</h3>
                <ProgressBar raised={goal.raised} target={goal.target_amount} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>2. Your gift</legend>
          <label className="field">
            <span>Amount in ₹ ({inr(wedding.min_amount)} to {inr(wedding.max_amount)})</span>
            <input type="number" name="amount" required min={wedding.min_amount} max={wedding.max_amount} step={1} inputMode="numeric" />
          </label>
          <label className="field">
            <span>Your name, as it should appear on the certificate</span>
            <input name="guest_name" required maxLength={60} placeholder="Sharma family" />
          </label>
          <label className="field">
            <span>A message for the couple (optional)</span>
            <textarea name="message" maxLength={200} rows={2} />
          </label>
          <button className="btn primary">Continue to pay</button>
        </fieldset>
      </form>
    </div>
  );
}
