# SEO brief: Holdfast homepage (useholdfast.co)

Prepared 2026-10-08. Target page: https://useholdfast.co, the live waitlist homepage (`src/app/page.tsx`).

## Bottom Line
Target **"app to remember things about friends."** The results for this query are App Store and Product Hunt listings for typed-notes apps with very few reviews. No web page explains the problem, so a clear page about voice capture, promise tracking, and reminders timed to what's happening in a friend's life has room to compete. The current title and H1 don't use the words searchers type.

## Target Keyword & Intent
**Primary keyword:** "app to remember things about friends"
Close variants: "app to remember details about friends", "remember what friends tell you app".

**Intent:** commercial, close to transactional. Every result returned for this query was a product listing (App Store, Product Hunt, AlternativeTo), not an article. Searchers want a tool they can start using today. They compare on four things: how details get in, whether it reminds them, privacy, and platform/price.

**Volume and difficulty:** Not measurable without a keyword-research tool (e.g. Search Console, Ahrefs, Semrush). Your marketing plugin's Ahrefs connector needs authorizing in claude.ai connector settings before it can supply these numbers.

**About the word "app":** The hero eyebrow says "Voice notes in Telegram. No new app." Keep "app" out of the title and answer it in an FAQ ("Do I need to download a new app?"). For an ADHD audience, no new app to remember to open fits the query rather than contradicting it.

## Related & Secondary Keywords
| Keyword | Likely Intent | Where it fits |
|---|---|---|
| "remember details about friends" | Commercial | Lede (already close), H2 "Twenty seconds of talking" |
| "remember what friends tell you" | Commercial | H3 "Say what happened" |
| "voice note to remember people" | Commercial | H3 "Say what happened", FAQ |
| "remember promises to friends" / "follow up with friends" | Commercial | H3 "It finds you at the right moment" |
| "ADHD forgetting to keep in touch with friends" | Informational | New short H2 on the homepage, plus its own blog post later |
| "how to remember details about friends" | Informational | Not the homepage target. Future blog post that links here |
| "personal CRM for friends" | Commercial | FAQ only, as the searcher's term in the question. Answer in Holdfast language |
| "friend notes app" / "friendship tracker" | Commercial | FAQ (how Holdfast differs) |
| "Telegram reminder bot" | Commercial | FAQ "Do I need to download a new app?" |
| "is it private" (voice notes) | Informational | H2 "Where your voice note goes" (exists) |
| "keep in touch with friends app" | Mixed | **Don't target.** Results are messaging apps and meet-new-friends lists |
| "app to remember friends' birthdays" | Commercial | **Don't target yet.** No yearly or recurring reminder logic found in `src/` |

## Suggested Outline
Markers: [keep] = live today, [new] = add, [edit] = change.

# Never lose touch with the people who matter. [keep]
- Eyebrow [keep]: "Voice notes in Telegram. No new app."
- Lede [keep]: "...Holdfast remembers what's going on in their life and what you promised..." already carries the primary phrase. The title tag does the rest.

## Most friendships don't end. They just go quiet. [keep]
The problem, framed for "keep in touch with friends."

## Twenty seconds of talking. That's the whole habit. [keep]
"Remember details about friends", "voice note."
### Say what happened [keep]
"Remember what friends tell you."
### Holdfast sorts it out [keep]
Automatic extraction. Every competitor found makes the user type.
### It finds you at the right moment [keep]
"Remember promises", "follow up." Keep the "a few nudges a week" cap visible.

## Forgetting isn't the same as not caring. [new]
For "ADHD forgetting to keep in touch with friends." Three or four short lines, warm, no judgment:
- Out of sight, out of mind is how many ADHD brains work. It doesn't mean you don't care.
- Most friend apps ask you to remember to open them and fill in fields.
- Holdfast asks for 20 seconds in a chat you already use.
- It never sends more than three nudges a week.

## No app can import the people you love. [keep]
Shows the difference from apps that import your contact list and have you type everything ("personal CRM").

## Where your voice note goes. [keep]
Privacy. Competitors lead with it (on-device storage, PIN lock, end-to-end encryption), so this section has to stay.

## Questions people ask [new]
Write it as a visible FAQ for readers and on-page relevance. Don't count on FAQ rich results: Google now shows them mainly for government and health sites.
### Do I need to download a new app?
No. It runs in Telegram. ("Telegram reminder bot")
### Is Holdfast a personal CRM?
No. Say what it is instead. Avoid "contact", "lead", "pipeline", and "manage" (CLAUDE.md copy rule). ("personal CRM for friends")
### How is this different from a friend notes app?
You talk instead of typing, it tracks what *you* promised, and it reminds you when it matters. ("friend notes app")
### What if I forget to send a voice note?
Nothing breaks. Next time, just talk for 20 seconds. Confirm this matches the bot's actual behavior before publishing. (ADHD)
### How many reminders will I get?
Never more than three a week.
### Do you keep my recordings?
No. Short answer, then link to "Where your voice note goes."

## Say it out loud once. Holdfast remembers the rest. [keep]
Waitlist CTA.

## Meta Title & Description
**Recommended title (54 characters):**
`Remember things about friends in 20 seconds | Holdfast`

**Alternative title (57 characters):**
`Holdfast: remember what's going on in your friends' lives`

**Description (149 characters):**
`Talk for 20 seconds after you see a friend. Holdfast remembers what's going on in their life and what you promised, then reminds you when it matters.`

**Current, for comparison:** title "Holdfast: Never lose touch with the people who matter" (53 characters), description 119 characters. Both are fine for brand, but neither says what the product does in searcher words.

**Checks:** Character counts were computed, not estimated. No banned words from brand-voice.md. No em or en dashes (the CLAUDE.md copy rule covers page metadata). Sentence case. To apply, edit the `TITLE` and `DESCRIPTION` constants in `src/app/page.tsx:11-13`. They also feed Open Graph.

**Side fix:** `src/app/layout.tsx:16-17` still has the "Create Next App" default metadata. The homepage overrides it, but any route without its own metadata inherits it, including `/people`, which shows "No one yet." to every visitor. Replace the default, and add `noindex` to `/people`.

## Competing Pages
**Pattern across every product found:** information is typed. None tracks what *you* promised. None mentions ADHD. Reminders are either a fixed cadence ("every N days") or missing. That gap is Holdfast's whole pitch.

- **Friendship Tracker Friendzone** (App Store, iPhone). Pitched as a "Personal Relationship CRM." It covers typed notes, import from Contacts.app, catch-up intervals, birthday and anniversary alerts, and on-device storage with iCloud sync. It has 4.5 stars from 8 ratings, and its pricing contradicts itself (free with everything included vs. a $99.99 lifetime purchase). **Gap:** no voice capture, no tracking of promises, and reminders run on a timer rather than on events in the friend's life.
- **Notami** (App Store, iPhone/iPad, iOS 26+). Typed notes, photos, tags, friendship ratings, "Prep Cards" before you meet, and on-device Apple Intelligence summaries. Free up to 5 friends, then a one-time Pro upgrade. **Gap:** the user writes everything. No voice capture, no commitments.
- **Remember Your People** (Product Hunt, web app). End-to-end encrypted typed notes, free up to 5 notes, €12/month premium, self-hosting available. **Gap:** no reminders at all and typed only. It's a lookup tool, not a nudge.
- **MemX, "How to Remember People You Meet, Privately"** (blog, 2026-08-19). It showed up for the adjacent "how to remember details about friends" query. It recommends a ten-second voice note right after meeting someone and mentions noting promises. **Gap:** no reminders or follow-up, examples mix work acquaintances with friends, and ADHD appears only as a related-post link. This is the closest match to Holdfast's capture habit, so watch it.
- **ADDitude, "Bad Texter? Worse Caller? 6 Ways to Rekindle Cold Friendships"** (updated 2025-05-09), for the ADHD secondary keyword. The advice is recurring calendar check-ins, habit stacking, and putting a friend's interview or appointment on your calendar so you can ask how it went. It recommends no app and doesn't cover promises you made. **Gap:** its best tip is a manual version of what Holdfast does automatically. The new ADHD section and a future blog post can make that connection.

Monica also appeared for "personal CRM for friends and family." See `marketing/competitor-brief-monica-2026-10-08.md`.

## Sources
Pages read in full, all accessed 2026-10-08:
- Friendship Tracker Friendzone, App Store: https://apps.apple.com/app/id6472595588
- Remember Your People, Product Hunt: https://www.producthunt.com/products/remember-your-people
- Notami, App Store: https://apps.apple.com/co/app/notami/id6745493846
- MemX, "How to Remember People You Meet, Privately": https://memx.app/blog/remember-everyone-you-meet-privately/
- ADDitude, "Bad Texter? Worse Caller? 6 Ways to Rekindle Cold Friendships": https://www.additudemag.com/bad-texter-how-to-keep-in-touch-with-friends-adhd/
- Holdfast live homepage: https://useholdfast.co
- Internal: `src/app/page.tsx`, `src/app/layout.tsx`, `README.md`, `CLAUDE.md`, `marketing/competitor-brief-monica-2026-10-08.md`

Searches run on 2026-10-08. Result lists were used only to see what kind of pages appear, not as content claims:
"app to remember things about friends"; "ADHD forgetting to keep in touch with friends"; "app that reminds you to follow up with friends voice note"; "best app to keep in touch with friends 2026"; "how to remember details about friends"; "personal CRM for friends and family app"; "app for ADHD to remember friends birthdays and life events"; "remember what friends tell you app"; "voice memo app to remember details about people you meet AI"; "how to be a better friend with ADHD"; "Telegram bot remember friends reminders".

These searches ran through a US web search tool, not a live Google results page. They show what kinds of pages appear, not ranking positions.
