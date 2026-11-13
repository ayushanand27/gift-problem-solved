import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import 'lenis/dist/lenis.css';
import './globals.css';
import { isLoggedIn } from '@/lib/auth';
import { logout } from './actions';
import { SITE_NAME, TAGLINE } from '@/lib/site';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(base),
  openGraph: { siteName: SITE_NAME, type: 'website', title: `${SITE_NAME} · ${TAGLINE}`, description: 'Couples list what they really want. Guests gift by UPI straight to the couple and get a certificate.' },
  twitter: { card: 'summary_large_image' },
  title: { default: `${SITE_NAME} · ${TAGLINE}`, template: `%s · ${SITE_NAME}` },
  description: 'Couples list what they really want. Guests scan the QR on the wedding card, gift by UPI and get a certificate to carry on stage.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#FAF8F5' };

export default async function RootLayout({ children }) {
  const loggedIn = await isLoggedIn();
  return (
    <html lang="en">
      <body>
        <SmoothScroll>
          <Navbar brand={SITE_NAME} loggedIn={loggedIn} logoutAction={logout} />
          <main>{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
