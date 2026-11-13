'use server';

import { redirect } from 'next/navigation';
import { randomBytes, randomInt } from 'node:crypto';
import { query, transaction } from '@/lib/db';
import {
  currentCouple, endSession, hashPassword, hasUnlocked, safeEqual,
  startSession, unlockWedding, verifyPassword,
} from '@/lib/auth';
import { clientIp, recordAttempt, tooMany } from '@/lib/ratelimit';
import { weddingByCouple, weddingBySlug } from '@/lib/data';
import { EMAIL, SLUG, UPI_ID, UPI_LIMIT, UTR, UUID, cleanText, parseRupees } from '@/lib/validate';

// ---------- Couple account ----------

export async function signup(formData) {
  const email = cleanText(formData.get('email'), 200).toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!EMAIL.test(email)) redirect('/signup?e=email');
  if (password.length < 8 || password.length > 200) redirect('/signup?e=password');

  const ip = await clientIp();
  if (await tooMany(`signup:${ip}`, 10, 60)) redirect('/signup?e=slow');
  await recordAttempt(`signup:${ip}`);

  const { rows } = await query(
    `insert into couples (email, password_hash) values ($1, $2)
     on conflict (email) do nothing returning id`,
    [email, hashPassword(password)]
  );
  if (!rows[0]) redirect('/signup?e=taken');

  await startSession(rows[0].id);
  redirect('/dashboard');
}

export async function login(formData) {
  const email = cleanText(formData.get('email'), 200).toLowerCase();
  const password = String(formData.get('password') ?? '').slice(0, 200);
  const ip = await clientIp();
  const keys = [`login:${email}`, `login-ip:${ip}`];

  if ((await tooMany(keys[0], 8, 15)) || (await tooMany(keys[1], 30, 15))) redirect('/login?e=slow');

  const { rows } = await query('select id, password_hash from couples where email = $1', [email]);
  const ok = rows[0] && verifyPassword(password, rows[0].password_hash);
  if (!ok) {
    for (const key of keys) await recordAttempt(key);
    redirect('/login?e=login');
  }

  await startSession(rows[0].id);
  redirect('/dashboard');
}

export async function logout() {
  await endSession();
  redirect('/');
}

// ---------- Wedding page: create and edit ----------

export async function saveWedding(formData) {
  const couple = await currentCouple();
  if (!couple) redirect('/login');

  const existing = await weddingByCouple(couple.id);
  const back = existing ? '/dashboard/settings' : '/dashboard';
  const fail = (code) => redirect(`${back}?e=${code}`);

  const partnerOne = cleanText(formData.get('partner_one'), 60);
  const partnerTwo = cleanText(formData.get('partner_two'), 60);
  const rawDate = String(formData.get('wedding_date') ?? '');
  const weddingDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const upiId = cleanText(formData.get('upi_id'), 320).toLowerCase();
  const payeeName = cleanText(formData.get('payee_name'), 80);
  const minAmount = parseRupees(formData.get('min_amount'));
  const maxAmount = parseRupees(formData.get('max_amount'));

  if (!partnerOne || !partnerTwo) fail('names');
  if (!UPI_ID.test(upiId)) fail('upi');
  if (!payeeName) fail('payee');
  if (!minAmount || !maxAmount || minAmount > maxAmount || maxAmount > UPI_LIMIT) fail('range');

  const goals = [];
  for (let i = 0; i < 5; i++) {
    const id = String(formData.get(`goal_id_${i}`) ?? '');
    goals.push({
      id: UUID.test(id) ? id : null,
      title: cleanText(formData.get(`goal_title_${i}`), 60),
      target: parseRupees(formData.get(`goal_target_${i}`)),
      position: i,
    });
  }
  const filled = goals.filter((goal) => goal.title);
  if (!filled.length || filled.some((goal) => !goal.target || goal.target < 1000 || goal.target > 100000000)) {
    fail('goals');
  }

  // Changing where the money goes is the most dangerous edit, so it needs the password again.
  if (existing && (existing.upi_id !== upiId || existing.payee_name !== payeeName)) {
    const current = String(formData.get('current_password') ?? '');
    if (!current || !verifyPassword(current, couple.password_hash)) fail('current');
  }

  await transaction(async (db) => {
    let weddingId = existing?.id;
    if (existing) {
      await db.query(
        `update weddings set partner_one = $1, partner_two = $2, wedding_date = $3, upi_id = $4,
                payee_name = $5, min_amount = $6, max_amount = $7
          where id = $8 and couple_id = $9`,
        [partnerOne, partnerTwo, weddingDate, upiId, payeeName, minAmount, maxAmount, existing.id, couple.id]
      );
    } else {
      const slug = randomBytes(6).toString('hex');
      const cardCode = String(randomInt(0, 1000000)).padStart(6, '0');
      const { rows } = await db.query(
        `insert into weddings (couple_id, slug, card_code, partner_one, partner_two, wedding_date,
                               upi_id, payee_name, min_amount, max_amount)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id`,
        [couple.id, slug, cardCode, partnerOne, partnerTwo, weddingDate, upiId, payeeName, minAmount, maxAmount]
      );
      weddingId = rows[0].id;
    }

    for (const goal of goals) {
      if (goal.id && goal.title) {
        await db.query(
          'update goals set title = $1, target_amount = $2, position = $3 where id = $4 and wedding_id = $5',
          [goal.title, goal.target, goal.position, goal.id, weddingId]
        );
      } else if (goal.id) {
        // A goal that already has gifts is kept, so no gift ever loses its goal.
        await db.query(
          `delete from goals where id = $1 and wedding_id = $2
              and not exists (select 1 from gifts where goal_id = $1)`,
          [goal.id, weddingId]
        );
      } else if (goal.title) {
        await db.query(
          'insert into goals (wedding_id, title, target_amount, position) values ($1, $2, $3, $4)',
          [weddingId, goal.title, goal.target, goal.position]
        );
      }
    }
  });

  redirect(existing ? '/dashboard?e=saved' : '/dashboard');
}

export async function setGiftStatus(formData) {
  const couple = await currentCouple();
  if (!couple) redirect('/login');

  const giftId = String(formData.get('gift_id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (UUID.test(giftId) && ['pending', 'confirmed', 'rejected'].includes(status)) {
    await query(
      `update gifts set status = $1
        where id = $2 and wedding_id = (select id from weddings where couple_id = $3)`,
      [status, giftId, couple.id]
    );
  }
  redirect('/dashboard#gifts');
}

// ---------- Guest side ----------

export async function enterCode(formData) {
  const slug = String(formData.get('slug') ?? '');
  if (!SLUG.test(slug)) redirect('/');
  const code = String(formData.get('code') ?? '').replace(/\D/g, '').slice(0, 6);

  const ip = await clientIp();
  const keys = [`code:${slug}:${ip}`, `code:${slug}`];
  if ((await tooMany(keys[0], 8, 15)) || (await tooMany(keys[1], 60, 15))) redirect(`/w/${slug}?e=slow`);

  const wedding = await weddingBySlug(slug);
  if (!wedding) redirect('/');

  if (!safeEqual(code, wedding.card_code)) {
    for (const key of keys) await recordAttempt(key);
    redirect(`/w/${slug}?e=code`);
  }

  await unlockWedding(slug);
  redirect(`/w/${slug}`);
}

export async function submitGift(formData) {
  const slug = String(formData.get('slug') ?? '');
  if (!SLUG.test(slug)) redirect('/');
  if (!(await hasUnlocked(slug))) redirect(`/w/${slug}`);

  const wedding = await weddingBySlug(slug);
  if (!wedding) redirect('/');

  const goalId = String(formData.get('goal_id') ?? '');
  const amount = parseRupees(formData.get('amount'));
  const guestName = cleanText(formData.get('guest_name'), 60);
  const message = cleanText(formData.get('message'), 200);
  const utr = String(formData.get('utr') ?? '').replace(/\s/g, '');
  const showAmount = formData.get('show_amount') === 'on';

  if (!UUID.test(goalId)) redirect(`/w/${slug}?e=goal`);
  if (!amount || amount < wedding.min_amount || amount > wedding.max_amount) redirect(`/w/${slug}?e=amount`);
  if (!guestName) redirect(`/w/${slug}?e=guest`);

  const payPage = (code) => {
    const params = new URLSearchParams({
      goal_id: goalId, amount: String(amount), guest_name: guestName, message, e: code,
    });
    return `/w/${slug}/pay?${params}`;
  };

  if (!UTR.test(utr)) redirect(payPage('utr'));

  const ip = await clientIp();
  const key = `gift:${slug}:${ip}`;
  if (await tooMany(key, 10, 60)) redirect(payPage('slow'));
  await recordAttempt(key);

  const goal = await query('select id from goals where id = $1 and wedding_id = $2', [goalId, wedding.id]);
  if (!goal.rows[0]) redirect(`/w/${slug}?e=goal`);

  // The same UPI reference number can never be used for two gifts.
  const { rows } = await query(
    `insert into gifts (wedding_id, goal_id, guest_name, message, amount, utr, show_amount)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (wedding_id, utr) do nothing returning id`,
    [wedding.id, goalId, guestName, message, amount, utr, showAmount]
  );
  if (!rows[0]) redirect(payPage('used'));

  redirect(`/gift/${rows[0].id}`);
}
