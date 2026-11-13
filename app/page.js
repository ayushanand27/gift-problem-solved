import Link from 'next/link';
import ProgressBar from './components/ProgressBar';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">For Indian weddings</p>
        <h1>Nobody needs a fourth mixer.</h1>
        <p className="lead">
          Tell your guests what you are really saving for. They scan the QR on your wedding card,
          gift by UPI, and walk on stage with a certificate instead of a box.
        </p>
        <Link href="/signup" className="btn primary">Create your gift page</Link>
      </section>

      <section className="sample card">
        <p className="eyebrow">What your guests see</p>
        <h2>Riya &amp; Aman</h2>
        <div className="goal">
          <h3>Honeymoon in Kerala</h3>
          <ProgressBar raised={84500} target={150000} />
        </div>
        <div className="goal">
          <h3>Home loan</h3>
          <ProgressBar raised={212000} target={500000} />
        </div>
      </section>

      <section className="steps">
        <div className="card">
          <span className="step-no">1</span>
          <h3>List your goals</h3>
          <p>Honeymoon, a loan, a car, your first child&apos;s education. Set a target for each and the smallest and largest gift.</p>
        </div>
        <div className="card">
          <span className="step-no">2</span>
          <h3>Print the QR on your card</h3>
          <p>You get one QR and a 6-digit code. Only people holding your card can open your page.</p>
        </div>
        <div className="card">
          <span className="step-no">3</span>
          <h3>Guests gift by UPI</h3>
          <p>They pay your UPI ID directly, enter the UPI reference number, and get a printable certificate.</p>
        </div>
      </section>
    </div>
  );
}
