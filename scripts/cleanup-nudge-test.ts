// Removes everything scripts/seed-nudge-test.ts created, using the manifest
// it wrote. Deletes nudges explicitly first (the person->nudge link has no
// cascade); commitments/facts cascade-delete when their person is deleted.
//
// Run via `npm run cleanup:nudges` (loads .env.local via `tsx --env-file`).
import { existsSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';
import { db } from '../src/lib/instant-admin';

const MANIFEST_PATH = path.resolve(__dirname, '.nudge-test-manifest.json');

interface Manifest {
  profileId: string;
  personIds: string[];
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.log('No manifest found — nothing to clean up.');
    return;
  }

  const { personIds } = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest;

  if (personIds.length === 0) {
    unlinkSync(MANIFEST_PATH);
    console.log('Manifest had no people — nothing to clean up.');
    return;
  }

  const { nudges } = await db.query({
    nudges: { $: { where: { 'person.id': { $in: personIds } } } },
  });

  await db.transact([
    ...nudges.map((nudge) => db.tx.nudges[nudge.id].delete()),
    ...personIds.map((personId) => db.tx.people[personId].delete()),
  ]);

  unlinkSync(MANIFEST_PATH);
  console.log(
    `Deleted ${nudges.length} nudge(s) and ${personIds.length} test people (their commitments/facts cascaded away).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
