import Link from 'next/link';
import { redirect } from 'next/navigation';
import { login } from '../actions';
import { isLoggedIn } from '@/lib/auth';
import Notice from '../components/Notice';

export const metadata = { title: 'Log in' };

export default async function Login({ searchParams }) {
  if (await isLoggedIn()) redirect('/dashboard');
  const { e } = await searchParams;
  return (
    <div className="narrow">
      <p className="eyebrow">Welcome back</p>
      <h1>Log <em>in</em></h1>
      <Notice code={e} />
      <form action={login} className="stack">
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" required maxLength={200} autoComplete="current-password" />
        </label>
        <button className="btn primary">Log in</button>
      </form>
      <p className="hint">New here? <Link href="/signup">Create a gift page</Link></p>
    </div>
  );
}
