import { NextRequest, NextResponse } from 'next/server';
import { runNudgeEngine } from '@/lib/nudges';

const HOLDFAST_CRON_SECRET = process.env.HOLDFAST_CRON_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

// Vercel's cron scheduler sends `Authorization: Bearer $CRON_SECRET` and
// cannot be configured to send a custom header. `x-holdfast-cron-secret` is
// kept alongside it for manual testing (curl, etc.) without deploying.
function isAuthorized(request: NextRequest): boolean {
  const bearer = request.headers.get('authorization');
  if (CRON_SECRET && bearer === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  const provided = request.headers.get('x-holdfast-cron-secret');
  if (HOLDFAST_CRON_SECRET && provided === HOLDFAST_CRON_SECRET) {
    return true;
  }

  return false;
}

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const sent = await runNudgeEngine();
    return NextResponse.json({ ok: true, sent: sent.length, nudges: sent });
  } catch (error) {
    console.error('Nudge engine run failed:', error);
    return NextResponse.json({ ok: false, error: 'internal error' }, { status: 500 });
  }
}

// GET so Vercel's cron scheduler can trigger it; POST so it can be triggered
// manually the same way (e.g. curl) without waiting for the schedule.
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
