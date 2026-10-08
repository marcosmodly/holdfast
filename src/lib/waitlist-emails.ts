import { createHash } from 'node:crypto';
import type { Email } from '@/lib/email';

// Copy for emails sent to waitlist signups. Written in Joshua's voice: short
// paragraphs, no lists, no em dashes, no exclamation marks. The CLAUDE.md
// copy rules apply here too (it's user-facing text).

export const WELCOME_SUBJECT = "you're on the list";

export const WELCOME_TEXT = `Hi,

Thanks for joining the Holdfast waitlist, that means a lot this early on.

I'm Joshua, I build Holdfast, a Telegram bot that turns a short voice note about someone you care about into reminders at the moments that matter.

I'm letting people in a few at a time so I can keep a close eye on how it is working. When your spot opens, I'll email you a link that starts the bot in Telegram, and from there your first voice note is all it takes.

You will need Telegram on your phone. If you do not have it yet, that's the one thing worth doing before then, it's free here:
https://telegram.org/apps

If you didn't sign up for this, or you'd rather not hear from me, just reply and I'll take you off the list.

Joshua
Holdfast`;

// Keyed on a hash of the address: stable across a double submit, and well
// under Resend's 256-character key limit even for a 254-character email.
export function welcomeEmail(to: string): Email {
  const hash = createHash('sha256').update(to).digest('hex').slice(0, 32);
  return {
    to,
    subject: WELCOME_SUBJECT,
    text: WELCOME_TEXT,
    idempotencyKey: `waitlist-welcome-${hash}`,
  };
}
