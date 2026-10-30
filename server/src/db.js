import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('\n[velvent] DATABASE_URL is not set. Copy server/.env.example to server/.env and add your Neon connection string.\n');
  process.exit(1);
}

/**
 * Whether to speak TLS to Postgres.
 *
 * DATABASE_SSL says it outright: "off" for a database on the same machine or
 * a private network, "on" to encrypt without checking the certificate, and
 * "verify" to check it as well — which is what you want over the open
 * internet and what a managed provider's certificate supports.
 *
 * Left unset, it guesses the way it always did: a host that looks local gets
 * no TLS, anything else gets TLS without verification. That guess is right
 * for Neon and for a laptop, and wrong in the interesting case — a Postgres
 * on your own server reached across a network — which is exactly why moving
 * host should not mean editing this file.
 */
function sslSetting() {
  switch ((process.env.DATABASE_SSL || '').toLowerCase()) {
    case 'off':
    case 'false':
      return false;
    case 'verify':
      return { rejectUnauthorized: true };
    case 'on':
    case 'true':
      return { rejectUnauthorized: false };
    default:
      return /localhost|127\.0\.0\.1|::1/.test(connectionString)
        ? false
        : { rejectUnauthorized: false };
  }
}

export const pool = new Pool({
  connectionString,
  ssl: sslSetting(),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (err) => console.error('[velvent] idle pg client error:', err.message));

export const query = (text, params) => pool.query(text, params);

/** Run a set of statements in a single transaction. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
