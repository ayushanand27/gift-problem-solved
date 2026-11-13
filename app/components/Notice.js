import { MESSAGES } from '@/lib/messages';

export default function Notice({ code }) {
  const text = MESSAGES[code];
  if (!text) return null;
  return (
    <p className={code === 'saved' ? 'notice ok' : 'notice'} role="status">
      {text}
    </p>
  );
}
