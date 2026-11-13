import Link from 'next/link';
import { OPERATOR, SITE_NAME, contactEmail } from '@/lib/site';
import LegalPage from '../components/LegalPage';

export const metadata = { title: 'Terms of Use' };

export default function Terms() {
  const contact = contactEmail();
  return (
    <LegalPage eyebrow="The fine print" title={<>Terms <em>of Use</em></>}>
      <p>
        These terms cover your use of {SITE_NAME}, run by {OPERATOR} in India. By making an account or sending a gift
        through the site you agree to them. Our <Link href="/privacy">Privacy Policy</Link> is part of these terms.
      </p>

      <h2>What the site does</h2>
      <p>
        {SITE_NAME} lets a couple list goals and show a UPI ID and QR code. Guests pay the couple directly with their own UPI app,
        then type the UPI reference number to get a certificate. That is all it does.
      </p>
      <ul>
        <li><strong>We do not handle money.</strong> We are not a bank, a payment company or a payment gateway. Every payment is a private transfer between the guest and the couple.</li>
        <li><strong>We cannot check a payment.</strong> The reference number is typed by the guest. A certificate says “Awaiting confirmation” until the couple marks the gift as received. Only the couple can say whether the money arrived.</li>
        <li>We cannot reverse, refund or trace a payment. Problems with a payment go to the guest&apos;s bank or UPI app.</li>
      </ul>

      <h2>If you are a couple</h2>
      <ul>
        <li>You must be an adult and the UPI ID you enter must belong to you.</li>
        <li>You are responsible for typing the UPI ID correctly. A wrong ID sends your guests&apos; money to someone else, and we cannot get it back.</li>
        <li>Check each gift against your bank or UPI app before marking it received.</li>
        <li>Keep your password private. Anything done while logged in to your account is treated as done by you.</li>
        <li>Your guests will see the names and goals you enter. Use only information you are happy to show them.</li>
      </ul>

      <h2>If you are a guest</h2>
      <ul>
        <li>Check the account holder name shown on the payment page matches the couple before you pay.</li>
        <li>Enter the real UTR of your own payment. A made-up or reused number is not allowed and may be reported.</li>
        <li>Pay only through the QR or link on the couple&apos;s page. Never share your UPI PIN with anyone.</li>
      </ul>

      <h2>What you must not do</h2>
      <ul>
        <li>Use the site to cheat or defraud anyone, collect money under a false story or impersonate another person.</li>
        <li>Put in someone else&apos;s UPI ID, or another person&apos;s details without their permission.</li>
        <li>Post abusive, unlawful or misleading messages.</li>
        <li>Try to break into, overload or scrape the site, or guess other people&apos;s codes or passwords.</li>
      </ul>
      <p>We may remove content, switch off a page or close an account that breaks these rules. We may also share details with the authorities where the law asks us to.</p>

      <h2>No promises about the service</h2>
      <p>
        The site is provided as it is. It may be slow, change or stop working, and we do not promise it will be available on your wedding day.
        Keep a copy of your QR code and keep your own record of who gave what.
      </p>

      <h2>Our responsibility</h2>
      <p>
        As far as the law allows, we are not responsible for lost or misdirected payments, for gifts that were never made,
        for a guest or couple who acts dishonestly, or for any indirect loss. Where the law does not allow us to exclude
        responsibility, it is limited to ₹1,000. Nothing here removes rights you have under Indian consumer law that cannot be waived.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you enter. You allow us to store and show it as the site needs to, for example showing a guest&apos;s
        message to the couple and printing it on the certificate.
      </p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms. The date at the top shows when. If you keep using the site after a change, you accept it.
        These terms follow the laws of India and disputes go to the courts in India.
      </p>

      <h2>Contact</h2>
      <p>
        {contact
          ? <>Questions or complaints: <a href={`mailto:${contact}`}>{contact}</a>.</>
          : <>Questions or complaints: reply to any email we sent you.</>}
      </p>
    </LegalPage>
  );
}
