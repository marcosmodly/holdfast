import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $users: i.entity({}),
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    profiles: i.entity({
      telegramChatId: i.string().unique().indexed().optional(),
      plan: i.string(),
      trialEndsAt: i.date().optional(),
    }),
    people: i.entity({
      name: i.string().indexed(),
      tier: i.string(),
      cadenceDays: i.number(),
      lastContactAt: i.date().indexed().optional(),
    }),
    captures: i.entity({
      transcript: i.string(),
      createdAt: i.date().indexed(),
    }),
    facts: i.entity({
      type: i.string(),
      content: i.string(),
      eventDate: i.date().indexed().optional(),
      confidence: i.number(),
    }),
    commitments: i.entity({
      description: i.string(),
      dueDate: i.date().indexed().optional(),
      status: i.string().indexed(),
    }),
    nudges: i.entity({
      kind: i.string(),
      priority: i.number(),
      scheduledFor: i.date().indexed(),
      sentAt: i.date().indexed().optional(),
      actedOn: i.boolean(),
    }),
    waitlist: i.entity({
      email: i.string().indexed().unique(),
      createdAt: i.number().indexed(),
      source: i.string().optional(), // "tiktok" | "youtube" | "direct" — from ?ref=
    }),
  },
  links: {
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    personOwner: {
      forward: { on: 'people', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'people' },
    },
    capturePerson: {
      forward: {
        on: 'captures',
        has: 'one',
        label: 'person',
        onDelete: 'cascade',
      },
      reverse: { on: 'people', has: 'many', label: 'captures' },
    },
    factPerson: {
      forward: {
        on: 'facts',
        has: 'one',
        label: 'person',
        onDelete: 'cascade',
      },
      reverse: { on: 'people', has: 'many', label: 'facts' },
    },
    factCapture: {
      forward: { on: 'facts', has: 'one', label: 'capture' },
      reverse: { on: 'captures', has: 'many', label: 'facts' },
    },
    commitmentPerson: {
      forward: {
        on: 'commitments',
        has: 'one',
        label: 'person',
        onDelete: 'cascade',
      },
      reverse: { on: 'people', has: 'many', label: 'commitments' },
    },
    nudgePerson: {
      forward: { on: 'nudges', has: 'one', label: 'person' },
      reverse: { on: 'people', has: 'many', label: 'nudges' },
    },
    nudgeCommitment: {
      forward: { on: 'nudges', has: 'one', label: 'commitment' },
      reverse: { on: 'commitments', has: 'many', label: 'nudges' },
    },
    personProfile: {
      forward: { on: 'people', has: 'one', label: 'profile' },
      reverse: { on: 'profiles', has: 'many', label: 'people' },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
