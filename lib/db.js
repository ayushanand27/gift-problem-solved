import { Pool } from 'pg';

// All tables are created automatically the first time the app talks to the database.
const SCHEMA = `
create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists weddings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references couples(id) on delete cascade,
  slug text not null unique,
  card_code text not null,
  partner_one text not null,
  partner_two text not null,
  wedding_date date,
  upi_id text not null,
  payee_name text not null,
  min_amount integer not null check (min_amount >= 1),
  max_amount integer not null check (max_amount >= min_amount),
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  title text not null,
  target_amount integer not null check (target_amount > 0),
  position integer not null default 0
);

create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  goal_id uuid not null references goals(id),
  guest_name text not null,
  message text not null default '',
  amount integer not null check (amount > 0),
  utr text not null,
  show_amount boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (wedding_id, utr)
);

do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_name = 'couples' and column_name = 'email_verified_at') then
    alter table couples add column email_verified_at timestamptz;
    -- Accounts made before email checks existed are treated as already confirmed.
    update couples set email_verified_at = now();
  end if;
end $$;

alter table gifts add column if not exists cert_key text;
update gifts set cert_key = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') where cert_key is null;

create table if not exists email_tokens (
  hash text primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  kind text not null check (kind in ('verify', 'reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_tokens_couple on email_tokens (couple_id, kind);

create table if not exists gift_status_events (
  id bigserial primary key,
  gift_id uuid not null references gifts(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  old_status text not null,
  new_status text not null,
  at timestamptz not null default now()
);
create index if not exists gift_status_events_gift on gift_status_events (gift_id, at);

create table if not exists attempts (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists attempts_key_at on attempts (key, at);
alter table attempts add column if not exists id bigserial;
`;

const g = globalThis;

function pool() {
  if (!g.__giftPool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    g.__giftPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return g.__giftPool;
}

function ensureSchema() {
  if (!g.__giftSchema) {
    g.__giftSchema = (async () => {
      const client = await pool().connect();
      try {
        // The lock stops two servers from creating the tables at the same moment.
        await client.query('select pg_advisory_lock(7411)');
        await client.query(SCHEMA);
      } finally {
        await client.query('select pg_advisory_unlock(7411)').catch(() => {});
        client.release();
      }
    })().catch((err) => {
      g.__giftSchema = null;
      throw err;
    });
  }
  return g.__giftSchema;
}

export async function query(text, params) {
  await ensureSchema();
  return pool().query(text, params);
}

// Runs several queries as one unit: either all of them are saved or none.
export async function transaction(fn) {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
