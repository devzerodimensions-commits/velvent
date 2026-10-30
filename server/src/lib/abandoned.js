import { query } from '../db.js';

/**
 * Checkouts that were started and never finished.
 *
 * The cart itself lives in the browser, which is right — a shopper filling a
 * bag should not be writing to the database on every click. But once someone
 * has typed an email into checkout they have told the shop who they are, and
 * if the order never arrives that is worth knowing and worth a phone call.
 *
 * So one row per person, overwritten as they go, deleted the moment their
 * order is placed. A cart that became a sale is not abandoned.
 */

/** Rows older than this are personal data nobody is going to act on. */
export const RETENTION_DAYS = 60;

/** Upserts a shopper's unfinished checkout. */
export async function recordAbandoned({ email, name, phone, items, subtotal, userId }) {
  const { rows } = await query(
    `INSERT INTO abandoned_carts (email, name, phone, items, subtotal, user_id)
          VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     ON CONFLICT (LOWER(email)) DO UPDATE
            SET name       = COALESCE(EXCLUDED.name, abandoned_carts.name),
                phone      = COALESCE(EXCLUDED.phone, abandoned_carts.phone),
                items      = EXCLUDED.items,
                subtotal   = EXCLUDED.subtotal,
                user_id    = COALESCE(EXCLUDED.user_id, abandoned_carts.user_id),
                updated_at = NOW()
      RETURNING id`,
    [
      String(email).trim().toLowerCase(),
      name?.trim() || null,
      phone?.trim() || null,
      JSON.stringify(items),
      subtotal,
      userId || null,
    ],
  );
  return rows[0];
}

/**
 * Clears a shopper's row once they have ordered.
 *
 * Matched on email rather than user id because most orders here are placed by
 * guests, who have no account to match on. A failure is swallowed: an order
 * must never fail because the shop could not tidy up after itself.
 */
export async function clearAbandoned(email) {
  if (!email) return;
  try {
    await query('DELETE FROM abandoned_carts WHERE LOWER(email) = LOWER($1)', [email]);
  } catch (err) {
    console.error('[velvent] could not clear abandoned cart:', err.message);
  }
}

/**
 * Drops rows nobody is going to chase.
 *
 * Runs on boot rather than on a schedule, because a free instance has no
 * scheduler and restarts often enough that this is plenty. Keeping contact
 * details of people who did not buy, forever, is not something to leave to
 * whether someone remembers.
 */
export async function purgeAbandoned() {
  try {
    const { rowCount } = await query(
      `DELETE FROM abandoned_carts WHERE updated_at < NOW() - INTERVAL '${RETENTION_DAYS} days'`,
    );
    if (rowCount) console.log(`[velvent] cleared ${rowCount} abandoned cart(s) older than ${RETENTION_DAYS} days.`);
  } catch (err) {
    console.error('[velvent] abandoned cart purge failed:', err.message);
  }
}
