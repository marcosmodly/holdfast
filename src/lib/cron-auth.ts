import type { NextRequest } from 'next/server';

const HOLDFAST_CRON_SECRET = process.env.HOLDFAST_CRON_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

// Shared by every route under /api/cron.
// Vercel's cron scheduler sends `Authorization: Bearer $CRON_SECRET` and
// cannot be configured to send a custom header. `x-holdfast-cron-secret` is
// kept alongside it for manual testing (curl, etc.) without deploying.
export function isCronAuthorized(request: NextRequest): boolean {
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
