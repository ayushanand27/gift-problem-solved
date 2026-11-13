import { headers } from 'next/headers';
import { isIP } from 'node:net';

// On Vercel the platform writes x-vercel-forwarded-for itself, so a visitor cannot fake it.
// Elsewhere (your own laptop or server) the proxy headers are used, and they are only as honest as that proxy.
export async function clientIp() {
  const h = await headers();
  const raw = process.env.VERCEL
    ? h.get('x-vercel-forwarded-for')
    : h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0];
  const ip = String(raw || '').split(',')[0].trim();
  return isIP(ip) ? ip : 'unknown';
}
