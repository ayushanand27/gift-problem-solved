import Link from 'next/link';
import './globals.css';
import { isLoggedIn } from '@/lib/auth';
import { logout } from './actions';
import { SITE_NAME, TAGLINE } from '@/lib/site';

export const metadata = {
  title: { default: `${SITE_NAME} · ${TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: 'Couples list what they really want. Guests scan the QR on the wedding card, gift by UPI and get a certificate to carry on stage.',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const loggedIn = await isLoggedIn();
  return (
    <html lang="en">
      <body>
        <header className="site-header no-print">
          <Link href="/" className="brand">{SITE_NAME}</Link>
          <nav>
            {loggedIn ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <form action={logout}><button className="link">Log out</button></form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/signup" className="btn small">Create a gift page</Link>
              </>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer no-print">
          Money goes straight from the guest&apos;s bank to the couple&apos;s bank. {SITE_NAME} never holds it.
        </footer>
      </body>
    </html>
  );
}
