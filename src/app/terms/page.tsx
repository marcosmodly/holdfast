import type { Metadata } from 'next';
import Link from 'next/link';
import legal from '@/app/legal.module.css';
import { LegalPage } from '@/components/legal-page';

// Limits quoted here live in lib/limits.ts (notes) and lib/nudges.ts
// (reminders). If they change, this page changes with them, and so does
// UPDATED.
const UPDATED = 'October 9, 2026';

export const metadata: Metadata = {
  title: 'Terms of Service | Holdfast',
  description:
    'The agreement for using Holdfast: who can use it, what it costs, what you must not do, and what to expect from an early, AI-based service.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <section className={legal.summary}>
        <h2>The short version</h2>
        <ul>
          <li>Holdfast is free while it’s in early access. You won’t be charged unless you choose a paid plan.</li>
          <li>Your notes are yours. We only use them to run Holdfast for you.</li>
          <li>AI can mishear a name or a date, and reminders can be late or missed. Don’t rely on Holdfast for anything important or urgent.</li>
          <li>Use it to remember the people in your life, never to watch, track or hurt anyone.</li>
        </ul>
      </section>

      <h2>This agreement</h2>
      <p>
        These terms are an agreement between you and Joshua Marcos, who runs Holdfast (“we”, “us”).
        They cover the Holdfast Telegram bot, the website at useholdfast.co, and the waitlist. By
        using any of them, you agree to these terms and to our{' '}
        <Link href="/privacy">Privacy Policy</Link>. If you don’t agree, please don’t use Holdfast.
      </p>

      <h2>Who can use Holdfast</h2>
      <ul>
        <li>You must be at least 16 years old.</li>
        <li>You need your own Telegram account, and you must follow Telegram’s own terms.</li>
        <li>Your Holdfast chat is for you alone. Keep your Telegram account secure, because anyone who can use it can use your Holdfast chat.</li>
      </ul>

      <h2>Early access</h2>
      <p>
        Holdfast is new and still changing. We let people in a few at a time, and features may
        change, break, or be removed while we learn what works. We’ll try to give you notice before
        removing anything you rely on, but we can’t promise Holdfast will always be available.
      </p>

      <h2>Price</h2>
      <p>
        Holdfast is free right now. If we introduce paid plans, we’ll tell you before anything
        changes, and you’ll never be charged unless you choose to pay.
      </p>

      <h2>Limits</h2>
      <p>
        To keep Holdfast running for everyone, voice notes can be up to 2 minutes long, you can send
        up to 15 notes in any 24 hours, and you’ll get at most 3 reminders a week. We may change
        these limits, and we may slow or pause use that puts the service at risk.
      </p>

      <h2>Your notes</h2>
      <p>
        You own what you record and what you tell Holdfast. You give us permission to store it,
        transcribe it, and pick out people, dates and promises from it, using the providers listed in
        our <Link href="/privacy">Privacy Policy</Link>, only to run Holdfast for you. That
        permission ends when your notes are deleted, except where the law requires us to keep
        something.
      </p>

      <h2>The people you talk about</h2>
      <p>
        Holdfast is for remembering things about the people in your own life. You’re responsible
        for what you record about other people. Only record what you have a fair reason to remember,
        and never use Holdfast to watch, track, harass or harm anyone.
      </p>

      <h2>Things you must not do</h2>
      <ul>
        <li>Break the law, or record anything illegal.</li>
        <li>Use Holdfast to stalk, harass, threaten or harm anyone.</li>
        <li>Use it for sales prospecting, marketing lists, or any other business outreach.</li>
        <li>Try to get around the limits, reach other people’s data, or break or overload the service.</li>
        <li>Copy, resell, or reverse engineer Holdfast, or access it with automated tools.</li>
      </ul>

      <h2>AI can get things wrong</h2>
      <p>
        Holdfast uses AI to turn your voice into text and to pick out names, dates and promises. It
        can mishear a name, get a date wrong, miss a promise, or invent one. Reminders can arrive
        late, arrive wrong, or not arrive at all.
      </p>
      <p>
        Holdfast is a helpful nudge, not a calendar, an assistant you can count on, or a source of
        advice. Don’t rely on it for anything where a wrong or missed reminder could cause harm, such
        as medical, legal, financial, safety or deadline-critical matters. Check anything important
        yourself.
      </p>

      <h2>Services Holdfast relies on</h2>
      <p>
        Holdfast runs on other companies’ services, including Telegram. We don’t control them, and
        they have their own terms. If one of them changes, fails, or stops supporting bots, parts of
        Holdfast may stop working.
      </p>

      <h2>Your ideas</h2>
      <p>
        If you send us feedback or ideas, we may use them to improve Holdfast without owing you
        anything for it. Thank you for sending them.
      </p>

      <h2>Stopping</h2>
      <p>
        You can stop using Holdfast at any time by blocking the bot in Telegram. To have your data
        deleted, email <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>.
      </p>
      <p>
        We may suspend or end your access if you break these terms, if it’s needed to protect other
        people or the service, or if we shut Holdfast down. If we shut it down, we’ll give you at
        least 30 days’ notice where we can, so you can ask for a copy of your data.
      </p>

      <h2>No warranty</h2>
      <p className={legal.conspicuous}>
        Holdfast is provided “as is” and “as available”. To the fullest extent the law allows, we
        make no warranties of any kind, express or implied, including that Holdfast will be
        accurate, reliable, uninterrupted, secure or fit for a particular purpose.
      </p>

      <h2>Limits on our liability</h2>
      <p className={legal.conspicuous}>
        To the fullest extent the law allows, we aren’t liable for any indirect, incidental,
        special, consequential or punitive damages, or for lost data, missed reminders, or harm to
        relationships, arising from your use of Holdfast. Our total liability for any claim about
        Holdfast is limited to the greater of US$50 or the amount you paid us in the 12 months
        before the claim.
      </p>
      <p>
        Some places don’t allow these limits. Where that’s the case, they apply only as far as the
        law allows.
      </p>

      <h2>If someone makes a claim because of how you used Holdfast</h2>
      <p>
        If someone makes a claim against us because you broke these terms or the law, or because of
        something you recorded, you agree to cover our reasonable costs of dealing with it,
        including legal fees.
      </p>

      <h2>Law and disputes</h2>
      <p>
        These terms are governed by the laws of the State of Delaware, United States, without regard
        to conflict of law rules. Any dispute will be handled in the state or federal courts located
        in Delaware.
      </p>
      <p>
        Before taking any formal step, please email us so we can try to sort it out together. Most
        problems can be fixed in a conversation. If you live in a country whose consumer laws give
        you rights that a contract can’t take away, nothing in these terms takes them away.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        If we change these terms, we’ll update the date at the top. If the change matters, we’ll tell
        you in the bot or by email at least 14 days before it takes effect. If you keep using
        Holdfast after that, you’re agreeing to the new terms.
      </p>

      <h2>The rest</h2>
      <p>
        These terms and the Privacy Policy are the whole agreement between us about Holdfast. If any
        part of them can’t be enforced, the rest still applies. If we don’t enforce a part right
        away, we haven’t given up the right to later. You can’t transfer these terms to someone else.
        We can transfer them if Holdfast moves to a company or someone takes it over, and these
        terms will still protect you.
      </p>

      <h2>Questions</h2>
      <p>
        Email <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>. A real person reads
        every message.
      </p>
    </LegalPage>
  );
}
