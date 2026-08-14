'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { db } from '@/lib/instant-client';

function formatDate(ms: string | number | null | undefined): string | null {
  if (ms == null) return null;
  return new Date(Number(ms)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground">Nothing yet.</p>;
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();

  const { isLoading, error, data } = db.useQuery({
    people: {
      $: { where: { id } },
      facts: { $: { order: { serverCreatedAt: 'desc' } } },
      commitments: { $: { order: { serverCreatedAt: 'desc' } } },
      captures: { $: { order: { serverCreatedAt: 'desc' } } },
    },
  });

  if (isLoading) {
    return <main className="p-4 text-sm text-muted-foreground">Loading…</main>;
  }

  if (error) {
    return <main className="p-4 text-sm text-destructive">{error.message}</main>;
  }

  const person = data.people[0];

  if (!person) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
        <Link href="/people" className="text-sm text-muted-foreground hover:underline">
          ← People
        </Link>
        <p className="text-sm text-muted-foreground">Not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <Link href="/people" className="text-sm text-muted-foreground hover:underline">
          ← People
        </Link>
        <h1 className="text-lg font-semibold">{person.name}</h1>
        <p className="text-sm text-muted-foreground">
          Last talked: {formatDate(person.lastContactAt) ?? 'Never'} · every{' '}
          {person.cadenceDays}d
        </p>
      </div>

      <Section title="Commitments">
        {person.commitments.length === 0 && <Empty />}
        {person.commitments.map((commitment) => (
          <div key={commitment.id} className="rounded-lg border border-border p-3">
            <p>{commitment.description}</p>
            <p className="text-xs text-muted-foreground">
              {commitment.status}
              {commitment.dueDate != null && ` · due ${formatDate(commitment.dueDate)}`}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Facts">
        {person.facts.length === 0 && <Empty />}
        {person.facts.map((fact) => (
          <div key={fact.id} className="rounded-lg border border-border p-3">
            <p>{fact.content}</p>
            <p className="text-xs text-muted-foreground">
              {fact.type}
              {fact.eventDate != null && ` · ${formatDate(fact.eventDate)}`}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Captures">
        {person.captures.length === 0 && <Empty />}
        {person.captures.map((capture) => (
          <div key={capture.id} className="rounded-lg border border-border p-3">
            <p className="whitespace-pre-wrap">{capture.transcript}</p>
            <p className="text-xs text-muted-foreground">{formatDate(capture.createdAt)}</p>
          </div>
        ))}
      </Section>
    </main>
  );
}
