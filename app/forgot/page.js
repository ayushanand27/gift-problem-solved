import Link from 'next/link';
import { requestReset } from '../actions';
import Notice from '../components/Notice';

export const metadata = { title: 'Forgot password', robots: { index: false } };

export default async function Forgot({ searchParams }) {
  const { e } = await searchParams;
  return (
    <div className="narrow">
      <p className="eyebrow">No worries</p>
      <h1>Reset your <em>password</em></h1>
      <p className="lead">Enter the email you signed up with. We will send a link that works once, for 30 minutes.</p>
      <Notice code={e} />
      <form action={requestReset} className="stack">
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <button type="submit" className="btn primary">Send the link</button>
      </form>
      <p className="hint"><Link href="/login">Back to log in</Link></p>
    </div>
  );
}
