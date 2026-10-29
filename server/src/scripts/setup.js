import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool } from '../db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DROP = `
DROP TABLE IF EXISTS order_items, orders, wishlist, reviews, addresses,
  product_variants, product_images, products, categories, coupons,
  media, newsletter, contact_messages, site_content, users CASCADE;
`;

/** Rupee signs in the catalog need UTF8. Neon always is; a local cluster may not be. */
async function assertUtf8() {
  const { rows } = await pool.query(
    'SELECT pg_encoding_to_char(encoding) AS enc FROM pg_database WHERE datname = current_database()',
  );
  if (rows[0]?.enc !== 'UTF8') {
    console.error(
      `\n[velvent] This database uses ${rows[0]?.enc} encoding, not UTF8.`
      + '\n           Currency symbols will fail to save. Recreate it with:'
      + "\n           CREATE DATABASE <name> WITH ENCODING 'UTF8' TEMPLATE template0;\n",
    );
    process.exit(1);
  }
}

const run = async () => {
  const drop = process.argv.includes('--drop');
  await assertUtf8();
  if (drop) {
    console.log('[velvent] dropping existing tables…');
    await pool.query(DROP);
  }
  const sql = fs.readFileSync(path.resolve(__dirname, '../schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[velvent] schema applied.');
  await pool.end();
};

run().catch((err) => {
  console.error('[velvent] setup failed:', err.message);
  process.exit(1);
});
