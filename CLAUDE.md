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
5. **Instant storage permissions are disabled by default.** Client-side
   storage work must include rules in `instant.perms.ts` or uploads silently
   fail. The admin SDK ignores these rules, so server-side storage needs none.
6. **Instant has no upsert.** Always query before create, or you get duplicates.
7. **Always return 200 to Telegram**, even on internal failure. Log the error
   separately. A non-200 makes Telegram retry the same update forever.
8. **`$files` is deny-all for clients.** Capture audio is uploaded, read and
   deleted only by the webhook through the admin SDK, which skips permission
   checks. Never open a client rule on `captures/`: with the public app id,
   anyone could read, upload or delete audio. Any future client-side storage
   must be scoped to the authenticated owner.
9. **InstantDB returns `null`, not `undefined`, for unset optional fields.**
   Always use `== null` checks, never `!== undefined`. A null date coerces to
   epoch 0 and produces silently absurd results.
10. **Every data namespace is deny-all for clients, including `view`.**
    Verified live on 2026-10-08: a guest reads 0 rows everywhere. The
    consequence is that the client-side `/people` web view returns nothing
    (it shows "No one yet."). Do not reopen `view` to fix it. Re-enable it
    only with reads scoped to an authenticated owner, or by moving the reads
    server-side behind a gate.
11. **Never run `setWebhook` with the production bot token.** One bot has one
    webhook; re-pointing it at a tunnel silently kills production capture with
    no error anywhere.
12. **Profile, person, facts, and commitments persist in ONE atomic Instant
    transaction.** Any rejected step discards all of them. Never gate the
    creation of one entity on another entity's existence (e.g. deciding
    whether to create the profile based on whether the person is new) — check
    each entity's existence independently, or a returning user mentioning a
    new person will re-`create()` their already-existing profile and the
    whole transaction gets rejected.
13. **A function named `findOrCreate` must actually create.** `findOrCreateProfileId`
    used to only find. If it doesn't create, name it `find`.
14. **The bot's Telegram reply must reflect what was SAVED, never what was
    extracted.** Build the reply from the persistence result, not the raw
    extraction — they can disagree, and telling the user something was
    captured when it wasn't stored is the worst failure mode for this
    product.

## Persistence

Test and repro scripts must NEVER write to the production Instant app. A
scratch script created a second profile with a fake `telegramChatId`, which
silently broke nudge delivery until a send failed.

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

## Tooling

UI skills are not tracked. Reinstall with:

```
npm install -g ui-ux-pro-max-cli && uipro init --ai claude
```

`.claude/skills/instantdb/` is the exception and stays tracked; everything
else under `.claude/skills/` is vendored and gitignored.

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

## Where work belongs

The model is reliable at reading what was said. It is unreliable at
everything downstream of that. Every extraction failure in this project
was fixed by moving work OUT of the prompt and INTO code:

  weekday arithmetic  -> resolveDateExpression()
  commitment truth    -> commitmentEvidenceHolds()
  naming the person   -> the nudge template

When the model gets something wrong twice, do not rewrite the rule.
Ask what deterministic code could do that job instead.

## Copy rules

No em dashes (—) or en dashes (–) anywhere in user-facing text. This
includes the landing page, Telegram bot replies, nudge messages, page
metadata, and any future copy. Use a comma, a colon, a full stop, or
restructure the sentence. Code and comments are exempt.
