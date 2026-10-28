import { query } from '../db.js';

/**
 * Admin-edited site copy, read straight out of `site_content`.
 *
 * The storefront ships its own defaults for every field, so this module only
 * ever deals in overrides: whatever the admin has actually saved. The one
 * exception is shipping, which the server must agree with the browser about —
 * an order is priced here, so the numbers behind that price are read here too
 * rather than trusted from the cart.
 */

const TTL_MS = 30_000;

let cache = null;
let cachedAt = 0;
let inFlight = null;

/** Numbers the store falls back to when nothing has been saved yet. */
export const SHIPPING_DEFAULTS = {
  freeAbove: 999,
  fee: 79,
  dispatchDays: '24–48 hours',
  deliveryDays: '3–6 business days',
  returnDays: 7,
};

async function read() {
  const { rows } = await query('SELECT key, value FROM site_content');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Every saved key, as `{ key: value }`. Cached briefly so the cart and the
 * footer do not each cost a round trip; `invalidateContent` makes an admin
 * save show up at once rather than up to a TTL later.
 */
export async function getContent({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL_MS) return cache;
  if (inFlight) return inFlight;

  inFlight = read()
    .then((data) => {
      cache = data;
      cachedAt = Date.now();
      return data;
    })
    .catch((err) => {
      // A content read must never take the storefront down: fall back to
      // whatever we last saw, or to nothing at all and let defaults win.
      console.error('[velvent] site_content read failed:', err.message);
      return cache || {};
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}

export function invalidateContent() {
  cache = null;
  cachedAt = 0;
}

/** The shipping rules an order is priced against. */
export async function getShipping() {
  const content = await getContent();
  const saved = content?.brand?.shipping;
  if (!saved || typeof saved !== 'object') return SHIPPING_DEFAULTS;

  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    ...SHIPPING_DEFAULTS,
    ...saved,
    freeAbove: num(saved.freeAbove, SHIPPING_DEFAULTS.freeAbove),
    fee: num(saved.fee, SHIPPING_DEFAULTS.fee),
    returnDays: num(saved.returnDays, SHIPPING_DEFAULTS.returnDays),
  };
}

/** Replaces one key outright. Values are stored as the admin sent them. */
export async function saveContent(key, value) {
  const { rows } = await query(
    `INSERT INTO site_content (key, value, updated_at)
          VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING key, value, updated_at`,
    [key, JSON.stringify(value)],
  );
  invalidateContent();
  return rows[0];
}

export async function deleteContent(key) {
  await query('DELETE FROM site_content WHERE key = $1', [key]);
  invalidateContent();
}
