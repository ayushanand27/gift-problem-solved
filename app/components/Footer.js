import Link from 'next/link';
import { SITE_NAME } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="footer no-print">
      <div className="footer-top">
        <div>
          <p className="eyebrow">The promise</p>
          <p className="footer-note">
            Every gift travels straight from your guest&apos;s bank to yours. {SITE_NAME} never holds a rupee.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow">Explore</p>
          <Link href="/#idea">The Idea</Link>
          <Link href="/#unfolds">How it Unfolds</Link>
          <Link href="/#goals">Goals</Link>
        </nav>
        <nav aria-label="Account links">
          <p className="eyebrow">Couples</p>
          <Link href="/signup">Begin your page</Link>
          <Link href="/login">Log in</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <nav aria-label="Legal">
          <p className="eyebrow">Fine print</p>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <p className="footer-wordmark" aria-hidden="true">{SITE_NAME}</p>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} {SITE_NAME}</span>
        <span>Made in India, for Indian weddings</span>
      </div>
    </footer>
  );
}
