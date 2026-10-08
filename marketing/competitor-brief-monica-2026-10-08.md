# Competitor Brief: Monica (monicahq.com)

Prepared 2026-10-08 for the Holdfast marketing team. Window for recent moves: 2026-07-10 to 2026-10-08 (90 days).

## Bottom Line
**Monica** makes the same core promise as Holdfast: remember the people you care about and the promises you made to them. Its homepage even uses a "be a better friend" line that nearly matches Holdfast's closing headline. The difference is how the two products get there. Monica is a typed, manual-entry, privacy-first open-source tool, and it is partway through a from-scratch rebuild (v3) that a part-time founding team is aiming to ship before the end of 2026. Holdfast's positioning should therefore rest on effort (talk for 20 seconds; it sorts itself out) rather than on the shared promise, and the v3 transition in Dec 2026 is a time-bound window worth watching.

## Company Overview
- **Monica** is an open-source "personal CRM" for keeping track of friends, family, colleagues and neighbours. Its site says it is explicitly not for sales teams. Source: [Monica homepage](https://www.monicahq.com/); [monicahq GitHub org](https://github.com/monicahq).
- It started in 2017 as founder Regis Freyd's personal project. A co-founder, Alexis, is named on the blog. Source: [Monica homepage](https://www.monicahq.com/); [We are rebuilding Monica](https://monicahq.com/en/blog/we-are-rebuilding-monica/).
- Business model: the code is free to self-host. The hosted plan costs $9/month or $90/year (USD), with a 30-day trial and no credit card required. Source: [Monica pricing](https://monicahq.com/en/pricing/).
- Current features include relationship mapping, notes and a journal, reminders for calls, birthdays and follow-ups, important dates, gift/debt/promise tracking, custom fields, and vCard/CSV import with full export. Source: [Monica homepage](https://www.monicahq.com/).
- Reminders go out by email or Telegram, and each user sets up their own channels. Source: [Monica docs: notification channels](https://docs.monicahq.com/user-and-account-settings/notification-channels).
- Monica is a web app at app.monicahq.com, and there is no native mobile app yet. Native iOS/Android apps are planned to follow v3. Source: [Monica docs](https://docs.monicahq.com/llms-full.txt); [Monica v3 page](https://monicahq.com/en/v3/).
- Stage and size: the founders have full-time jobs and other commitments, according to the founder. Team headcount, funding and subscriber counts: Not publicly available. Source: [A new version of Monica is coming in 2026](https://monicahq.com/en/blog/new-version-of-monica-in-2026/).
- Community signal: the main repository had 25,452 GitHub stars when checked on 2026-10-08. Source: [monicahq GitHub org](https://github.com/monicahq).

## Recent Moves (last 90 days)
- **2026-09-24** — Merged an opt-in login-page notice for the hosted instance. It warns that the instance and all its data will be deleted at the end of December 2026, ahead of a new Monica version. It is off by default, so self-hosted installs are unaffected. Which hosted environment it targets (the main paid app or a beta instance) is not stated publicly. Source: [GitHub PR #7978](https://github.com/monicahq/monica/pull/7978).
- **2026-09-24** — These were the first commits on the public `main` branch since 2025-08-30, which leaves a gap of roughly 13 months. There were no tagged releases in the window. The latest are v4.1.2 (2024-05-04) and v5.0.0-beta.5 (2025-04-21). Source: [GitHub commits](https://github.com/monicahq/monica/commits/main); [GitHub releases](https://github.com/monicahq/monica/releases).
- **2026-09-02** — Published "Building Monica: modeling relationships between people." It says relationships are stored from the user's point of view, the software makes few automatic inferences, and exact dates are optional. Source: [Monica blog](https://monicahq.com/en/blog/modeling-relationships/).
- **2026-08-31** — Released LaraDB, an open-source, read-only database browser for Laravel. It is a developer tool, not a user-facing feature. Source: [Monica blog](https://monicahq.com/en/blog/laradb/).
- **2026-08-30** — Launched the "Building Monica" build-in-public series. The founder says the current version "is no longer the personal CRM I would build today." The v3 goals are relationships treated as first-class concepts, more customization with good defaults, and a more playful interface. Source: [We are rebuilding Monica](https://monicahq.com/en/blog/we-are-rebuilding-monica/).
- **2026-08-06** — Announced a from-scratch rebuild, now branded Monica v3, due "before the end of 2026." The founder acknowledges the rebuild has taken longer than planned because both founders have full-time jobs. Source: [A new version of Monica is coming in 2026](https://monicahq.com/en/blog/new-version-of-monica-in-2026/).
- **Not found in window:** I found no funding, M&A, leadership changes, pricing changes, partnerships, layoffs, or named customer wins or losses in public sources. Monica's pricing page says prices "may change as Monica evolves" and that existing subscribers will be notified in advance. Source: [Monica pricing](https://monicahq.com/en/pricing/).

## Messaging & Positioning Analysis

### Stated value proposition
- **Monica**'s homepage headline is "Remember the people you care about." The subheadline covers what people tell you, shared moments, and promises you meant to remember. Source: [Monica homepage](https://www.monicahq.com/).
- The second pillar is privacy and ownership: open source, self-hostable, no advertising, no sale of personal data, and a pledge that no model is trained on users' contacts. Source: [Monica homepage](https://www.monicahq.com/); [Monica v3 page](https://monicahq.com/en/v3/).

### Primary audience
- The site addresses individuals managing personal relationships and explicitly excludes sales teams. Source: [Monica homepage](https://www.monicahq.com/).
- The heavy emphasis on self-hosting, Docker, source code and custom fields suggests the core audience is technical, privacy-conscious users who are comfortable configuring software (inference).

### Tone and style
- The tone is playful, self-deprecating and dry, in a first-person founder voice. The homepage frames the product as something built because the founder's memory is bad. Source: [Monica homepage](https://www.monicahq.com/).
- The messaging is explicitly anti-engagement and rejects "engagement" notifications. That is the same restraint Holdfast builds in with its nudge cap. Source: [Monica homepage](https://www.monicahq.com/).
- Product philosophy: the user stays in control. The site says Monica won't decide how important someone is to you, and it avoids inferring relationships automatically. Source: [We are rebuilding Monica](https://monicahq.com/en/blog/we-are-rebuilding-monica/); [Modeling relationships](https://monicahq.com/en/blog/modeling-relationships/).

### How it compares to Holdfast
- **The promise overlaps.** Holdfast's core idea is to remember what matters to the people you love, including what you said you'd do. **Monica** already lists promise tracking as a feature. Holdfast's difference is how commitments are captured and resurfaced, not the fact that it tracks them.
- **The headline overlaps.** Holdfast's landing page closes on "Be a better friend without trying to remember everything." Monica's homepage uses a near-identical "better friend" line. Source: [Monica homepage](https://www.monicahq.com/); internal `holdfast-landing.html`.
- **The category language differs.** Monica calls itself a personal CRM and talks about contacts. Holdfast deliberately avoids CRM, contact and pipeline language. Source: [monicahq GitHub org](https://github.com/monicahq); internal `CLAUDE.md`.
- **The capture model is the sharpest difference.** Monica relies on typed, structured records, and v3 adds more customization rather than less input. Holdfast runs on a 20-second voice note. A competitor-authored review also notes that Monica has no automatic logging. Source: [Monica v3 page](https://monicahq.com/en/v3/); [Dex, Monica Review 2026 (competitor-authored, 2026-04-06)](https://getdex.com/blog/monica-review/).
- **The control philosophy is the opposite.** Monica leaves judgment to the user. Holdfast extracts, ranks and decides what to surface, with at most three nudges a week. For an ADHD audience, "it sorts itself out" is likely a stronger promise than "you can configure everything" (inference).
- **Privacy is Monica's strongest ground.** Holdfast's audio-deletion policy is a partial counter, but Holdfast does send audio to a third-party transcription model. Source: [Monica v3 page](https://monicahq.com/en/v3/); internal `CLAUDE.md`.
- **Both use Telegram, in different ways.** Monica sends reminders out over Telegram. Holdfast uses Telegram for both capture and delivery. Source: [Monica docs: notification channels](https://docs.monicahq.com/user-and-account-settings/notification-channels).

| | **Monica** | Holdfast |
|---|---|---|
| Capture | Typed entries, custom fields, vCard/CSV import | ~20-second voice note via Telegram |
| Who organizes | The user | Holdfast (automatic extraction) |
| Reminders | Email or Telegram, user-scheduled intervals | Telegram nudges, ranked, max 3 per 7 days |
| Mobile | Web app; native apps planned after v3 | Telegram (native on phones) |
| Privacy stance | Open source, self-hostable, no model trained on contacts | Audio deleted after transcription; text stored |
| Price | $0 self-hosted; $9/mo or $90/yr hosted | Not defined in project files |

## SWOT

Strengths and weaknesses are Monica's. Opportunities and threats are framed from Monica's position, with the implication for Holdfast in parentheses.

| Strengths | Weaknesses |
|---|---|
| Nine years of open-source history and ~25k GitHub stars give it credibility in the category ([GitHub](https://github.com/monicahq)) | Manual entry only: no automatic logging, according to a competitor-authored review ([Dex](https://getdex.com/blog/monica-review/)) |
| A privacy and ownership story that is hard to match: self-host, no ads, no model trained on contacts ([v3 page](https://monicahq.com/en/v3/)) | Part-time founding team; the rebuild has already slipped ([2026-08-06 post](https://monicahq.com/en/blog/new-version-of-monica-in-2026/)) |
| Broad, mature features, including promise and important-date tracking ([homepage](https://www.monicahq.com/)) | No public main-branch commits for ~13 months and no tagged release since Apr 2025 ([GitHub](https://github.com/monicahq/monica/commits/main)) |
| Low price and a free self-host option ([pricing](https://monicahq.com/en/pricing/)) | No native mobile app until after v3 ships ([v3 page](https://monicahq.com/en/v3/)) |

| Opportunities | Threats |
|---|---|
| The v3 launch gives it a news moment and a chance to reposition around phone-friendly design (expect a visibility spike in Q4) ([v3 page](https://monicahq.com/en/v3/)) | A hosted-instance deletion notice for end of Dec 2026 creates a forced-transition moment for some users (a possible switching window for Holdfast) ([PR #7978](https://github.com/monicahq/monica/pull/7978)) |
| A planned full API and MCP server could let third-party AI tools add low-effort capture on top of Monica (this could narrow Holdfast's effort advantage) ([homepage](https://www.monicahq.com/)) | Shipping a from-scratch rewrite before year-end with a part-time team carries delivery risk ([2026-08-06 post](https://monicahq.com/en/blog/new-version-of-monica-in-2026/)) |
| Community-built templates (pets, homes, projects) could broaden its use cases ([v3 page](https://monicahq.com/en/v3/)) | AI-native, voice-first tools make typed record-keeping feel heavier, especially for low-patience audiences (inference) |

## Recommendations
1. Rewrite Holdfast's "Be a better friend without trying to remember everything" headline so the 20-second voice note carries it, because **Monica**'s homepage already uses a near-identical "better friend" line (Messaging: headline overlap).
2. Lead every comparison with effort, not features (talk for 20 seconds vs. type and configure records), because Monica's v3 roadmap adds more structure and customization rather than less input (Recent Moves: 2026-08-30 and 2026-09-02).
3. Publish a plain-language privacy explainer (audio deleted after transcription; what the transcription provider sees) before any campaign that invites comparison, because privacy is Monica's strongest pillar and its weakest point against Holdfast (Messaging: privacy).
4. Make the three-nudges-per-week cap a concrete proof point in ADHD-focused social posts, because Monica also rejects engagement notifications but publishes no specific limit (Messaging: tone and control philosophy).
5. Pencil in a Dec 2026–Jan 2027 content slot for people reconsidering their relationship app, after confirming which hosted instance PR #7978's deletion notice applies to (Recent Moves: 2026-09-24).

## Sources
- Monica homepage, https://www.monicahq.com/ — accessed 2026-10-08.
- Monica pricing page, https://monicahq.com/en/pricing/ — accessed 2026-10-08.
- Monica v3 page, https://monicahq.com/en/v3/ — accessed 2026-10-08.
- Monica blog index, https://monicahq.com/en/blog — accessed 2026-10-08.
- "A new version of Monica is coming in 2026" (2026-08-06), https://monicahq.com/en/blog/new-version-of-monica-in-2026/ — accessed 2026-10-08.
- "We are rebuilding Monica" (2026-08-30), https://monicahq.com/en/blog/we-are-rebuilding-monica/ — accessed 2026-10-08.
- "Building Monica: we built the database browser we wanted for Laravel" (2026-08-31), https://monicahq.com/en/blog/laradb/ — accessed 2026-10-08.
- "Building Monica: modeling relationships between people" (2026-09-02), https://monicahq.com/en/blog/modeling-relationships/ — accessed 2026-10-08.
- GitHub PR #7978, "feat: add instance deletion notice on login page" (merged 2026-09-24), https://github.com/monicahq/monica/pull/7978 — accessed 2026-10-08.
- GitHub commit history (main), https://github.com/monicahq/monica/commits/main — accessed 2026-10-08.
- GitHub releases, https://github.com/monicahq/monica/releases — accessed 2026-10-08.
- monicahq GitHub organization, https://github.com/monicahq — accessed 2026-10-08.
- Monica docs, notification channels, https://docs.monicahq.com/user-and-account-settings/notification-channels — accessed 2026-10-08.
- Monica docs (full text), https://docs.monicahq.com/llms-full.txt — accessed 2026-10-08.
- Dex, "Monica Review 2026" (2026-04-06; written by a competing product, so its criticisms should be weighed accordingly), https://getdex.com/blog/monica-review/ — accessed 2026-10-08.
- Internal: Holdfast `CLAUDE.md` and `holdfast-landing.html` — accessed 2026-10-08.
