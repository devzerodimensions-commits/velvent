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

/**
 * Serves an admin-uploaded image or video, from wherever this deployment
 * keeps them.
 *
 * Video gets byte ranges. This is not an optimisation: Safari on iOS will not
 * play a <video> at all unless the server answers a Range request with a 206,
 * and most of this shop's customers are on a phone. Everything else is sent
 * whole, as before.
 */
router.get('/media/:id', ah(async (req, res) => {
  const found = await getMediaStore().get(req.params.id);
  if (!found) return res.status(404).end();

  res.set('Content-Type', found.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');

  const isVideo = String(found.mime || '').startsWith('video/');
  if (!isVideo) return res.send(found.bytes);

  const total = found.bytes.length;
  res.set('Accept-Ranges', 'bytes');

  const range = req.headers.range;
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(range || ''));
  if (!match) return res.send(found.bytes);

  /* An open-ended range ("bytes=0-") means to the end of the file. A suffix
     range ("bytes=-500") means the last 500 bytes. */
  let start = match[1] === '' ? total - Number(match[2]) : Number(match[1]);
  let end = match[1] === '' || match[2] === '' ? total - 1 : Number(match[2]);
  start = Math.max(0, Math.min(start, total - 1));
  end = Math.max(start, Math.min(end, total - 1));

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    res.set('Content-Range', `bytes */${total}`);
    return res.status(416).end();
  }

  res.status(206);
  res.set('Content-Range', `bytes ${start}-${end}/${total}`);
  res.set('Content-Length', String(end - start + 1));
  return res.end(found.bytes.subarray(start, end + 1));
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


/**
 * GET /api/pages/:slug — one published page for the storefront.
 *
 * Drafts are invisible here even to a signed-in admin: this is the shopper's
 * endpoint, and the admin previews through the builder instead. That keeps
 * "is it live?" answerable by looking at the site.
 */
router.get('/pages/:slug', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT slug, title, content, seo_title, seo_desc, updated_at
       FROM pages WHERE slug = $1 AND status = 'published'`,
    [String(req.params.slug || '').toLowerCase()],
  );
  if (!rows[0]) return res.status(404).json({ error: 'That page could not be found.' });
  res.json(rows[0]);
}));

/** Built pages the client asked to appear in the site navigation. */
router.get('/nav-pages', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT slug, title FROM pages
      WHERE status = 'published' AND show_in_nav ORDER BY title LIMIT 20`,
  );
  res.json(rows);
}));

export default router;
