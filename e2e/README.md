# Browser tests

End-to-end tests that drive a real browser through signup, email confirmation, password reset,
guest payment, certificates, confirmation, CSV export and account deletion.

They need Python with Playwright and Chrome, a Postgres database, and a fake mail server:

```
export E2E_DIR="$HOME/.shagun-e2e"   # optional, this is the default
mkdir -p "$E2E_DIR/mail" "$E2E_DIR/shots"
npm i --no-save smtp-server && node e2e/fake-smtp.cjs &
SMTP_HOST=127.0.0.1 SMTP_PORT=2525 MAIL_FROM="Test <t@test.local>" npx next start -p 3100 &
python3 e2e/accounts.py
python3 e2e/journey.py
```

Run each against an empty database. They are not part of CI because they need a browser.
