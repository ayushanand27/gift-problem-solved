import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signup } from '../actions';
import { isLoggedIn } from '@/lib/auth';
import Notice from '../components/Notice';

export const metadata = { title: 'Create a gift page' };

export default async function Signup({ searchParams }) {
  if (await isLoggedIn()) redirect('/dashboard');
  const { e } = await searchParams;
  return (
    <div className="narrow card">
      <h1>Create your account</h1>
      <Notice code={e} />
      <form action={signup} className="stack">
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="field">
          <span>Password (8 characters or more)</span>
          <input type="password" name="password" required minLength={8} maxLength={200} autoComplete="new-password" />
        </label>
        <button className="btn primary">Continue</button>
      </form>
      <p className="hint">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}
