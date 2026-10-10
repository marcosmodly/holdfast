import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { cleanUpFailedAudio } from '@/lib/failed-audio-cleanup';

// Each retry is a transcription plus an extraction call. 60s is the most a
// Hobby function gets without Fluid compute.
export const maxDuration = 60;

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ?dryRun=1 reports what would happen to each recording without retrying
  // or deleting anything.
  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';

  try {
    const files = await cleanUpFailedAudio(Date.now(), dryRun);
    return NextResponse.json({ ok: true, dryRun, files });
  } catch (error) {
    console.error('Failed audio cleanup run failed:', error);
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
