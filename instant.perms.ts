import type { InstantRules } from '@instantdb/core';

// Writes happen server-side via the admin token (the Telegram bot backend
// and the cron nudge engine), which bypasses these rules entirely. No
// client-side user auth exists yet (see CLAUDE.md "Out of scope"), so every
// namespace defaults to deny-all except the read-only web view's namespaces,
// which are open to any reader until auth ships (see CLAUDE.md
// non-negotiable #10).
const rules = {
  $default: {
    allow: {
      $default: 'false',
    },
  },
  profiles: {
    allow: {
      view: 'true',
    },
  },
  people: {
    allow: {
      view: 'true',
    },
  },
  facts: {
    allow: {
      view: 'true',
    },
  },
  commitments: {
    allow: {
      view: 'true',
    },
  },
  captures: {
    allow: {
      view: 'true',
    },
  },
  $files: {
    bind: {
      isCaptureAudio: "data.path.startsWith('captures/')",
    },
    allow: {
      view: 'isCaptureAudio',
      create: 'isCaptureAudio',
      delete: 'isCaptureAudio',
      update: 'false',
    },
  },
} satisfies InstantRules;

export default rules;
