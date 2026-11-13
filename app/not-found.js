import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="narrow center">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>Check the link or scan the QR on the wedding card again.</p>
      <p><Link href="/" className="btn">Go home</Link></p>
    </div>
  );
}
