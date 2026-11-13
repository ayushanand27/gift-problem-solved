'use client';

import { useState } from 'react';

const GOALS = [
  { title: 'Honeymoon in Kerala', raised: 42000, target: 80000 },
  { title: 'Our first home: a washing machine', raised: 18500, target: 30000 },
  { title: 'A year of date nights', raised: 6000, target: 25000 },
];
const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

// A stateless walk through the guest journey. Nothing is sent anywhere or saved.
export default function DemoFlow() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [goal, setGoal] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('1100');
  const [confirmed, setConfirmed] = useState(false);

  const next = (to) => { setError(''); setStep(to); };

  return (
    <div className="narrow">
      <p className="eyebrow center">Demo · step {step + 1} of 4 · nothing is saved or paid</p>

      {step === 0 && (
        <form className="card center stack" onSubmit={(e) => { e.preventDefault(); const code = new FormData(e.currentTarget).get('code'); code === '123456' ? next(1) : setError('In this demo the code is 123456.'); }}>
          <p className="eyebrow">You scanned the QR on the card</p>
          <h2>Enter the code on <em>the card</em></h2>
          <p className="hint">The 6-digit number printed next to the QR. For this demo, type 123456.</p>
          {error && <p className="notice" role="status">{error}</p>}
          <input className="code-input" name="code" inputMode="numeric" maxLength={6} autoComplete="off" aria-label="6-digit code" placeholder="000000" />
          <button type="submit" className="btn primary">Open the page</button>
        </form>
      )}

      {step === 1 && (
        <form className="card stack" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return setError('Enter your name.'); next(2); }}>
          <header className="couple center">
            <p className="eyebrow">The wedding of</p>
            <h2>Riya <em>&amp;</em> Aman</h2>
          </header>
          <fieldset className="plain">
            <legend>1. Choose what to gift towards</legend>
            {GOALS.map((g, i) => (
              <label className="card goal pick" key={g.title}>
                <input type="radio" name="goal" checked={goal === i} onChange={() => setGoal(i)} />
                <h3>{g.title}</h3>
                <p className="hint">{money(g.raised)} of {money(g.target)}</p>
              </label>
            ))}
          </fieldset>
          {error && <p className="notice" role="status">{error}</p>}
          <label className="field"><span>Your name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Neha Mausi" /></label>
          <label className="field"><span>Amount in ₹</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min={501} max={51000} inputMode="numeric" /></label>
          <button type="submit" className="btn primary">Continue to pay</button>
        </form>
      )}

      {step === 2 && (
        <div className="stack">
          <div className="card center">
            <p className="eyebrow">Step 1 · Pay by UPI</p>
            <h2>{money(amount || 0)}</h2>
            <p>towards <strong>{GOALS[goal].title}</strong></p>
            <p className="hint">In the real flow a UPI QR and an &ldquo;Open my UPI app&rdquo; button appear here. The money goes from your bank straight to the couple&apos;s bank, never through this site.</p>
            <div className="payee"><p>You are paying</p><p className="payee-name">Riya Sharma and Aman Verma</p></div>
          </div>
          <form className="card stack" onSubmit={(e) => { e.preventDefault(); const utr = String(new FormData(e.currentTarget).get('utr')).replace(/\s/g, ''); /^\d{12}$/.test(utr) ? next(3) : setError('The UPI reference number (UTR) must be exactly 12 digits.'); }}>
            <p className="eyebrow">Step 2 · Get your certificate</p>
            {error && <p className="notice" role="status">{error}</p>}
            <label className="field"><span>UPI reference number (UTR), 12 digits</span><input name="utr" inputMode="numeric" maxLength={12} autoComplete="off" placeholder="any 12 digits, e.g. 412345678901" /></label>
            <p className="hint">In real life you copy this from your UPI app after paying.</p>
            <button type="submit" className="btn primary">Get my certificate</button>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="stack">
          <article className={`certificate${confirmed ? '' : ' unverified'}`}>
            {!confirmed && <p className="watermark" aria-hidden="true">Not verified</p>}
            <div className="cert-inner">
              <p className="cert-top">Shubh Vivah</p>
              <p className="cert-small">A gift of blessings from</p>
              <h2 className="cert-name">{name.trim() || 'Your name'}</h2>
              <p className="cert-small">towards</p>
              <h3 className="cert-goal">{GOALS[goal].title}</h3>
              <p className="cert-amount">{money(amount || 0)}</p>
              <p className="cert-small">for the wedding of</p>
              <p className="cert-couple">Riya <em>&amp;</em> Aman</p>
              <div className="cert-foot"><div><p className={`stamp ${confirmed ? 'confirmed' : 'pending'}`}>{confirmed ? 'Confirmed by the couple' : 'Not verified yet'}</p></div></div>
            </div>
          </article>
          <div className="card center stack">
            <p className="hint">The certificate starts as &ldquo;Not verified yet&rdquo;. The couple gets an email, matches the amount against their bank, and confirms it.</p>
            {!confirmed
              ? <button type="button" className="btn primary" onClick={() => setConfirmed(true)}>Play the couple: confirm this gift</button>
              : <p className="notice ok">Confirmed. That is the whole journey.</p>}
            <button type="button" className="btn" onClick={() => { setConfirmed(false); setName(''); setError(''); setStep(0); }}>Start again</button>
          </div>
        </div>
      )}
    </div>
  );
}
