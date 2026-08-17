# Holdfast

## What this is

A voice-first memory for close relationships. After seeing someone they care
about, the user talks for ~20 seconds into a Telegram bot. We transcribe it,
extract who they saw, what's happening in that person's life, and what the user
promised to do, then remind them at the moment it matters.

Not a CRM. Never use the words "contact", "lead", "pipeline" or "manage" in UI
copy. The register is "remember what matters to the people you love."

## Stack — locked, do not substitute

- Next.js App Router + TypeScript
- InstantDB (`@instantdb/admin` server-side, `@instantdb/react` client)
- Vercel (hosting + cron)
- Tailwind + shadcn/ui
- Telegram Bot API for capture and delivery
- OpenAI `gpt-4o-mini-transcribe` for speech-to-text

## Non-negotiables

1. **Delete the audio after a transcript is persisted.** We store text, never
   audio. Cost and privacy both. Never add an "audio history" feature.
2. **Maximum 3 nudges per user per rolling 7 days.** Rank and drop the rest.
   Over-nudging kills this product. A muted app is a dead app.
3. **Commitments are only things the USER said THEY would do.** Not things the
   other person will do. This distinction is the core of the product.
4. **The admin token is a master key.** Server-side only, never in client code.
5. **Instant storage permissions are disabled by default.** Any storage work
   must include rules in `instant.perms.ts` or uploads silently fail.
6. **Instant has no upsert.** Always query before create, or you get duplicates.
7. **Always return 200 to Telegram**, even on internal failure. Log the error
   separately. A non-200 makes Telegram retry the same update forever.
8. **Storage perms are currently unscoped** — `$files` allows any caller on the
   `captures/` prefix. Safe only while there is no client-side storage access
   and no auth. Must be scoped to the authenticated owner before auth ships.
9. **InstantDB returns `null`, not `undefined`, for unset optional fields.**
   Always use `== null` checks, never `!== undefined`. A null date coerces to
   epoch 0 and produces silently absurd results.
10. **`profiles`/`people`/`facts`/`commitments`/`captures` have public `view`
    permission in `instant.perms.ts`.** There's no auth yet, so the web view
    can't scope reads to a signed-in owner — it reads a single profile id from
    an env var instead. Anyone with the Instant app id can read all of it.
    Must be scoped to the authenticated owner before auth ships.
11. **Never run `setWebhook` with the production bot token.** One bot has one
    webhook; re-pointing it at a tunnel silently kills production capture with
    no error anywhere.

## Environment variables

```
HOLDFAST_INSTANT_APP_ID=
HOLDFAST_INSTANT_ADMIN_TOKEN=
HOLDFAST_TELEGRAM_BOT_TOKEN=
HOLDFAST_TELEGRAM_WEBHOOK_SECRET=
HOLDFAST_CRON_SECRET=
CRON_SECRET=
OPENAI_API_KEY=
NEXT_PUBLIC_HOLDFAST_INSTANT_APP_ID=
NEXT_PUBLIC_HOLDFAST_PROFILE_ID=
```

Always prefixed with `HOLDFAST_`. A second Instant app exists for another
project; generic names invite cross-wiring bugs that fail silently. `CRON_SECRET`
is the one deliberate exception: Vercel's cron scheduler only recognizes an env
var with that exact name and auto-sends it as `Authorization: Bearer
$CRON_SECRET`, so it can't be renamed. `/api/cron/nudges` accepts either that
or `HOLDFAST_CRON_SECRET` via `x-holdfast-cron-secret` (kept for manual
testing without deploying).

## Environments

Production runs on Vercel. The production bot's webhook points at the Vercel
URL permanently and is never re-registered. If capture appears broken, check
the Vercel deployment and logs — do not start a tunnel.

Local development uses a SECOND Telegram bot with its own token, behind a
cloudflared tunnel. That tunnel URL changes on restart, so `setWebhook` is
re-run — for the dev bot only.

`.env.local` holds the dev bot token. Vercel holds the production bot token.
They are never interchanged.

## Out of scope — do not build unless I ask

Auth, paywall, billing, settings screens, onboarding flows, audio playback,
team features, calendar or contacts integration, mobile native apps, dark mode,
analytics dashboards, notification preferences, timezone configuration.

## Working style

- **One phase at a time. Stop at each acceptance gate and let me verify.**
  Do not continue to the next phase until I say so.
- Prefer boring, obvious code. This is a solo project I need to read in three
  months.
- Keep the extraction prompt in `lib/extraction-prompt.ts` as a versioned
  exported constant. Never inline it.
- Log every extraction input and output to the console in development.
- Production runs on Vercel. The Telegram webhook points at the production URL
  permanently and is not re-registered. Local development uses a separate bot
  with its own token.

## Copy rules

No em dashes (—) or en dashes (–) anywhere in user-facing text. This
includes the landing page, Telegram bot replies, nudge messages, page
metadata, and any future copy. Use a comma, a colon, a full stop, or
restructure the sentence. Code and comments are exempt.
