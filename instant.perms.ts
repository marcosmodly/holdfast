import type { InstantRules } from '@instantdb/core';

// Writes happen server-side via the admin token (the Telegram bot backend
// and the cron nudge engine), which bypasses these rules entirely. No
// client-side user auth exists yet (see CLAUDE.md "Out of scope"), so every
// namespace is deny-all, including view. The web view's client-side reads
// (see CLAUDE.md non-negotiable #10) are closed off until they can be
// scoped to an authenticated owner.
const rules = {
  $default: {
    allow: {
      $default: 'false',
    },
  },
  profiles: {
    allow: {
      view: 'false',
    },
  },
  people: {
    allow: {
      view: 'false',
    },
  },
  facts: {
    allow: {
      view: 'false',
    },
  },
  commitments: {
    allow: {
      view: 'false',
    },
  },
  captures: {
    allow: {
      view: 'false',
    },
  },
  // Capture audio is uploaded, read and deleted only by the webhook via the
  // admin SDK, which skips these checks. Any client rule here would let an
  // anonymous caller with the public app id read, upload or delete audio.
  $files: {
    allow: {
      view: 'false',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  // No client access at all — every write goes through /api/waitlist using
  // the admin token. A public create rule would let anyone dump junk in.
  waitlist: {
    allow: {
      view: 'false',
      create: 'false',
      update: 'false',
      delete: 'false',
    },
  },
} satisfies InstantRules;

export default rules;
