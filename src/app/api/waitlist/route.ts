import { NextRequest, NextResponse, after } from 'next/server';
import { id } from '@instantdb/admin';
import { db } from '@/lib/instant-admin';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/waitlist-emails';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

interface WaitlistBody {
  email?: unknown;
  source?: unknown;
  website?: unknown;
}

const OK_RESPONSE = { ok: true };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WaitlistBody;

    // Honeypot: hidden from humans by CSS. Any value means a bot filled it
    // in — pretend success and write nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json(OK_RESPONSE);
    }

    if (typeof body.email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    if (email.length === 0 || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
    }

    const source = typeof body.source === 'string' && body.source.trim() !== ''
      ? body.source.trim()
      : undefined;

    // Instant has no upsert — query first so a repeat signup never creates a
    // second row, and never reveal whether the address was already on the list.
    const { waitlist } = await db.query({
      waitlist: { $: { where: { email } } },
    });

    if (waitlist.length === 0) {
      await db.transact(
        db.tx.waitlist[id()].create({
          email,
          createdAt: Date.now(),
          ...(source ? { source } : {}),
        }),
      );

      // Only a new row gets the welcome email, so a repeat signup never sends
      // a second one. after() runs it once the response is out, and a failed
      // send never fails the signup.
      after(async () => {
        try {
          await sendEmail(welcomeEmail(email));
        } catch (error) {
          console.error('Waitlist welcome email failed:', error);
        }
      });
    }

    return NextResponse.json(OK_RESPONSE);
  } catch (error) {
    console.error('Waitlist signup failed:', error);
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
