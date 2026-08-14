import { init } from '@instantdb/admin';
import schema from '../../instant.schema';

const appId = process.env.HOLDFAST_INSTANT_APP_ID;
const adminToken = process.env.HOLDFAST_INSTANT_ADMIN_TOKEN;

if (!appId) {
  throw new Error('Missing HOLDFAST_INSTANT_APP_ID environment variable');
}

if (!adminToken) {
  throw new Error('Missing HOLDFAST_INSTANT_ADMIN_TOKEN environment variable');
}

export const db = init({
  appId,
  adminToken,
  schema,
});
