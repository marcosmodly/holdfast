# Holdfast

Voice-first memory for the people you care about.

After you see someone, you talk for about 20 seconds into a Telegram bot. Holdfast transcribes it, pulls out who you saw, what's going on in their life, and anything you promised to do, then reminds you at the moment it actually matters. It's not a CRM, it's just a way to not let things slip through the cracks with people you love.

**Live:** https://holdfast-lake-ten.vercel.app

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

In active development.
