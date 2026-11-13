import Link from 'next/link';
import { verifyEmail } from '../actions';
import { tokenIsLive } from '@/lib/tokens';
import Notice from '../components/Notice';

export const metadata = { title: 'Confirm your email', robots: { index: false } };

export default async function Verify({ searchParams }) {
  const { t, e } = await searchParams;
  // The email is confirmed by pressing the button, not by opening the link,
  // so mail scanners that open every link cannot use the token up.
  const live = t ? await tokenIsLive(t, 'verify') : false;
  return (
    <div className="narrow center">
      <p className="eyebrow">Almost there</p>
      <h1>Confirm your <em>email</em></h1>
      <Notice code={e} />
      {live ? (
        <form action={verifyEmail} className="stack">
          <input type="hidden" name="t" value={t} />
          <p className="lead">Press the button to confirm this address.</p>
          <button className="btn primary">Confirm my email</button>
        </form>
      ) : (
        <>
          <Notice code={e ? null : 'badlink'} />
          <p className="hint"><Link href="/login">Log in</Link> and we will send a new link.</p>
        </>
      )}
    </div>
  );
}
