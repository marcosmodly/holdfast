import type { Metadata } from 'next';
import legal from '@/app/legal.module.css';
import { LegalPage } from '@/components/legal-page';
import { currentAiDataPolicy } from '@/lib/ai-data-policy';

// Every claim here must match what the code does today: audio handling in
// api/telegram/webhook/route.ts and lib/failed-audio.ts (the 2-day deletion
// window for recordings that fail), stored fields in instant.schema.ts, the
// providers in lib/ai-provider.ts and lib/email.ts. If the code changes, this
// page changes with it, and so does UPDATED.
const UPDATED = 'October 10, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy | Holdfast',
  description:
    'What Holdfast collects when you send a voice note, who helps run it, how long it is kept, and how to get a copy or have it deleted.',
};

export default function PrivacyPage() {
  // Names the AI service actually in use (see lib/ai-data-policy.ts).
  const ai = currentAiDataPolicy();

  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <section className={legal.summary}>
        <h2>The short version</h2>
        <ul>
          <li>Holdfast uses what you tell it for one thing: reminding you about the people you care about.</li>
          <li>
            Your voice recording is deleted as soon as it has been turned into text, or within 2
            days if it can’t be.
          </li>
          <li>We don’t sell your data, show you ads, or use it to train AI models.</li>
          <li>You can ask for a copy of your data, or have all of it deleted, at any time.</li>
        </ul>
      </section>

      <h2>Who runs Holdfast</h2>
      <p>
        Holdfast is a Telegram bot that turns a short voice note about someone you care about into
        reminders at the moments that matter. It is run by Joshua Marcos, as an individual (“we”,
        “us”).
      </p>
      <p>
        This policy covers the Holdfast bot, the website at useholdfast.co, and the emails we send.
        If anything here is unclear, email{' '}
        <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>If you join the waitlist:</strong> your email address, the date you signed up, which
        link brought you (for example a TikTok link), and the date we send you an invite.
      </p>
      <p>
        <strong>If you use the bot:</strong>
      </p>
      <ul>
        <li>
          Your Telegram chat ID, which is how we know which notes are yours and where to send
          reminders. We don’t store your Telegram name, username or phone number.
        </li>
        <li>Your voice notes, only while they are being turned into text (see below).</li>
        <li>The text of each note.</li>
        <li>
          What Holdfast picks out of each note: the name of the person you talked about, what’s
          happening in their life and when, the things you said you’d do and by when, and the
          overall mood of the note.
        </li>
        <li>
          The reminders we send you and whether you acted on them. When you reply to a reminder with
          something like “done” or “later”, we update the reminder. We don’t keep the reply itself,
          and it isn’t sent to any AI service.
        </li>
        <li>Your plan and the dates of your free trial.</li>
      </ul>
      <p>
        <strong>If you email us:</strong> your email address and what you write.
      </p>
      <p>
        <strong>When you visit the website:</strong> Vercel, which hosts the site, keeps standard
        request logs, such as IP address and browser type, for a short time to keep the site running
        and secure. The website doesn’t use cookies, analytics or ad trackers.
      </p>
      <p>
        We never ask for your address book, your location, or access to your other Telegram chats.
      </p>

      <h2>What happens to a voice note</h2>
      <ol>
        <li>Telegram passes your voice note to Holdfast.</li>
        <li>
          We check that it’s under 2 minutes and that you haven’t reached the daily limit. If it’s
          over, we tell you, and nothing is downloaded or stored.
        </li>
        <li>We save the recording in our storage and send it to {ai.name}, which turns it into text.</li>
        <li>
          As soon as the text is saved, we delete the recording. Your own copy stays in your Telegram
          chat.
        </li>
        <li>
          We send the text to {ai.name}, which picks out the people, dates and promises. We save what
          it finds and reply to tell you what was saved.
        </li>
      </ol>
      <p>
        If a recording can’t be turned into text after two tries, we tell you. Later, we try once
        more, unless you’ve sent another voice note since. If that works, we save the text and tell
        you what was saved. Either way, the recording is deleted within 2 days of when you sent it.
      </p>
      <p>
        {ai.policy}{' '}
        <a href={ai.dataPolicyUrl} target="_blank" rel="noopener noreferrer">
          Read {ai.name}’s data policy
        </a>
        .
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To run Holdfast: turn your notes into text, remember what you told it, and send reminders.</li>
        <li>To keep it working and fair: apply the usage limits, fix problems, and prevent abuse.</li>
        <li>To email you about the waitlist and your invite. We only ever email you about Holdfast.</li>
      </ul>
      <p>
        We don’t sell your information, share it for advertising, or use it to train AI models. We
        don’t read through your notes. We may look at a specific note when we need to fix a problem
        with it, or when the law requires it.
      </p>

      <h2>Who else handles it</h2>
      <p>
        A few companies help us run Holdfast. Each one only gets what it needs to do its job.
      </p>
      <ul>
        <li>
          <strong>Telegram</strong> carries your messages and voice notes between you and Holdfast.{' '}
          <a href="https://telegram.org/privacy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
        <li>
          <strong>InstantDB</strong> is our database and file storage, where your notes and the
          temporary recordings are kept.{' '}
          <a href="https://www.instantdb.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
        <li>
          <strong>{ai.name}</strong> turns recordings into text and picks out the people, dates and
          promises.{' '}
          <a href={ai.privacyUrl} target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
        <li>
          <strong>Vercel</strong> hosts the website and the bot, and keeps short-lived logs.{' '}
          <a href="https://vercel.com/legal/privacy-notice" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
        <li>
          <strong>Resend</strong> sends our emails.{' '}
          <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
        <li>
          <strong>ImprovMX</strong> forwards email sent to hello@useholdfast.co to our inbox.{' '}
          <a href="https://improvmx.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy policy
          </a>
        </li>
      </ul>
      <p>
        These companies are mostly based in the United States, so your information is stored and
        processed there.
      </p>
      <p>
        We may also share information if the law requires it, or if it’s needed to protect someone’s
        safety. If Holdfast is ever moved to a company or taken over, your information would move
        with it, and this policy would still apply to it.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          <strong>Recordings:</strong> deleted as soon as the text is saved. A recording that can’t
          be turned into text is deleted within 2 days.
        </li>
        <li>
          <strong>Notes, people and reminders:</strong> for as long as you use Holdfast. If you ask
          us to delete them, we do it within 30 days.
        </li>
        <li>
          <strong>Waitlist emails:</strong> until you start using Holdfast or ask to be taken off
          the list.
        </li>
        <li>
          <strong>Emails you send us:</strong> as long as we need them to answer you and keep a
          record.
        </li>
        <li>
          <strong>Logs:</strong> Vercel keeps them for a short time. When something goes wrong, an
          error log can include part of a note.
        </li>
      </ul>

      <h2>The people you talk about</h2>
      <p>
        Your notes are about other people, who haven’t signed up for Holdfast. We use what you say
        about them only to remind you. We never message them, look them up, or combine what you said
        with information from anywhere else.
      </p>
      <p>
        Please be thoughtful about what you record. Say what you need to remember, and leave out
        anything someone told you in confidence that you wouldn’t want written down.
      </p>
      <p>
        If you think Holdfast holds information about you because someone mentioned you, email us.
        Notes are stored under the person who recorded them, usually with just a first name, so we
        may not be able to find them. We’ll do what we reasonably can.
      </p>

      <h2>Your rights</h2>
      <p>Wherever you live, you can ask us to:</p>
      <ul>
        <li>send you a copy of your data</li>
        <li>correct something that’s wrong</li>
        <li>delete your data, or just part of it</li>
        <li>take you off the waitlist or stop emailing you</li>
      </ul>
      <p>
        Email <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>. We’ll answer within 30
        days, and we may ask you to confirm it’s you first. Blocking the bot in Telegram stops the
        reminders, but it doesn’t delete your data. To delete it, email us.
      </p>
      <p>
        <strong>If you live in California:</strong> the California Consumer Privacy Act gives you the
        right to know what we collect, to delete it, to correct it, and to opt out of its sale or
        sharing. We don’t sell or share personal information as that law defines it, and we won’t
        treat you differently for using any of these rights.
      </p>
      <p>
        <strong>If you live in the EU or UK:</strong> we use your information to run Holdfast for
        you (performing our agreement with you), to keep it secure and working (our legitimate
        interests), and to email you about the waitlist (your consent, which you can withdraw at any
        time). Your information is transferred to the United States, where our providers are. You
        can also complain to your local data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        Holdfast isn’t for anyone under 16. If we learn that someone under 16 is using it, we’ll
        delete their data.
      </p>

      <h2>Security</h2>
      <p>
        Our database can only be reached by Holdfast’s own server, data travels over encrypted
        connections, and only Joshua has admin access. No system is perfectly secure. If a breach
        affects your data, we’ll tell you as soon as we can.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we’ll update the date at the top. If the change matters, like
        collecting a new kind of information or a new company handling your notes, we’ll tell you in
        the bot or by email before it takes effect.
      </p>

      <h2>Questions</h2>
      <p>
        Email <a href="mailto:hello@useholdfast.co">hello@useholdfast.co</a>. A real person reads
        every message.
      </p>
    </LegalPage>
  );
}
