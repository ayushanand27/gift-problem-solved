import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCouple } from '@/lib/auth';
import { goalsWithTotals, weddingByCouple } from '@/lib/data';
import { deleteAccount } from '../../actions';
import Notice from '../../components/Notice';
import WeddingForm from '../../components/WeddingForm';

export const metadata = { title: 'Edit page', robots: { index: false } };

export default async function Settings({ searchParams }) {
  const couple = await currentCouple();
  if (!couple) redirect('/login');
  const wedding = await weddingByCouple(couple.id);
  if (!wedding) redirect('/dashboard');
  const { e } = await searchParams;
  const goals = await goalsWithTotals(wedding.id);

  return (
    <div className="medium">
      <p><Link href="/dashboard">← Back to dashboard</Link></p>
      <h1>Edit your <em>gift page</em></h1>
      <p className="hint">A goal that already has gifts cannot be removed, only renamed.</p>
      <Notice code={e} />
      <div className="card"><WeddingForm wedding={wedding} goals={goals} /></div>
      <section className="card danger">
        <h2>Delete my <em>account</em></h2>
        <p className="hint">This removes your page, your goals and every gift record for good. Download the CSV from the dashboard first if you need it.</p>
        <form action={deleteAccount} className="stack">
          <label className="field"><span>Current password</span><input type="password" name="current_password" required autoComplete="current-password" /></label>
          <label className="field"><span>Type the word delete</span><input name="confirm" required autoComplete="off" /></label>
          <button className="btn">Delete everything</button>
        </form>
      </section>
    </div>
  );
}
