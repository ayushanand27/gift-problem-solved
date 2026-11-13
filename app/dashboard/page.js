import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCouple } from '@/lib/auth';
import { goalsWithTotals, siteUrl, weddingByCouple } from '@/lib/data';
import { query } from '@/lib/db';
import { qrDataUrl } from '@/lib/upi';
import { inr, niceDate } from '@/lib/validate';
import { resendVerification, setGiftStatus } from '../actions';
import Notice from '../components/Notice';
import ProgressBar from '../components/ProgressBar';
import WeddingForm from '../components/WeddingForm';

export const metadata = { title: 'Dashboard', robots: { index: false } };

const STATUS_LABEL = { pending: 'Waiting for you', confirmed: 'Confirmed', rejected: 'Not received' };

export default async function Dashboard({ searchParams }) {
  const couple = await currentCouple();
  if (!couple) redirect('/login');
  const { e, s: statusFilter, all } = await searchParams;

  if (!couple.email_verified_at) {
    return (
      <div className="narrow">
        <p className="eyebrow">One quick step</p>
        <h1>Check your <em>email</em></h1>
        <p className="lead">We sent a confirmation link to <strong>{couple.email}</strong>. Open it, then come back here to set up your page.</p>
        <Notice code={e} />
        <form action={resendVerification} className="stack">
          <button className="btn">Send the link again</button>
        </form>
        <p className="hint">Nothing in your inbox? Look in spam. Wrong address? Sign up again with the right one.</p>
      </div>
    );
  }

  const wedding = await weddingByCouple(couple.id);
  if (!wedding) {
    return (
      <div className="medium">
        <p className="eyebrow">Step one</p>
        <h1>Set up your <em>gift page</em></h1>
        <p className="lead">This takes about two minutes. You can change everything later.</p>
        <Notice code={e} />
        <div className="card"><WeddingForm /></div>
      </div>
    );
  }

  const goals = await goalsWithTotals(wedding.id);
  const { rows: gifts } = await query(
    `select f.id, f.guest_name, f.message, f.amount, f.utr, f.status, g.title as goal,
            to_char(f.created_at at time zone 'Asia/Kolkata', 'DD Mon, HH12:MI AM') as at
       from gifts f join goals g on g.id = f.goal_id
      where f.wedding_id = $1
      order by f.created_at desc`,
    [wedding.id]
  );
  const FILTERS = [['', 'All'], ['pending', 'Waiting'], ['confirmed', 'Confirmed'], ['rejected', 'Not received']];
  const filter = FILTERS.some(([key]) => key && key === statusFilter) ? statusFilter : '';
  const shown = filter ? gifts.filter((gift) => gift.status === filter) : gifts;
  const visible = all ? shown : shown.slice(0, 50);

  const pageUrl = `${await siteUrl()}/w/${wedding.slug}`;
  const qr = await qrDataUrl(pageUrl, 480);
  const confirmed = gifts.filter((gift) => gift.status === 'confirmed').reduce((sum, gift) => sum + gift.amount, 0);
  const waiting = gifts.filter((gift) => gift.status === 'pending');

  return (
    <div className="wide">
      <div className="title-row">
        <div>
          <p className="eyebrow">Your dashboard</p>
          <h1>{wedding.partner_one} <em>&amp;</em> {wedding.partner_two}</h1>
          {wedding.wedding_date && <p className="hint">{niceDate(wedding.wedding_date)}</p>}
        </div>
        <Link href="/dashboard/settings" className="btn">Edit page</Link>
      </div>
      <Notice code={e} />

      <section className="stats">
        <div className="card stat"><span>Confirmed by you</span><strong>{inr(confirmed)}</strong></div>
        <div className="card stat"><span>Waiting for you</span><strong>{waiting.length}</strong></div>
        <div className="card stat"><span>Total gifts</span><strong>{gifts.length}</strong></div>
      </section>

      <section className="card kit">
        <img src={qr} alt="QR code that opens your gift page" width={180} height={180} />
        <div>
          <p className="eyebrow">For the printer</p>
          <h2>For your <em>wedding card</em></h2>
          <p>Print this QR and this code on the card. Guests scan the QR, then type the code.</p>
          <p className="code">{wedding.card_code}</p>
          <p className="link-text">{pageUrl}</p>
          <div className="row">
            <a className="btn" href={qr} download="wedding-card-qr.png">Download QR</a>
            <Link className="btn" href={`/w/${wedding.slug}`}>See guest page</Link>
          </div>
        </div>
      </section>

      <section>
        <h2>Goals</h2>
        <div className="grid">
          {goals.map((goal) => (
            <div className="card goal" key={goal.id}>
              <h3>{goal.title}</h3>
              <ProgressBar raised={goal.raised} target={goal.target_amount} />
              <p className="hint">
                {goal.gift_count} confirmed{goal.pending_count > 0 && <> · {goal.pending_count} waiting for you</>}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="gifts">
        <h2>Gifts</h2>
        <p className="hint">
          Open your bank or UPI app, find the payment with the same reference number (UTR) and amount, then confirm it here.
          Only you can see names and amounts.
        </p>
        {gifts.length > 0 && (
          <div className="row filters">
            {FILTERS.map(([key, label]) => (
              <Link key={label} className={`btn small${filter === key ? ' primary' : ''}`} href={key ? `/dashboard?s=${key}#gifts` : '/dashboard#gifts'}>{label}</Link>
            ))}
            <a className="btn small" href="/dashboard/export">Download CSV</a>
          </div>
        )}
        {gifts.length === 0 && <p className="card empty">No gifts yet. They will show up here as guests pay.</p>}
        <div className="gift-list">
          {visible.map((gift) => (
            <div className="card gift" key={gift.id}>
              <div className="gift-main">
                <p className="gift-name">{gift.guest_name} <span className={`pill ${gift.status}`}>{STATUS_LABEL[gift.status]}</span></p>
                <p className="gift-amount">{inr(gift.amount)} <span>towards {gift.goal}</span></p>
                <p className="hint">UTR {gift.utr} · {gift.at}</p>
                {gift.message && <p className="gift-message">“{gift.message}”</p>}
              </div>
              <form action={setGiftStatus} className="row">
                <input type="hidden" name="gift_id" value={gift.id} />
                {gift.status !== 'confirmed' && <button className="btn small primary" name="status" value="confirmed">Received</button>}
                {gift.status !== 'rejected' && <button className="btn small" name="status" value="rejected">Not received</button>}
                <Link className="btn small" href={`/gift/${gift.id}`}>Certificate</Link>
              </form>
            </div>
          ))}
        </div>
        {visible.length < shown.length && (
          <p><Link className="btn small" href={`/dashboard?${filter ? `s=${filter}&` : ''}all=1#gifts`}>Show all {shown.length}</Link></p>
        )}
      </section>
    </div>
  );
}
