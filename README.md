# Holdfast

Never lose touch with the people who matter.

12% of Americans said they had no close friends in 2021, up from just 3% in 1990. Friendships rarely end on purpose, they just go quiet. Holdfast is built against that drift: after you see someone, you talk for about 20 seconds into a Telegram bot. It transcribes what you said, pulls out who you saw, what's going on in their life, and anything you promised to do, then reminds you at the moment it actually matters, before the surgery you meant to ask about, before the referral you promised turns stale.

It's deliberately not a CRM and doesn't scrape your contacts or social graph. You decide who's worth remembering, one voice note at a time.

**Live:** https://useholdfast.co

## How it works

1. Send a voice note to the Telegram bot after seeing someone
2. It's transcribed and the audio is deleted right after, only the text sticks around
3. The extraction pulls out the person, what's happening with them, and any commitments you made
4. You get reminded at the right time, capped so it never turns into noise

## Stack

- Next.js (App Router) + TypeScript
- InstantDB for data
- Telegram Bot API for capture and delivery
- OpenAI `gpt-4o-mini-transcribe` for speech-to-text
- Vercel for hosting + cron

## Status

Live, early-stage.
