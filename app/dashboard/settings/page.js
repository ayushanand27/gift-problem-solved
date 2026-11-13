import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCouple } from '@/lib/auth';
import { goalsWithTotals, weddingByCouple } from '@/lib/data';
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
      <h1>Edit your gift page</h1>
      <p className="hint">A goal that already has gifts cannot be removed, only renamed.</p>
      <Notice code={e} />
      <div className="card"><WeddingForm wedding={wedding} goals={goals} /></div>
    </div>
  );
}
