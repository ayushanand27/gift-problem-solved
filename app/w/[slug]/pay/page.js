import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { hasUnlocked } from '@/lib/auth';
import { weddingBySlug } from '@/lib/data';
import { query } from '@/lib/db';
import { qrDataUrl, upiLink } from '@/lib/upi';
import { SLUG, UUID, cleanText, inr, parseRupees } from '@/lib/validate';
import { submitGift } from '@/app/actions';
import Notice from '@/app/components/Notice';
import CopyButton from '@/app/components/CopyButton';

export const metadata = { title: 'Pay your gift', robots: { index: false, follow: false } };

export default async function PayPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!SLUG.test(slug)) notFound();
  const wedding = await weddingBySlug(slug);
  if (!wedding) notFound();
  if (!(await hasUnlocked(slug, wedding.card_code))) redirect(`/w/${slug}`);

  const goalId = String(sp.goal_id ?? '');
  const amount = parseRupees(sp.amount);
  const guestName = cleanText(sp.guest_name, 60);
  const message = cleanText(sp.message, 200);

  if (!UUID.test(goalId)) redirect(`/w/${slug}?e=goal`);
  if (!amount || amount < wedding.min_amount || amount > wedding.max_amount) redirect(`/w/${slug}?e=amount`);
  if (!guestName) redirect(`/w/${slug}?e=guest`);

  const { rows } = await query('select id, title from goals where id = $1 and wedding_id = $2', [goalId, wedding.id]);
  const goal = rows[0];
  if (!goal) redirect(`/w/${slug}?e=goal`);

  const note = `Wedding gift ${goal.title}`.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50);
  const link = upiLink({ upiId: wedding.upi_id, payeeName: wedding.payee_name, amount, note });
  const qr = await qrDataUrl(link, 480);

  return (
    <div className="narrow">
      <p className="no-print"><Link href={`/w/${slug}`}>← Change gift</Link></p>
      <div className="card center">
        <p className="eyebrow">Step 1 · Pay by UPI</p>
        <h1>{inr(amount)}</h1>
        <p>towards <strong>{goal.title}</strong></p>
        <img className="qr" src={qr} alt="UPI QR code for this gift" width={240} height={240} />
        <p><a className="btn primary" href={link}>Open my UPI app</a></p>
        <div className="payee">
          <p>You are paying</p>
          <p className="payee-name">{wedding.payee_name}</p>
          <p className="hint">{wedding.upi_id}</p>
        </div>
        <p className="hint">
          Your UPI app shows the bank&apos;s own name for this account before you pay. If it does not match the couple, stop and call them.
        </p>
        <details className="manual">
          <summary>Your UPI app refused or the QR did not work?</summary>
          <p>Some UPI apps block ready-made payment links to personal accounts. Pay by hand instead, it works in every UPI app:</p>
          <ol>
            <li>Open any UPI app and choose &ldquo;Pay to UPI ID&rdquo;.</li>
            <li>Paste this ID: <strong>{wedding.upi_id}</strong> <CopyButton text={wedding.upi_id} label="Copy UPI ID" /></li>
            <li>Check the name it shows matches <strong>{wedding.payee_name}</strong>.</li>
            <li>Enter <strong>{inr(amount)}</strong>, pay, then come back and type the UTR below.</li>
          </ol>
        </details>
      </div>

      <div className="card">
        <p className="eyebrow">Step 2 · Get your certificate</p>
        <Notice code={sp.e} />
        <form action={submitGift} className="stack">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="goal_id" value={goalId} />
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="guest_name" value={guestName} />
          <input type="hidden" name="message" value={message} />
          <label className="field">
            <span>UPI reference number (UTR), 12 digits</span>
            <input name="utr" required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} autoComplete="off" placeholder="412345678901" />
          </label>
          <p className="hint">You will find it in your UPI app under the payment details, as “UPI Ref No” or “UTR”.</p>
          <label className="check">
            <input type="checkbox" name="show_amount" />
            <span>Print the amount on my certificate</span>
          </label>
          <p className="hint">Your name, message, amount and reference number are shown only to the couple. See the <Link href="/privacy" target="_blank">Privacy Policy</Link>.</p>
          <button type="submit" className="btn primary">I have paid. Make my certificate</button>
        </form>
      </div>
    </div>
  );
}
