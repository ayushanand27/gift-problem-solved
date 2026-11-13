'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { randomBytes, randomInt } from 'node:crypto';
import { query, transaction } from '@/lib/db';
import {
  currentCouple, endSession, hashPassword, hasUnlocked, safeEqual,
  startSession, unlockWedding, verifyPassword,
} from '@/lib/auth';
import { consumeToken, createToken } from '@/lib/tokens';
import { sendMail } from '@/lib/mail';
import { clientIp, recordAttempt, tooMany } from '@/lib/ratelimit';
import { siteUrl, weddingByCouple, weddingBySlug } from '@/lib/data';
import { EMAIL, SLUG, UPI_ID, UPI_LIMIT, UTR, UUID, cleanText, inr, isRealDate, parseRupees } from '@/lib/validate';

// ---------- Couple account ----------

async function sendVerification(couple) {
  const token = await createToken(couple.id, 'verify', 60 * 24);
  const link = `${await siteUrl()}/verify?t=${token}`;
  return sendMail({
    to: couple.email,
    subject: 'Confirm your email address',
    text: `Welcome. Please confirm that this email address is yours:\n\n${link}\n\nThe link works for 24 hours. If you did not sign up, ignore this email and nothing happens.`,
  });
}

export async function signup(formData) {
  const email = cleanText(formData.get('email'), 200).toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!EMAIL.test(email)) redirect('/signup?e=email');
  if (password.length < 8 || password.length > 200) redirect('/signup?e=password');
  if (formData.get('agree') !== 'on') redirect('/signup?e=agree');

  const ip = await clientIp();
  if (await tooMany(`signup:${ip}`, 10, 60)) redirect('/signup?e=slow');
  await recordAttempt(`signup:${ip}`);

  // An address nobody has confirmed can be claimed again by its real owner. That stops anyone
  // from blocking an email they do not own. A confirmed address is never touched.
  const passwordHash = hashPassword(password);
  const { rows } = await query(
    `insert into couples (email, password_hash) values ($1, $2)
     on conflict (email) do update set password_hash = excluded.password_hash
       where couples.email_verified_at is null
     returning id, email, password_hash`,
    [email, passwordHash]
  );
  if (!rows[0]) redirect('/signup?e=taken');

  await startSession(rows[0].id, rows[0].password_hash);
  await sendVerification(rows[0]);
  redirect('/dashboard');
}

export async function resendVerification() {
  const couple = await currentCouple();
  if (!couple) redirect('/login');
  if (couple.email_verified_at) redirect('/dashboard');

  const ip = await clientIp();
  const keys = [`resend:${couple.id}`, `resend-ip:${ip}`];
  if ((await tooMany(keys[0], 3, 60)) || (await tooMany(keys[1], 10, 60))) redirect('/dashboard?e=slow');
  for (const key of keys) await recordAttempt(key);

  const sent = await sendVerification(couple);
  redirect(sent ? '/dashboard?e=sent' : '/dashboard?e=mailfail');
}

export async function verifyEmail(formData) {
  const token = String(formData.get('t') ?? '');
  const ip = await clientIp();
  if (await tooMany(`verify-ip:${ip}`, 30, 15)) redirect('/verify?e=slow');
  await recordAttempt(`verify-ip:${ip}`);

  const coupleId = await consumeToken(token, 'verify');
  if (!coupleId) redirect('/verify?e=badlink');
  await query('update couples set email_verified_at = coalesce(email_verified_at, now()) where id = $1', [coupleId]);
  redirect('/login?e=verified');
}

export async function requestReset(formData) {
  const email = cleanText(formData.get('email'), 200).toLowerCase();
  if (!EMAIL.test(email)) redirect('/forgot?e=email');

  const ip = await clientIp();
  const keys = [`forgot:${email}`, `forgot-ip:${ip}`];
  if ((await tooMany(keys[0], 3, 60)) || (await tooMany(keys[1], 10, 60))) redirect('/forgot?e=slow');
  for (const key of keys) await recordAttempt(key);

  const { rows } = await query('select id, email from couples where email = $1', [email]);
  if (rows[0]) {
    const couple = rows[0];
    const base = await siteUrl();
    // Sent after the reply, so the page looks and feels the same whether the account exists or not.
    after(async () => {
      const token = await createToken(couple.id, 'reset', 30);
      await sendMail({
        to: couple.email,
        subject: 'Reset your password',
        text: `Someone asked to reset the password for this account. If it was you, open this link:\n\n${base}/reset?t=${token}\n\nThe link works once, for 30 minutes. If it was not you, ignore this email. Your password stays as it is.`,
      });
    });
  }
  redirect('/forgot?e=resetsent');
}

export async function resetPassword(formData) {
  const token = String(formData.get('t') ?? '');
  const password = String(formData.get('password') ?? '');
  if (password.length < 8 || password.length > 200) redirect(`/reset?t=${encodeURIComponent(token)}&e=password`);

  const ip = await clientIp();
  if (await tooMany(`reset-ip:${ip}`, 20, 15)) redirect('/forgot?e=slow');
  await recordAttempt(`reset-ip:${ip}`);

  // The password is checked first, so a typo does not burn the link.
  const coupleId = await consumeToken(token, 'reset');
  if (!coupleId) redirect('/reset?e=badlink');

  // Opening the link also proves the email is theirs. Changing the hash logs out every old session.
  await query(
    `update couples set password_hash = $1, email_verified_at = coalesce(email_verified_at, now()) where id = $2`,
    [hashPassword(password), coupleId]
  );
  await query(`delete from email_tokens where couple_id = $1`, [coupleId]);
  redirect('/login?e=resetdone');
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

  await startSession(rows[0].id, rows[0].password_hash);
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
  if (!couple.email_verified_at) redirect('/dashboard?e=verifyfirst');

  const existing = await weddingByCouple(couple.id);
  const back = existing ? '/dashboard/settings' : '/dashboard';
  const fail = (code) => redirect(`${back}?e=${code}`);

  const partnerOne = cleanText(formData.get('partner_one'), 60);
  const partnerTwo = cleanText(formData.get('partner_two'), 60);
  const rawDate = String(formData.get('wedding_date') ?? '');
  const weddingDate = isRealDate(rawDate) ? rawDate : null;
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
    // Every change is written to a history table, so a mistaken click can always be traced.
    await transaction(async (db) => {
      const { rows } = await db.query(
        `select f.status from gifts f join weddings w on w.id = f.wedding_id
          where f.id = $1 and w.couple_id = $2 for update of f`,
        [giftId, couple.id]
      );
      if (!rows[0] || rows[0].status === status) return;
      await db.query('update gifts set status = $1 where id = $2', [status, giftId]);
      await db.query(
        'insert into gift_status_events (gift_id, couple_id, old_status, new_status) values ($1, $2, $3, $4)',
        [giftId, couple.id, rows[0].status, status]
      );
    });
  }
  redirect('/dashboard#gifts');
}

export async function deleteAccount(formData) {
  const couple = await currentCouple();
  if (!couple) redirect('/login');
  const current = String(formData.get('current_password') ?? '');
  if (!current || !verifyPassword(current, couple.password_hash)) redirect('/dashboard/settings?e=current');
  if (String(formData.get('confirm') ?? '').trim().toLowerCase() !== 'delete') redirect('/dashboard/settings?e=confirmdelete');
  // Weddings, goals, gifts and history are removed with the account.
  await query('delete from couples where id = $1', [couple.id]);
  await endSession();
  redirect('/');
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

  // Tell the couple, so they do not have to keep refreshing the dashboard.
  const base = await siteUrl();
  const note = { name: guestName, amount, goalId };
  after(async () => {
    const { rows: found } = await query(
      `select c.email, g.title from weddings w join couples c on c.id = w.couple_id
         join goals g on g.id = $2 where w.id = $1`,
      [wedding.id, note.goalId]
    );
    if (!found[0]) return;
    await sendMail({
      to: found[0].email,
      subject: `${note.name} sent a gift of ${inr(note.amount)}`,
      text: `${note.name} says they paid ${inr(note.amount)} towards "${found[0].title}".\n\nCheck your bank or UPI app for the same amount, then confirm it here:\n${base}/dashboard#gifts\n\nUntil you confirm, it is not counted as received.`,
    });
  });

  redirect(`/gift/${rows[0].id}`);
}
