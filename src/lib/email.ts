// Transactional email through Resend's REST API (plain fetch, same style as
// lib/telegram.ts). Inert until HOLDFAST_RESEND_API_KEY and
// HOLDFAST_EMAIL_FROM are set: it logs and skips, so deploying before the
// Resend account and domain are ready is safe.

const RESEND_API_KEY = process.env.HOLDFAST_RESEND_API_KEY;
const EMAIL_FROM = process.env.HOLDFAST_EMAIL_FROM;
const EMAIL_REPLY_TO = process.env.HOLDFAST_EMAIL_REPLY_TO;

export interface Email {
  to: string;
  subject: string;
  text: string;
  // Resend drops a repeat send with the same key within 24 hours, which
  // covers a double-submitted signup racing past the waitlist dedupe query.
  idempotencyKey: string;
}

// Returns false when email isn't configured. Throws on a failed send.
// Never logs the recipient address.
export async function sendEmail(email: Email): Promise<boolean> {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.warn(`Email not configured, skipped: "${email.subject}"`);
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': email.idempotencyKey,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email.to,
      subject: email.subject,
      text: email.text,
      ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  }
  return true;
}
