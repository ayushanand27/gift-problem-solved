import Link from 'next/link';
import { resetPassword } from '../actions';
import { tokenIsLive } from '@/lib/tokens';
import Notice from '../components/Notice';

export const metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function Reset({ searchParams }) {
  const { t, e } = await searchParams;
  const live = t ? await tokenIsLive(t, 'reset') : false;
  if (!live) {
    return (
      <div className="narrow">
        <p className="eyebrow">Link expired</p>
        <h1>This link <em>no longer works</em></h1>
        <p className="lead">Reset links work once and for 30 minutes.</p>
        <p><Link className="btn" href="/forgot">Get a new link</Link></p>
      </div>
    );
  }
  return (
    <div className="narrow">
      <p className="eyebrow">Almost done</p>
      <h1>Choose a new <em>password</em></h1>
      <Notice code={e} />
      <form action={resetPassword} className="stack">
        <input type="hidden" name="t" value={t} />
        <label className="field">
          <span>New password (8 characters or more)</span>
          <input type="password" name="password" required minLength={8} maxLength={200} autoComplete="new-password" />
        </label>
        <button className="btn primary">Save new password</button>
      </form>
      <p className="hint">You will be logged out everywhere else.</p>
    </div>
  );
}
