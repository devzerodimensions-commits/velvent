import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Bringing the database up to date with schema.sql.
 *
 * This runs when the server boots, not when it is built. The build happens in
 * a sandbox that need not have the database reachable or DATABASE_URL set,
 * while the running server, by definition, has both — it cannot serve a single
 * page without them. Putting the migration anywhere else makes a deploy depend
 * on database access from a place that was never promised it.
 *
 * schema.sql is entirely CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT
 * EXISTS, so this is a no-op on every boot where nothing has changed.
 */

/** Rupee signs in the catalog need UTF8. Neon always is; a local cluster may not be. */
export async function assertUtf8() {
  const { rows } = await query(
    'SELECT pg_encoding_to_char(encoding) AS enc FROM pg_database WHERE datname = current_database()',
  );
  if (rows[0]?.enc !== 'UTF8') {
    throw new Error(
      `This database uses ${rows[0]?.enc} encoding, not UTF8. Currency symbols will fail to save.`
      + " Recreate it with: CREATE DATABASE <name> WITH ENCODING 'UTF8' TEMPLATE template0;",
    );
  }
}

export const DROP_ALL = `
DROP TABLE IF EXISTS order_items, orders, wishlist, reviews, addresses,
  product_variants, product_images, products, categories, coupons,
  media, newsletter, contact_messages, site_content, users CASCADE;
`;

export async function applySchema() {
  const sql = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
  await query(sql);
}

/**
 * The boot-time call. A failure here stops the server starting, so Render's
 * health check fails and the previous version keeps serving — the same
 * protection running it at build time was meant to give, without needing the
 * builder to reach the database.
 */
export async function migrateOnBoot() {
  try {
    await assertUtf8();
    await applySchema();
    console.log('[velvent] schema up to date.');
  } catch (err) {
    console.error('\n[velvent] could not apply the database schema:', err.message);
    console.error('[velvent] refusing to start with a schema the code does not expect.\n');
    process.exit(1);
  }
}
