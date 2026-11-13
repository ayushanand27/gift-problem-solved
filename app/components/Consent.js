import Link from 'next/link';

export default function Consent() {
  return (
    <label className="check consent">
      <input type="checkbox" name="agree" required />
      <span>
        I have read and accept the <Link href="/privacy" target="_blank">Privacy Policy</Link> and the{' '}
        <Link href="/terms" target="_blank">Terms</Link>.
      </span>
    </label>
  );
}
