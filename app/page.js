import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { isLoggedIn } from '@/lib/auth';
import { IMAGES } from '@/lib/images';
import { SITE_NAME } from '@/lib/site';
import { signup } from './actions';
import GoalsShowcase from './components/GoalsShowcase';
import Hero from './components/Hero';
import ParallaxImage from './components/ParallaxImage';
import ProgressBar from './components/ProgressBar';
import Quotes from './components/Quotes';
import Reveal from './components/Reveal';
import Consent from './components/Consent';

const STEPS = [
  {
    numeral: 'I',
    title: 'The invitation',
    text: 'One QR and a six-digit code, printed on your card. Only those holding it may enter.',
    image: IMAGES.invitation,
    alt: 'A wedding invitation with a gold ring resting on it',
    ratio: '4 / 5',
  },
  {
    numeral: 'II',
    title: 'The gift',
    text: 'Guests choose a goal and pay your UPI ID directly. Nothing passes through us.',
    image: IMAGES.gift,
    alt: 'A small gift box tied with gold ribbon',
    ratio: '3 / 4',
    arched: true,
  },
  {
    numeral: 'III',
    title: 'The stage',
    text: 'Each guest receives a certificate to print and carry. No one arrives empty-handed.',
    image: IMAGES.stage,
    alt: 'A couple exchanging rings beneath falling petals',
    ratio: '4 / 5',
  },
];

const GOALS = [
  { title: 'The honeymoon', line: 'Two weeks away, already paid for.', image: IMAGES.honeymoon },
  { title: 'A first home', line: 'A down payment, one blessing at a time.', image: IMAGES.home },
  { title: 'The car', line: 'For the long drives you keep promising each other.', image: IMAGES.car },
  { title: "A child's education", line: 'A fund that begins before they do.', image: IMAGES.education },
  { title: 'A lighter loan', line: 'Start married life owing a little less.', image: IMAGES.loan },
];

const NOTES = [
  'The kindest gift is the one that is actually wanted.',
  'Shagun has always blessed a beginning. We only made it easier to give.',
  'No guest should walk on stage empty-handed. No couple should own four mixers.',
];

export default async function Home() {
  const loggedIn = await isLoggedIn();
  return (
    <>
      <Hero image={IMAGES.hero} imageMobile={IMAGES.heroMobile} />

      <section id="idea" className="section statement">
        <Reveal>
          <p className="eyebrow">The idea</p>
          <h2 className="display">
            A wedding gift should move a couple <em>closer</em> to the life they are building.
          </h2>
          <span className="rule" />
          <p className="prose">
            {SITE_NAME} lets you name what matters: a honeymoon, a first home, a child&apos;s education.
            Your guests give towards it by UPI, and every rupee travels straight from their bank to yours.
          </p>
        </Reveal>
      </section>

      <section id="unfolds" className="section">
        <Reveal className="section-head">
          <p className="eyebrow">How it unfolds</p>
          <h2 className="display">Three <em>quiet</em> steps</h2>
        </Reveal>
        <div className="gallery">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.12} className={`gallery-item item-${i + 1}`}>
              <figure>
                <ParallaxImage src={step.image} alt={step.alt} ratio={step.ratio} arched={step.arched} />
                <figcaption>
                  <span className="numeral">{step.numeral}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="goals" className="section surface">
        <div className="contain">
          <Reveal className="section-head">
            <p className="eyebrow">What couples ask for</p>
            <h2 className="display">Name what you are <em>truly</em> saving for</h2>
          </Reveal>
          <Reveal>
            <GoalsShowcase goals={GOALS} />
          </Reveal>
        </div>
      </section>

      <section className="section preview">
        <Reveal className="preview-copy">
          <p className="eyebrow">What your guests see</p>
          <h2 className="display">Every goal, <em>gently</em> filling</h2>
          <p className="prose">
            Guests see how close each goal is, never who gave what. Names and amounts stay with the two of you.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="card preview-card">
          <p className="eyebrow">A sample page</p>
          <p className="preview-names">Riya <em>&amp;</em> Aman</p>
          <div className="goal">
            <h3>Honeymoon in Kerala</h3>
            <ProgressBar raised={84500} target={150000} />
          </div>
          <div className="goal">
            <h3>A first home</h3>
            <ProgressBar raised={212000} target={500000} />
          </div>
        </Reveal>
      </section>

      <section className="section surface statement">
        <Reveal>
          <p className="eyebrow">What we believe</p>
          <Quotes quotes={NOTES} />
        </Reveal>
      </section>

      <section id="begin" className="section begin">
        <Reveal className="begin-copy">
          <p className="eyebrow">Begin</p>
          <h2 className="display">Your page, in <em>two</em> minutes</h2>
          <p className="prose">
            Add your names, your UPI ID and your goals. You will have a QR and a code ready for the printer today.
          </p>
        </Reveal>
        <Reveal delay={0.12} className="begin-form">
          {loggedIn ? (
            <Link href="/dashboard" className="btn primary">Open your dashboard <ArrowRight size={14} strokeWidth={1.25} /></Link>
          ) : (
            <form action={signup} className="stack">
              <label className="field">
                <span>Email</span>
                <input type="email" name="email" required autoComplete="email" />
              </label>
              <label className="field">
                <span>Choose a password</span>
                <input type="password" name="password" required minLength={8} maxLength={200} autoComplete="new-password" />
              </label>
              <Consent />
              <button className="btn primary">Begin your page <ArrowRight size={14} strokeWidth={1.25} /></button>
              <p className="hint">Already with us? <Link href="/login">Log in</Link> · Just curious? <Link href="/demo">See a demo</Link></p>
            </form>
          )}
        </Reveal>
      </section>
    </>
  );
}
