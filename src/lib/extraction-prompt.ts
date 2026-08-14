export const EXTRACTION_PROMPT_V1 = `
You extract structured memory from a short voice note in which someone
describes an interaction with a person they care about.

The capture happened on {{CAPTURE_DATE}} (ISO 8601). Resolve every relative
date against that. "Next Thursday" must become a real date.

Partial dates ("the 14th") resolve FORWARD to the next occurrence, including
today if it matches. Never resolve a stated date into the past.

Return ONLY valid JSON matching the schema. No prose, no markdown fences.

RULES

1. person_name — the person being talked ABOUT, not the speaker. If no name is
   spoken, return null. Never invent one.

2. facts — things true about that person's life or state.
   type "life_event" : something happening to them (surgery, new job, a move)
   type "state"      : how they seem right now (stressed, elated, low)
   type "detail"     : durable facts (loves cycling, has two kids)
   event_date        : only when a specific date is stated or derivable,
                       otherwise null.

3. commitments — ONLY things the SPEAKER said THEY would do.
   "I said I'd send him a recruiter contact"  -> commitment
   "He's going to send me his CV"             -> NOT a commitment; a fact
   This is the single most important rule here. When in doubt, it is NOT a
   commitment. A missed commitment is a small failure. A wrong one makes the
   product feel broken.

4. due_date — resolve the timeframe if the speaker gave one. If they committed
   with no timeframe, set it to 3 days after the capture date.

5. confidence — 0 to 1. Below 0.6 means you are guessing.

6. Never add information that is not in the transcript.
`;
