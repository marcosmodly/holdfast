# Extraction test cases

Golden transcripts and expected output for `extract()` (`src/lib/extract.ts`,
prompt in `src/lib/extraction-prompt.ts`). Not wired into a test runner yet;
this is the fixture set to check the extraction prompt against, by hand or by
an eventual eval harness.

## Fixed reference

**Capture date: Friday, 2026-08-21.** Every date below is resolved against
this. `met_on` is always forced to the capture date by `extract()` regardless
of what the model returns (see `extract.ts:114`), so it's listed once here and
omitted from the per-case JSON: `"met_on": "2026-08-21"`.

Day-of-week lookup used below:

| Date | Day |
|---|---|
| 2026-08-21 | Friday (capture day) |
| 2026-08-22 | Saturday |
| 2026-08-24 | Monday |
| 2026-08-26 | Wednesday |
| 2026-08-27 | Thursday |
| 2026-08-28 | Friday (+7d) |
| 2026-09-14 | Monday |

### Resolution conventions assumed by these fixtures

- **Bare weekday** ("on Thursday") -> the next occurrence of that weekday
  strictly after the capture date (capture date itself doesn't recur since
  2026-08-21 is a Friday in every case below).
- **Weekday + time of day** ("Wednesday night") -> same rule, date only; the
  time of day stays in the fact/commitment text, not `event_date`.
- **Ordinal day-of-month** ("the 14th") -> forward-resolves per the prompt
  (`extraction-prompt.ts:8`): if the day number is <= the capture day, roll to
  next month.
- **"next week"** -> capture date + 7 days.
- **"this weekend"** -> the coming Saturday.
- **No timeframe stated for a commitment** -> capture date + 3 days, per
  prompt rule 4.

`confidence` is a model-assigned float, not deterministic. These fixtures
mark it `>= 0.6` (the prompt's own "guessing" threshold) rather than pinning
an exact value — treat any confidence at or above that as a pass.

As of V4, a commitment's `description` never names the person — asking the
model to do that reliably caused it to sometimes drop the person entirely
(see case 4's history). The nudge and reply templates prepend the name
instead ("Marco: you said you'd..."). `description` is just the bare action:
no first-person framing ("I'd", "I said I'd", etc.), but a pronoun left over
from the transcript ("send him...") is fine and expected, not a failure.

---

## 1. Bare weekday

> Grabbed lunch with Priya. Her presentation is on Thursday and she's nervous
> about it.

`Thursday` -> next Thursday after 2026-08-21 = **2026-08-27**.

```json
{
  "person_name": "Priya",
  "facts": [
    {
      "type": "life_event",
      "content": "has a presentation",
      "event_date": "2026-08-27",
      "confidence": ">=0.6"
    },
    {
      "type": "state",
      "content": "is nervous about her presentation",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "worried"
}
```

---

## 2. Weekday with a time of day

> Talked to Mateo. Wednesday night he's having dinner with his brother to
> patch things up.

`Wednesday night` -> next Wednesday after 2026-08-21 = **2026-08-26**. The
"night" qualifier stays in the fact text; `event_date` is date-only.

```json
{
  "person_name": "Mateo",
  "facts": [
    {
      "type": "life_event",
      "content": "is having dinner with his brother to patch things up",
      "event_date": "2026-08-26",
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "neutral"
}
```

---

## 3. Ordinal

> Caught up with Dana. Her apartment lease renewal is due the 14th and she's
> stressed about the rent increase.

`the 14th` -> 14 <= capture day 21, so roll forward to next month =
**2026-09-14**.

```json
{
  "person_name": "Dana",
  "facts": [
    {
      "type": "life_event",
      "content": "lease renewal is due",
      "event_date": "2026-09-14",
      "confidence": ">=0.6"
    },
    {
      "type": "state",
      "content": "is stressed about a rent increase",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "worried"
}
```

---

## 4. Relative date

> Ran into Sam at the gym. I told him I'd send over the trainer's contact info
> next week.

`next week` -> capture date + 7 days = **2026-08-28**.

```json
{
  "person_name": "Sam",
  "facts": [],
  "commitments": [
    {
      "description": "send over the trainer's contact info",
      "due_date": "2026-08-28"
    }
  ],
  "sentiment": "neutral"
}
```

---

## 5. No timeframe at all -> 3-day default

> Had coffee with Lena. She's planning a trip for her birthday. I told her I'd
> look into flight options for her.

No timeframe given for the commitment -> capture date + 3 days = **2026-08-24**.

```json
{
  "person_name": "Lena",
  "facts": [
    {
      "type": "life_event",
      "content": "is planning a trip for her birthday",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [
    {
      "description": "look into flight options for her birthday trip",
      "due_date": "2026-08-24"
    }
  ],
  "sentiment": "happy"
}
```

---

## 6. Commitment by ME

> Caught up with Jordan. He's job hunting and pretty stressed about it. I said
> I'd send him the recruiter contact I mentioned.

Speaker made the commitment ("I said I'd..."). No timeframe stated -> 3-day
default = **2026-08-24**.

```json
{
  "person_name": "Jordan",
  "facts": [
    {
      "type": "detail",
      "content": "is job hunting",
      "event_date": null,
      "confidence": ">=0.6"
    },
    {
      "type": "state",
      "content": "is stressed about job hunting",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [
    {
      "description": "send him the recruiter contact",
      "due_date": "2026-08-24"
    }
  ],
  "sentiment": "worried"
}
```

---

## 7. Commitment by THEM — must NOT become a commitment

> Talked to Marcus about the opening on my team. He said he'd send me his CV
> this weekend.

This is the single most load-bearing case in the set (prompt rule 3). Marcus
made the promise, not the speaker, so `commitments` **must be empty**. It
becomes a fact instead. `this weekend` -> coming Saturday = **2026-08-22**.

```json
{
  "person_name": "Marcus",
  "facts": [
    {
      "type": "life_event",
      "content": "will send his CV",
      "event_date": "2026-08-22",
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "neutral"
}
```

**Failure mode this guards against:** any commitment entry appearing with a
description like "send his CV" or similar — that would mean the extractor
attributed someone else's promise to the user.

---

## 8. Capture with no name, only pronouns

> She's doing so much better lately. Told me she's finally sleeping through
> the night again after the move.

No name is spoken anywhere in the transcript, only "she"/"her" -> `person_name`
must be `null`, never guessed or invented (prompt rule 1).

```json
{
  "person_name": null,
  "facts": [
    {
      "type": "life_event",
      "content": "moved recently",
      "event_date": null,
      "confidence": ">=0.6"
    },
    {
      "type": "state",
      "content": "is doing better and sleeping through the night again",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "happy"
}
```

---

## 9. Two people in one capture

> Had coffee with Elena this morning. She mentioned her brother Tom just got
> engaged.

The schema has a single `person_name` field, so it must resolve to the person
the speaker actually met with (Elena), per rule 1 ("the person being talked
ABOUT, not the speaker"). Tom is not the speaker either, but he isn't who was
met with — his news is folded into a fact about Elena rather than promoted to
a second person record, since none exists in the schema.

```json
{
  "person_name": "Elena",
  "facts": [
    {
      "type": "life_event",
      "content": "her brother Tom just got engaged",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "happy"
}
```

**Failure mode this guards against:** `person_name` coming back as `"Tom"`
(the most recently mentioned name) instead of Elena (who the capture is
actually about).

---

## 10. A fact with no date at all

> Caught up with Owen. He mentioned he's really into rock climbing these days.

A durable detail with no date stated anywhere and none derivable ->
`event_date` stays `null`. It must not be defaulted to the capture date or to
anything else.

```json
{
  "person_name": "Owen",
  "facts": [
    {
      "type": "detail",
      "content": "is really into rock climbing",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "neutral"
}
```

---

## 11. Stated but vague timeframe

> Caught up with Priya. Her presentation went great and she wants to
> celebrate properly. I told her I'd plan a dinner sometime after the
> holidays.

A timeframe IS stated ("sometime after the holidays"), it's just vague. Per
V2/V3 rule 4/6, that means `due_date` must NOT fall back to the no-timeframe
3-day default (2026-08-24) — that default is reserved strictly for
commitments where no timeframe was mentioned at all. Nothing else in this set
exercises a stated-but-unparseable timeframe; case 4 has a clean relative
date ("next week") and case 5 has no timeframe at all. This is the case V2's
rule 4 change was written for.

```json
{
  "person_name": "Priya",
  "facts": [
    {
      "type": "life_event",
      "content": "her presentation went great",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [
    {
      "description": "plan a dinner to celebrate",
      "due_date": ">2026-08-24"
    }
  ],
  "sentiment": "happy"
}
```

**Pass condition:** `due_date` is a valid date strictly after 2026-08-24. A
result of exactly 2026-08-24 is a fail even though it looks plausible in
isolation, because it means the model silently applied the no-timeframe
default to a commitment that DID have a stated timeframe. (V1 has no
instruction to resolve vague-but-stated timeframes at all, so it is expected
to fail this case by falling back to the 3-day default.)

---

## 12. Likely-hallucinated commitment — must be dropped, not just avoided

> Grabbed a drink with Noah. He's overwhelmed moving into his new place next
> month. We talked about maybe getting a group together to help him carry
> boxes.

No one commits to anything here. "We talked about maybe" is collaborative,
speculative language, not a promise by the speaker ("I'll organize people to
help him move" is a plausible but invented completion). This is the case
rule 3 (V1/V2/V3) is supposed to prevent outright, by wording alone. It
exists specifically to verify the code-level backstop: under V3, if the model
extracts a commitment here anyway, its `evidence` field cannot be a real
substring of the transcript (no words commit the speaker to anything), so
`persist.ts`'s evidence check must drop it even though the prompt rule alone
did not.

```json
{
  "person_name": "Noah",
  "facts": [
    {
      "type": "life_event",
      "content": "is moving into a new place next month",
      "event_date": null,
      "confidence": ">=0.6"
    },
    {
      "type": "state",
      "content": "is overwhelmed about the move",
      "event_date": null,
      "confidence": ">=0.6"
    }
  ],
  "commitments": [],
  "sentiment": "worried"
}
```

**Failure mode this guards against:** a commitment like "help Noah carry
boxes" or "organize a group to help Noah move" appearing in the raw
extraction. Under V3 that is graded PASS only if either (a) the model
correctly withheld it, or (b) it appeared in the raw extraction but was
removed by the persist-layer evidence check before reaching storage. Under
V1/V2, which have no evidence field to fall back on, wording is the only
defense and any such commitment surviving to raw output is a fail.
