import { ImageResponse } from 'next/og';

export const alt = 'ShagunGoals: gift the couple what they actually want';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 90, background: '#FAF8F5', color: '#2B2420' }}>
        <div style={{ fontSize: 34, letterSpacing: 6, color: '#B08A4A', textTransform: 'uppercase' }}>ShagunGoals</div>
        <div style={{ fontSize: 88, lineHeight: 1.1, marginTop: 28, fontFamily: 'serif' }}>Gift the couple what they actually want.</div>
        <div style={{ fontSize: 36, marginTop: 36, color: '#6B5E55' }}>Scan the QR on the card. Pay by UPI. Get a certificate.</div>
      </div>
    ),
    size
  );
}
