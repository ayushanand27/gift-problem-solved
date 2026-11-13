# ShagunGoals

A gift page for Indian weddings. The couple lists what they are really saving for (honeymoon, a loan, a car, their first child's education). Guests scan the QR on the wedding card, gift by UPI, and get a certificate to carry on stage.

## How it works

**Couple**

1. Create an account and set up the page: names, date, UPI ID, goals with targets, and the smallest and largest gift.
2. Get one QR and a 6-digit code to print on the wedding card.
3. See every gift on the dashboard. Match the UPI reference number (UTR) with the bank statement and mark it Received or Not received.

**Guest**

1. Scan the QR on the card and type the 6-digit code.
2. Pick a goal, enter an amount and a name.
3. Pay the couple's UPI ID by QR or by opening a UPI app.
4. Enter the 12-digit UTR and get a printable certificate.

Money goes straight from the guest's bank to the couple's bank. This site never holds it.

## One honest limit

A plain UPI payment does not tell any website that it happened. So the guest types the UTR, and the couple confirms it from their own bank statement. Until then the certificate says "Awaiting confirmation". The QR on each certificate opens its live status.

## Tech

- Next.js (App Router) and React
- PostgreSQL through the `pg` driver
- `qrcode` for QR images
- No payment gateway and no third-party scripts

## Run it on your computer

1. Install Node.js 20 or newer and have a Postgres database ready.
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `SESSION_SECRET`.
3. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000. Tables are created automatically on first use.

## Deploy

1. Create a free Postgres database (for example on Neon) and copy its connection string.
2. Import this repo in Vercel.
3. Add the environment variables `DATABASE_URL`, `SESSION_SECRET` and `SITE_URL` (your live address).
4. Deploy.

## Security

- Passwords are stored only as salted scrypt hashes.
- Login cookies are signed, HTTP-only and SameSite.
- A wedding page opens only with its random link and the 6-digit code from the card.
- Wrong codes, logins and gift entries are rate limited.
- Changing the UPI ID or account holder name needs the password again.
- Guests see only goal totals. Names, amounts and UTRs are visible only to the couple.
- One UTR can be used for only one gift.
- Every input is checked on the server, and all database queries use parameters.
- Security headers are set, including a Content Security Policy.
