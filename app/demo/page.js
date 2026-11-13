import Link from 'next/link';
import ProgressBar from '@/app/components/ProgressBar';
import { inr } from '@/lib/validate';

export const metadata = { title: 'Demo: see how it works' };

const goals = [
  { title: 'Honeymoon in Kerala', raised: 42000, target: 80000 },
  { title: 'Our first home: a washing machine', raised: 18500, target: 30000 },
  { title: 'A year of date nights', raised: 6000, target: 25000 },
];

export default function Demo() {
  return (
    <div className="medium">
      <header className="center">
        <p className="eyebrow">Demo · nothing here is saved</p>
        <h1>How a wedding <em>looks</em></h1>
        <p className="lead">This is a made-up couple. It shows what your guests see after they scan the QR and enter the card code.</p>
      </header>

      <section className="stack">
        <header className="couple center">
          <p className="eyebrow">The wedding of</p>
          <h1>Riya <em>&amp;</em> Aman</h1>
          <p className="hint">Sunday, 14 February 2027</p>
          <p className="lead">Instead of a boxed gift, help us with something we are really saving for.</p>
        </header>
        <div className="grid">
          {goals.map((goal) => (
            <div className="card goal" key={goal.title}>
              <h3>{goal.title}</h3>
              <ProgressBar raised={goal.raised} target={goal.target} />
            </div>
          ))}
        </div>
        <p className="hint center">
          The guest picks a goal, pays the couple straight from any UPI app, types the 12-digit UTR from the receipt and gets a certificate.
          The site never touches the money.
        </p>
      </section>

      <section className="cert-wrap">
        <p className="eyebrow center">The certificate the guest carries on stage</p>
        <article className="certificate">
          <div className="cert-inner">
            <p className="cert-top">Shubh Vivah</p>
            <p className="cert-small">A gift of blessings from</p>
            <h2 className="cert-name">Neha Mausi</h2>
            <p className="cert-small">towards</p>
            <h3 className="cert-goal">Honeymoon in Kerala</h3>
            <p className="cert-amount">{inr(5100)}</p>
            <p className="cert-small">for the wedding of</p>
            <p className="cert-couple">Riya <em>&amp;</em> Aman</p>
            <p className="cert-message">“Go see the backwaters. Love, Mausi.”</p>
            <div className="cert-foot">
              <div>
                <p className="stamp confirmed">Confirmed by the couple</p>
                <p className="cert-id">Sample certificate</p>
              </div>
            </div>
          </div>
        </article>
        <p className="hint center">Until the couple sees the money in their bank account, the certificate is stamped “Not verified yet”.</p>
      </section>

      <p className="center">
        <Link className="btn primary" href="/signup">Create your own page</Link>
      </p>
    </div>
  );
}
