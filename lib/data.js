import { headers } from 'next/headers';
import { query } from './db';

const WEDDING_COLUMNS = `id, couple_id, slug, card_code, partner_one, partner_two,
  to_char(wedding_date, 'YYYY-MM-DD') as wedding_date, upi_id, payee_name, min_amount, max_amount`;

export async function weddingBySlug(slug) {
  const { rows } = await query(`select ${WEDDING_COLUMNS} from weddings where slug = $1`, [slug]);
  return rows[0] || null;
}

export async function weddingByCouple(coupleId) {
  const { rows } = await query(`select ${WEDDING_COLUMNS} from weddings where couple_id = $1`, [coupleId]);
  return rows[0] || null;
}

// Each goal with the money the couple has CONFIRMED. A gift nobody has checked is never shown as raised.
export async function goalsWithTotals(weddingId) {
  const { rows } = await query(
    `select g.id, g.title, g.target_amount,
            coalesce(sum(f.amount) filter (where f.status = 'confirmed'), 0)::int as raised,
            (count(f.id) filter (where f.status = 'confirmed'))::int as gift_count,
            (count(f.id) filter (where f.status = 'pending'))::int as pending_count,
            count(f.id)::int as all_gifts
       from goals g
       left join gifts f on f.goal_id = g.id
      where g.wedding_id = $1
      group by g.id
      order by g.position, g.title`,
    [weddingId]
  );
  return rows;
}

export async function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  // On Vercel this is the fixed production address, so printed QR codes never depend on request headers.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
