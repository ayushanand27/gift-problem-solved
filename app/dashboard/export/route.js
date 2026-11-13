import { currentCouple } from '@/lib/auth';
import { query } from '@/lib/db';

// Spreadsheet programs run text that starts with = + - @ as a formula, so those get a leading quote.
const cell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET() {
  const couple = await currentCouple();
  if (!couple) return new Response('Please log in.', { status: 401 });

  const { rows } = await query(
    `select to_char(f.created_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') as at,
            f.guest_name, f.amount, g.title as goal, f.utr, f.status, f.message
       from gifts f
       join goals g on g.id = f.goal_id
       join weddings w on w.id = f.wedding_id
      where w.couple_id = $1
      order by f.created_at`,
    [couple.id]
  );
  const head = ['Date (IST)', 'Guest', 'Amount (INR)', 'Goal', 'UTR', 'Status', 'Message'];
  const lines = [head, ...rows.map((r) => [r.at, r.guest_name, r.amount, r.goal, r.utr, r.status, r.message])];
  const body = '\uFEFF' + lines.map((line) => line.map(cell).join(',')).join('\r\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gifts.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
