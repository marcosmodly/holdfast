# Waitlist — Claude Code spec

Ship the landing page at the root of the existing Holdfast deployment and store
signups in InstantDB. No new hosting, no new service, no new bill.

**Guardrail: this adds routes. It changes nothing in the capture or nudge path.
Do not touch `/api/telegram/webhook`, `/api/cron/nudges`, `lib/nudges.ts`, or
`lib/extraction-prompt.ts`.**

---

## 1. Schema

Add one entity to `instant.schema.ts`:

```ts
waitlist: i.entity({
  email:     i.string().indexed().unique(),
  createdAt: i.number().indexed(),
  source:    i.string().optional(),   // "tiktok" | "youtube" | "direct" — from ?ref=
}),
```

No links. It is deliberately disconnected from `profiles` and `people` — a
waitlist signup is not a user and must never be treated as one.

Push with the app ID stated explicitly:

```
npx instant-cli push --app <HOLDFAST_INSTANT_APP_ID>
```

Never `--yes` without `--app`. There is a second Instant app on this account.

## 2. Permissions

In `instant.perms.ts`, `waitlist` gets **no client access at all**:

```ts
waitlist: {
  allow: { view: 'false', create: 'false', update: 'false', delete: 'false' },
},
```

All writes go through the server route using the admin token. A public
create rule would let anyone dump junk straight into the database.

## 3. `POST /api/waitlist`

Server route, uses the existing admin client from `lib/instant-admin.ts`.

- Accepts JSON `{ email, source?, website? }`
- **`website` is a honeypot.** It is hidden from humans by CSS. If it has any
  value, return 200 with the success shape and write nothing.
- Validate the email with a simple regex. Reject over 254 characters.
- Lowercase and trim before storing.
- **Instant has no upsert — query first.** If the email exists, return the same
  success response without creating a second row.
- Never reveal whether an address was already on the list.
- Wrap everything in try/catch; log server-side, return a generic error to the
  client.

Response shape both ways: `{ ok: true }`.

## 4. The page

`app/page.tsx` — replace the Next.js default page.

**Use the `ui-ux-pro-max` skill for this section.** Invoke it before writing
any markup. If it is not installed, stop and tell me — do not proceed without
it.

Run these, in order, before writing a line of markup. On Windows use `python`;
if that fails try `py -3`.

```bash
# 1. Design system — persisted to the project root so it survives sessions.
#    Dials are deliberate: minimal, subtle motion, spacious marketing page.
python "${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/scripts/search.py" \
  "personal relationship memory tool warm editorial minimal" \
  --design-system --persist -p "Holdfast" \
  --output-dir "." --variance 3 --motion 2 --density 3

# 2. Landing page structure
python ".../search.py" "hero waitlist email capture single-cta" --domain landing

# 3. Form UX — the email field is the only interactive element on the page
python ".../search.py" "inline validation error clarity focus management" --domain ux

# 4. Next.js implementation guidance
python ".../search.py" "app router metadata font loading" --stack nextjs
```

If `design-system/holdfast/MASTER.md` already exists, read it and use it —
do not regenerate with `--force`.

If any search returns zero results, say so explicitly rather than inventing
recommendations.

**The brand palette overrides the skill's colour recommendation.** Keep the
warm off-white `#FBF7F2`, ink `#2A2320`, and terracotta `#B4552D` from the
source file. Feed those in as the design tokens. Do apply any contrast
corrections the skill flags — if a pairing fails 4.5:1, fix it by adjusting
lightness within the same hue family, never by swapping the hue.

Typography is open. The source uses Fraunces and Inter; if the skill's font
pairing search suggests something better for a warm editorial register, take
it, but show me both before committing.

Source material: `holdfast-landing.html` in the repo root. It is a finished
page, not a rough draft.

**Every word of copy is locked.** Headline, subheads, the three stats and their
attribution, the three how-it-works steps, the "no app can import the people
you love" section, the footer line. Do not rewrite, shorten, punch up, or
"optimise" any of it. Three exceptions, listed in the copy fixes below.

**What the skill is for:** typography scale and pairing, spacing rhythm,
colour-contrast and accessibility passes, form and focus states, motion, and
responsive behaviour. Improve the craft of the existing design. Keep the warm
off-white and terracotta palette — it is the brand.

Convert to React: the two inline form handlers become React state, pointed at
`/api/waitlist` instead of the empty `ENDPOINT` constant. Tailwind is fine here
if the skill calls for it; a `<style>` block is equally fine. Either way the
rendered result must stay visually faithful to the source.

Accessibility is not optional: labelled inputs, visible focus rings, AA
contrast throughout, and `prefers-reduced-motion` respected — the source
already honours it.

Read `?ref=` from the URL and pass it as `source` so you can tell TikTok
traffic from YouTube traffic.

Three copy fixes while porting:

1. Footer email `hello@example.com` → a real address.
2. `"His mum's surgery"` → `"His mom's surgery"`. The audience is US-leaning
   and the stats are American.
3. Confirm the stat block still reads **"in 2021"**, never "today".

## 5. Acceptance

1. `/` serves the landing page on production.
2. Submitting a real email returns the success message and creates one row.
3. Submitting the **same** email again returns success and creates **no**
   second row.
4. Filling the hidden `website` field creates nothing.
5. A voice note to the production bot still works, unchanged.

Stop after this. Do not add an admin page, an email confirmation, or an
unsubscribe flow.
