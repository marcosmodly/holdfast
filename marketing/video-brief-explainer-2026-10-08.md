# Holdfast explainer video: visual brief

Date: 2026-10-08. Built and rendered in the sibling project `../holdfast-video`.

## Brief Overview

- **Goal:** a narrated homepage explainer that shows, in about a minute, why friendships go quiet and how Holdfast's three steps fix that, ending on the waitlist.
- **Source:** the live landing page copy (`src/app/page.tsx`): the Marco example, the bot's real reply wording, the 3-nudges-a-week cap, and the privacy section.
- **Audience and voice:** people with ADHD. Clear, warm, encouraging, short sentences, no judgment. No emoji, no em or en dashes, no "contact / lead / pipeline / manage".
- **Platform:** website (homepage), 16:9.
- **Duration:** 72.2 seconds, 30 fps, 1920x1080, 8 scenes.
- **Sound:** AI narrator (OpenAI `gpt-4o-mini-tts`, voice "marin"), a second voice for the user's voice note ("cedar"), an original synthesized score, and 40+ synthesized sound cues, all timed to word-level timestamps.

## Shot List

| Shot # | Description | Duration | Camera/Framing notes |
|---|---|---|---|
| 1 | Hook. A "Note to self" card reads "Ask Marco how his mom's surgery went." Weekday pills rush past and the wind carries the note away. | 0.0 to 4.8s | Centered card, slow push-in, motion-blurred pills at two depths |
| 2 | Going quiet. Marco's message and your "Let's catch up soon!" fade to grey as a dotted line counts 1 week, 1 month, 3 months. Reframe: "Forgetting isn't the same as not caring." word by word, "isn't" underlined by hand. | 4.8 to 11.8s | Centered column, then full-frame kinetic type |
| 3 | Meet Holdfast. The logo bubble springs in, the waveform bars grow on the music downbeat and move with the narrator's voice, the wordmark rises letter by letter. Tagline plus "Lives in Telegram" and "No new app" chips. | 11.8 to 19.7s | Centered lockup; logo then glides to the top-left corner and stays there |
| 4 | Step 1, say what happened. Phone rises in 3D. A finger holds the mic, ripples pulse, a live waveform and timer run while the user's voice note plays. Each spoken word appears on the right as it is said. | 19.7 to 34.0s | Phone left third, text right two thirds |
| 5 | Step 2, Holdfast sorts it out. The spoken words get a card, a scan line turns them into a clean transcript, highlights land on "who you saw", "what's going on", and "what you promised", and three cards fly out. The bot replies in the phone with its real wording. | 34.0 to 44.6s | Same layout; the promise card gets an accent border and glow |
| 6 | Step 3, the right moment. The calendar flips from 14 to 15, the phone buzzes with the nudge, and a week row lights three days: "Three nudges a week, at most." | 44.6 to 54.9s | Same layout |
| 7 | Privacy. The voice note pops out of the phone; its waveform bars fly into a transcript card and become lines of text; the audio pill dissolves. "Audio deleted" / "Text saved" / "We keep the words. Never the audio." | 54.9 to 61.7s | Two-up composition, headline top center |
| 8 | CTA. "Say it out loud once. Holdfast remembers the rest." word by word, then the logo returns for the end card: "Join the waitlist" button, useholdfast.co, microcopy, AI voiceover note. | 61.7 to 72.2s | Centered end card, holds about 4s |

## Per-Scene Prompts

These prompts are for regenerating alternates in an image or video model. The shipped video is code-rendered, so its text and UI stay sharp, which current AI video models can't promise.

**Scene 1:** "A single white paper note-to-self card with a strip of tape, handwritten-style serif text 'Ask Marco how his mom's surgery went' beside an empty checkbox, on a warm cream paper background, soft weekday labels in pill shapes streaking past with motion blur, gentle wind carrying the card out of frame." Negative prompt: "no clutter, no stock-photo people, no emoji, no harsh shadows." Aspect ratio: 16:9. Style/mood: warm, calm, quietly bittersweet, editorial minimal.

**Scene 2:** "Two chat bubbles on a warm cream background, one white and one terracotta, slowly fading to grey while a dotted vertical line grows below them with the labels '1 week', '1 month', '3 months' getting fainter." Negative prompt: "no app logos, no phone frame, no emoji." Aspect ratio: 16:9. Style/mood: quiet, gentle, wistful, minimal.

**Scene 3:** "A terracotta speech-bubble logo with five cream waveform bars and the serif wordmark 'Holdfast' on a warm cream background, the bars pulsing like a voice, a soft ring expanding outward." Negative prompt: "no gradients on the logo, no 3D chrome, no extra icons." Aspect ratio: 16:9. Style/mood: warm, confident, friendly, uncluttered.

**Scene 4:** "A modern smartphone in gentle 3D perspective showing a warm-toned chat with a bot named Holdfast, a thumb holding the microphone button with soft ripples, a live audio waveform in the input bar, and large italic serif words appearing beside the phone." Negative prompt: "no real messaging-app branding, no notification clutter, no readable personal data." Aspect ratio: 16:9. Style/mood: tactile, intimate, calm, product-demo clarity.

**Scene 5:** "A white transcript card on a cream background with phrases highlighted in terracotta and sand, three small cards labeled 'Who you saw', 'What's going on', and 'What you promised' flying out of the text into a row, with the third card emphasized by a terracotta border." Negative prompt: "no spreadsheets, no CRM dashboards, no charts." Aspect ratio: 16:9. Style/mood: organized, satisfying, clear, kind.

**Scene 6:** "A calendar tile flipping from 14 to 15 beside a phone that buzzes with a notification reading 'Marco's mom had surgery yesterday. Ask how it went.', and below, a row of seven day circles with three filled in terracotta." Negative prompt: "no red alert badges, no overwhelming notification stacks." Aspect ratio: 16:9. Style/mood: timely, reassuring, light, never naggy.

**Scene 7:** "A terracotta voice-note pill whose white waveform bars fly in an arc into a white text card and turn into lines of text, while the empty pill dissolves into small particles; small labels 'Audio deleted' and 'Text saved'." Negative prompt: "no padlocks, no shields, no hacker imagery, no dark backgrounds." Aspect ratio: 16:9. Style/mood: trustworthy, plain-spoken, calm.

**Scene 8:** "A centered end card on warm cream: the terracotta speech-bubble logo and 'Holdfast' wordmark, the serif line 'Say it out loud once. Holdfast remembers the rest.' with 'remembers' in terracotta italic, a terracotta 'Join the waitlist' button, and 'useholdfast.co' underlined by hand." Negative prompt: "no countdown timers, no urgency banners, no emoji." Aspect ratio: 16:9. Style/mood: warm, resolved, inviting.

## Aspect Ratio & Format per Platform

| Platform | Aspect Ratio | File Type |
|---|---|---|
| Website homepage (rendered) | 16:9, 1920x1080 | MP4 (H.264 + AAC 192 kbps), WebVTT captions, PNG poster |
| YouTube (reuse as-is) | 16:9 | MP4 |
| LinkedIn / X (reuse as-is) | 16:9 | MP4, captions burned in or uploaded as .vtt/.srt |
| Reels / TikTok / Shorts (not built yet) | 9:16, 1080x1920 | MP4 |

## Style & Mood Guide

- **Palette (from the live site):** cream `#FBF7F2`, warm cream `#F4EDE4`, ink `#2A2320`, soft ink `#5C524B`, terracotta `#B4552D`, deep terracotta `#8E3F1E`, line `#E3D8CA`.
- **Type:** Fraunces for headlines (italic for spoken words and emphasis), Inter for UI and labels.
- **Tone:** warm, encouraging, no guilt. The reframe "Forgetting isn't the same as not caring" carries the ADHD message without naming a diagnosis.
- **Pacing:** one idea on screen at a time. Every entrance is spring-based and lands on the word that names it. Scenes overlap by about half a second so nothing hard-cuts.
- **Motion vocabulary:** spring pops for messages, word-by-word kinetic type, a persistent logo that travels between scenes, a 3D phone with idle float and a buzz, a scan-line transcription, highlight swipes, arc flights, a calendar flip, and a particle dissolve.
- **Music:** original, synthesized for this video, so no licensing. 84 BPM. It opens sparse and minor (Am7, Fmaj7) under the problem, rises into a warm I-V-vi-IV with harp plucks and a soft kick on the logo downbeat, drops back for privacy, and resolves on Cadd9 at the end card. It ducks about 9 dB under the voice.
- **Sound design:** bubble pops, whooshes on scene moves, a record-start blip, typing ticks during the scan, marker swipes on highlights, a two-note chime for the nudge, rising tones as the week dots fill, and a sparkle on the audio dissolve.
- **Loudness:** -16 LUFS integrated, -1.2 dBFS peak, the usual web and streaming target.

## Generation Status / Next Steps

- **Generated, for real:** `../holdfast-video/out/holdfast-explainer.mp4` was rendered locally with Remotion (React-based video). The voice came from OpenAI's speech API using the project's `OPENAI_API_KEY`, and Whisper supplied word timestamps for sync. Total API cost was a few cents.
- **Not used:** no image- or video-generation MCP tool. Figma Weave is connected but not linked to a Weave account (link it at app.weavy.ai, profile settings).
- **AI voice disclosure:** OpenAI's usage policies require telling listeners the voice is AI-generated. The end card says "Voiceover is AI-generated." Keep that line if you re-edit.
- **To change a line:** edit `script.json`, delete that clip's `build/vo/<id>.wav` and `.words.json`, then run the three commands in `../holdfast-video/README.md`. All timing re-flows automatically.
- **Possible next steps:** embed on the homepage (click-to-play with poster and captions, since browsers block autoplay with sound), cut a 9:16 version for socials, cut a 30s teaser.
