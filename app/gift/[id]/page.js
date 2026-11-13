import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { siteUrl } from '@/lib/data';
import { qrDataUrl } from '@/lib/upi';
import { safeEqual } from '@/lib/auth';
import { UUID, inr, niceDate } from '@/lib/validate';
import PrintButton from '@/app/components/PrintButton';

export const metadata = { title: 'Gift certificate', robots: { index: false, follow: false } };

export default async function Certificate({ params, searchParams }) {
  const { id } = await params;
  const { k } = await searchParams;
  if (!UUID.test(id)) notFound();

  const { rows } = await query(
    `select f.id, f.cert_key, f.guest_name, f.message, f.amount, f.show_amount, f.status,
            to_char(f.created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD') as gifted_on,
            g.title as goal, w.partner_one, w.partner_two,
            to_char(w.wedding_date, 'YYYY-MM-DD') as wedding_date
       from gifts f
       join goals g on g.id = f.goal_id
       join weddings w on w.id = f.wedding_id
      where f.id = $1`,
    [id]
  );
  const gift = rows[0];
  if (!gift) notFound();

  if (gift.status === 'rejected') {
    return (
      <div className="narrow center">
        <p className="eyebrow">Certificate</p>
        <h1>Payment <em>not found</em></h1>
        <p>
          {gift.partner_one} &amp; {gift.partner_two} could not find this payment in their account.
          Please check the UPI reference number with them.
        </p>
      </div>
    );
  }

  // Without the private key in the link, anyone (for example someone scanning the QR on stage) sees only
  // whether this certificate is real and confirmed. Name, message and amount stay private to the guest and the couple.
  const isOwner = typeof k === 'string' && gift.cert_key && safeEqual(k, gift.cert_key);
  const done = gift.status === 'confirmed';
  if (!isOwner) {
    return (
      <div className="narrow center">
        <p className="eyebrow">Certificate check</p>
        <h1>{gift.partner_one} <em>&amp;</em> {gift.partner_two}</h1>
        <p className={`stamp ${gift.status}`}>{done ? 'Confirmed by the couple' : 'Not verified yet'}</p>
        <p className="hint">
          Certificate {gift.id.slice(0, 8).toUpperCase()} · {niceDate(gift.gifted_on)}
        </p>
        <p>
          {done
            ? 'The couple has checked their bank account and confirmed this gift.'
            : 'The couple has not confirmed this gift yet. Until they do, treat it as unverified.'}
        </p>
      </div>
    );
  }

  const verifyQr = await qrDataUrl(`${await siteUrl()}/gift/${gift.id}`, 240);
  const confirmed = gift.status === 'confirmed';

  return (
    <div className="cert-wrap">
      <div className="no-print cert-actions">
        <p className={confirmed ? 'notice ok' : 'notice'}>
          {confirmed
            ? 'The couple has confirmed this gift.'
            : 'Not verified yet. This certificate only shows that you submitted a payment reference. It becomes confirmed when the couple finds the money in their bank account.'}
        </p>
        <PrintButton />
      </div>

      <article className={`certificate${confirmed ? '' : ' unverified'}`}>
        {!confirmed && <p className="watermark" aria-hidden="true">Not verified</p>}
        <div className="cert-inner">
          <p className="cert-top">Shubh Vivah</p>
          <p className="cert-small">A gift of blessings from</p>
          <h1 className="cert-name">{gift.guest_name}</h1>
          <p className="cert-small">towards</p>
          <h2 className="cert-goal">{gift.goal}</h2>
          {gift.show_amount && <p className="cert-amount">{inr(gift.amount)}</p>}
          <p className="cert-small">for the wedding of</p>
          <p className="cert-couple">{gift.partner_one} <em>&amp;</em> {gift.partner_two}</p>
          {gift.wedding_date && <p className="cert-date">{niceDate(gift.wedding_date)}</p>}
          {gift.message && <p className="cert-message">“{gift.message}”</p>}

          <div className="cert-foot">
            <div>
              <p className={`stamp ${gift.status}`}>{confirmed ? 'Confirmed by the couple' : 'Not verified yet'}</p>
              <p className="cert-id">Certificate {gift.id.slice(0, 8).toUpperCase()} · {niceDate(gift.gifted_on)}</p>
            </div>
            <div className="cert-qr">
              <img src={verifyQr} alt="QR code to verify this certificate" width={84} height={84} />
              <p>Scan to verify</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
