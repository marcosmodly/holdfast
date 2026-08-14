'use client';

import Link from 'next/link';
import { db, PROFILE_ID } from '@/lib/instant-client';

function formatDate(ms: string | number | null | undefined): string | null {
  if (ms == null) return null;
  return new Date(Number(ms)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function PeoplePage() {
  const { isLoading, error, data } = db.useQuery({
    people: {
      $: { where: { 'profile.id': PROFILE_ID }, order: { name: 'asc' } },
      commitments: {},
    },
  });

  if (isLoading) {
    return <main className="p-4 text-sm text-muted-foreground">Loading…</main>;
  }

  if (error) {
    return <main className="p-4 text-sm text-destructive">{error.message}</main>;
  }

  const people = data.people;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">People</h1>

      {people.length === 0 && (
        <p className="text-sm text-muted-foreground">No one yet.</p>
      )}

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
        {people.map((person) => {
          const openCount = person.commitments.filter((c) => c.status === 'open').length;
          const lastContact = formatDate(person.lastContactAt);

          return (
            <li key={person.id}>
              <Link
                href={`/people/${person.id}`}
                className="flex items-center justify-between gap-3 p-3 hover:bg-muted"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{person.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Last talked: {lastContact ?? 'Never'}
                  </span>
                </div>
                {openCount > 0 && (
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {openCount} open
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
