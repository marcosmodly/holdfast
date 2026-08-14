import { init } from '@instantdb/react';
import schema from '../../instant.schema';

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export const db = init({
  appId: requireEnv('NEXT_PUBLIC_HOLDFAST_INSTANT_APP_ID', process.env.NEXT_PUBLIC_HOLDFAST_INSTANT_APP_ID),
  schema,
});

export const PROFILE_ID = requireEnv(
  'NEXT_PUBLIC_HOLDFAST_PROFILE_ID',
  process.env.NEXT_PUBLIC_HOLDFAST_PROFILE_ID,
);
