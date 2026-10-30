import { Router } from 'express';
import { query } from '../db.js';
import { ah, isEmail } from '../lib/helpers.js';
import { findCoupon } from '../lib/pricing.js';
import { getContent } from '../lib/content.js';
import { getMediaStore } from '../lib/media/index.js';

const router = Router();

/** GET /api/health - used by Render's health check and for a quick post-deploy smoke test. */
router.get('/health', ah(async (_req, res) => {
  const { rows } = await query('SELECT NOW() AS now');
  const { rows: counts } = await query(
    `SELECT (SELECT COUNT(*) FROM products)::int   AS products,
            (SELECT COUNT(*) FROM categories)::int AS categories,
            (SELECT COUNT(*) FROM orders)::int     AS orders`,
  );
  res.json({ status: 'ok', db: 'connected', time: rows[0].now, counts: counts[0] });
}));

/** Serves an admin-uploaded image, from wherever this deployment keeps them. */
router.get('/media/:id', ah(async (req, res) => {
  const found = await getMediaStore().get(req.params.id);
  if (!found) return res.status(404).end();
  res.set('Content-Type', found.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(found.bytes);
}));

router.post('/newsletter', ah(async (req, res) => {
  const { email } = req.body || {};
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  await query('INSERT INTO newsletter (email) VALUES (LOWER($1)) ON CONFLICT DO NOTHING', [email]);
  res.status(201).json({ ok: true, message: 'You are on the list. Watch your inbox for first access.' });
}));

router.post('/contact', ah(async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (String(message || '').trim().length < 5) return res.status(400).json({ error: 'Please write your message.' });

  await query(
    'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5)',
    [name.trim().slice(0, 100), email.toLowerCase(), phone || null,
      (subject || 'General enquiry').slice(0, 150), message.trim().slice(0, 4000)],
  );
  res.status(201).json({ ok: true, message: 'Thanks for writing in. We reply within one business day.' });
}));

/** GET /api/coupons/:code - check a code before the customer reaches payment. */
router.get('/coupons/:code', ah(async (req, res) => {
  const coupon = await findCoupon({ query }, req.params.code);
  if (!coupon) return res.status(404).json({ error: 'That coupon code is not valid.' });
  res.json({
    code: coupon.code,
    kind: coupon.kind,
    value: Number(coupon.value),
    min_order: Number(coupon.min_order),
    max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
    description: coupon.description,
  });
}));

/** Coupons worth showing on the cart page. */
router.get('/offers', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT code, kind, value, min_order, max_discount, description FROM coupons
      WHERE is_active AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY min_order LIMIT 6`,
  );
  res.json(rows);
}));

/**
 * GET /api/content - every piece of copy the admin has edited.
 *
 * Only overrides come back; the storefront merges them over its own defaults,
 * so a fresh database still renders a complete store and a field nobody has
 * touched costs nothing to serve.
 */
router.get('/content', ah(async (_req, res) => {
  const content = await getContent();
  res.set('Cache-Control', 'public, max-age=30');
  res.json(content);
}));

export default router;
