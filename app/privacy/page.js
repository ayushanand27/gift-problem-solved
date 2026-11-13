import Link from 'next/link';
import { OPERATOR, SITE_NAME, contactEmail } from '@/lib/site';
import LegalPage from '../components/LegalPage';

export const metadata = { title: 'Privacy Policy' };

export default function Privacy() {
  const contact = contactEmail();
  return (
    <LegalPage eyebrow="The fine print" title={<>Privacy <em>Policy</em></>}>
      <p>
        {SITE_NAME} is run by {OPERATOR} in India. This page says what we keep about you, why, who else sees it
        and how to have it removed. We have tried to keep it plain.
      </p>

      <h2>What we collect</h2>
      <h3>Couples</h3>
      <ul>
        <li>Your email address and a scrambled (hashed) version of your password. We cannot read your password.</li>
        <li>The names of the two partners, the wedding date if you give it, your goals and their target amounts.</li>
        <li>Your UPI ID, the account holder name and the smallest and largest gift you allow.</li>
        <li>The code printed on your card and the address of your page.</li>
      </ul>
      <h3>Guests</h3>
      <ul>
        <li>The name and the short message you type, the amount, the goal you chose and the 12-digit UPI reference number (UTR).</li>
        <li>Whether you chose to print the amount on your certificate.</li>
        <li>Your name, message, amount and UTR are visible to the couple. Other guests only see how much has been raised for each goal. They do not see names or amounts.</li>
      </ul>
      <h3>Everyone</h3>
      <ul>
        <li>A scrambled (hashed) form of your IP address and, when you log in or reset a password, of your email, kept for up to a day, only to slow down people who guess passwords or card codes.</li>
        <li>Two kinds of cookies, both needed for the site to work: a login cookie for couples (7 days) and a cookie that remembers a guest typed the right card code (1 day). We use no advertising or tracking cookies and no analytics.</li>
      </ul>

      <h2>Money</h2>
      <p>
        {SITE_NAME} never receives, holds or moves money. Guests pay the couple directly through their own UPI app.
        We never ask for a card number, bank login, UPI PIN or password to a bank. Anyone who asks for those in our name is not us.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To run the gift page, show the right amounts to the right people and make the certificate.</li>
        <li>To email you a confirmation link or a password reset link. We send no marketing email.</li>
        <li>To keep the site safe from abuse.</li>
      </ul>
      <p>We use it for nothing else. We do not sell it and we do not share it for advertising.</p>

      <h2>Who else handles it</h2>
      <ul>
        <li>Vercel hosts the website.</li>
        <li>Neon stores the database. The data sits in a data centre in Singapore, so it leaves India.</li>
        <li>An email provider delivers the confirmation and reset emails to you.</li>
        <li>Unsplash supplies the photos on the public pages. Your browser asks Unsplash for them, so Unsplash sees that request and your IP address.</li>
      </ul>
      <p>Those companies handle data only to provide their service to us. We may also share data if the law requires it.</p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and your gifts for as long as your account exists, so you can look at them after the wedding.
        You can delete your account yourself from the Edit page. That removes your page, goals and gift records. Guests can ask us to remove their entry. Login attempts are removed within a day. One-time email links stop working once used or expired, and only a scrambled version of them is stored.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask to see, correct or delete what we hold about you, as a couple or as a guest.
        {contact
          ? <> Write to <a href={`mailto:${contact}`}>{contact}</a> from the email address on the account, or give your name and the couple&apos;s names if you were a guest.</>
          : <> Reply to any email we sent you, or contact the person who runs this site.</>}
        {' '}We will answer within 30 days. We aim to follow India&apos;s Digital Personal Data Protection Act, 2023.
      </p>
      <p>
        If you are a guest and you do not want your name kept, do not submit a gift. You can still pay the couple with your UPI app.
      </p>

      <h2>Security</h2>
      <p>
        Passwords are hashed. Pages are served over HTTPS. Login cookies cannot be read by scripts on the page.
        Changing the UPI ID needs the password again. No system is perfectly safe, so please use a password you use nowhere else.
      </p>

      <h2>Children</h2>
      <p>The site is for adults. We do not knowingly collect data from children.</p>

      <h2>Changes</h2>
      <p>If this page changes in an important way, we will update the date at the top. See also the <Link href="/terms">Terms</Link>.</p>
    </LegalPage>
  );
}
