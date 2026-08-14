// Seeds nudge-eligible data against your real profile so /api/cron/nudges can
// be exercised without waiting for real commitments/facts/drift to accrue.
//
// Creates:
//   - "Marco"  : an overdue open commitment (priority 1) AND a fact dated
//                yesterday (priority 2) — two candidates on one person.
//   - "Ana"    : lastContactAt backdated 90 days, cadenceDays 30 (priority 3,
//                the oldest drift candidate — should win the last cap slot).
//   - 8 extra drift people, backdated less than Ana, to push the eligible
//     count past 3 and prove the rolling-window cap drops the rest.
//
// Total eligible candidates: 11. Run `npm run cleanup:nudges` afterwards to
// remove everything this script created.
//
// Run via `npm run seed:nudges` (loads .env.local via `tsx --env-file`).
import { writeFileSync } from 'fs';
import path from 'path';
import { id } from '@instantdb/admin';
import { db } from '../src/lib/instant-admin';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MANIFEST_PATH = path.resolve(__dirname, '.nudge-test-manifest.json');

function daysAgo(days: number): number {
  return Date.now() - days * MS_PER_DAY;
}

async function findRealProfile(): Promise<{ id: string; telegramChatId?: string }> {
  const { profiles } = await db.query({ profiles: {} });
  if (profiles.length === 0) {
    throw new Error(
      'No profile found. Send at least one voice note to the bot first so a real profile exists.',
    );
  }
  return profiles[0];
}

async function main() {
  const profile = await findRealProfile();
  console.log(
    `Seeding against profile ${profile.id} (chat ${profile.telegramChatId ?? 'unknown'})`,
  );

  const personIds: string[] = [];
  const chunks = [];

  // Priority 1 + 2: one person carrying both an overdue commitment and a
  // fact dated yesterday.
  const marcoId = id();
  personIds.push(marcoId);
  chunks.push(
    db.tx.people[marcoId]
      .create({ name: 'Marco', tier: 'good', cadenceDays: 45 })
      .link({ profile: profile.id }),
    db.tx.commitments[id()]
      .create({
        description: 'send Marco a recruiter contact',
        dueDate: daysAgo(3),
        status: 'open',
      })
      .link({ person: marcoId }),
    db.tx.facts[id()]
      .create({
        type: 'life_event',
        content: 'mum had surgery',
        eventDate: daysAgo(1),
        confidence: 0.95,
      })
      .link({ person: marcoId }),
  );

  // Priority 3: the oldest drift candidate — should claim the third slot.
  const anaId = id();
  personIds.push(anaId);
  chunks.push(
    db.tx.people[anaId]
      .create({ name: 'Ana', tier: 'good', cadenceDays: 30, lastContactAt: daysAgo(90) })
      .link({ profile: profile.id }),
  );

  // 8 extra drift candidates, all more recently contacted than Ana, so they
  // stay eligible but lose the age-descending tiebreak and get dropped by
  // the cap.
  const extraBackdates = [20, 25, 30, 35, 40, 45, 50, 55];
  for (const daysBack of extraBackdates) {
    const personId = id();
    personIds.push(personId);
    chunks.push(
      db.tx.people[personId]
        .create({
          name: `Nudge Test Extra ${daysBack}d`,
          tier: 'good',
          cadenceDays: 14,
          lastContactAt: daysAgo(daysBack),
        })
        .link({ profile: profile.id }),
    );
  }

  await db.transact(chunks);
  writeFileSync(MANIFEST_PATH, JSON.stringify({ profileId: profile.id, personIds }, null, 2));

  console.log(`Created ${personIds.length} people, 11 eligible nudge candidates:`);
  console.log('  priority 1 - Marco: overdue commitment (3 days late)');
  console.log('  priority 2 - Marco: fact dated yesterday');
  console.log('  priority 3 - Ana + 8 extras: drift (Ana is oldest at 90 days, should win)');
  console.log(`Manifest written to ${MANIFEST_PATH}`);
  console.log('\nTrigger the engine with:');
  console.log(
    '  curl -X POST http://localhost:3000/api/cron/nudges -H "x-holdfast-cron-secret: $HOLDFAST_CRON_SECRET"',
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
