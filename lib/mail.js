import nodemailer from 'nodemailer';
import { SITE_NAME } from './site';

const g = globalThis;

function transport() {
  if (!process.env.SMTP_HOST) return null;
  if (!g.__giftMail) {
    const port = Number(process.env.SMTP_PORT || 465);
    g.__giftMail = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return g.__giftMail;
}

// Returns true when the mail was handed to the mail server.
export async function sendMail({ to, subject, text }) {
  const t = transport();
  if (!t) {
    console.error(`[mail] SMTP_HOST is not set, so this email was not sent: "${subject}"`);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || `${SITE_NAME} <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: `${text}\n\n—\n${SITE_NAME}`,
    });
    return true;
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return false;
  }
}
