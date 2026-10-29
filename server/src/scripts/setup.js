import dotenv from 'dotenv';
import { pool, query } from '../db.js';
import { DROP_ALL, applySchema, assertUtf8 } from '../lib/migrate.js';

dotenv.config();

/**
 * Applying the schema by hand.
 *
 * The server does this for itself on every boot, so this script is for the
 * cases that are not a boot: setting a fresh database up before anything runs,
 * and `--drop` to wipe and start over. Both share the server's own migration
 * code so the two can never apply different schemas.
 */
const run = async () => {
  await assertUtf8();

  if (process.argv.includes('--drop')) {
    console.log('[velvent] dropping existing tables…');
    await query(DROP_ALL);
  }

  await applySchema();
  console.log('[velvent] schema applied.');
  await pool.end();
};

run().catch((err) => {
  console.error('[velvent] setup failed:', err.message);
  process.exit(1);
});
