import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../lib/helpers.js';

const router = Router();

const PRODUCT_CARD = `
  p.id, p.slug, p.name, p.short_desc, p.mrp, p.sale_price, p.rating, p.review_count,
  p.is_new, p.is_featured, c.slug AS category_slug, c.name AS category_name,
  COALESCE((SELECT json_agg(x) FROM (
      SELECT url, alt, color FROM product_images pi
       WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 4
  ) x), '[]'::json) AS images,
  COALESCE((SELECT json_agg(DISTINCT jsonb_build_object('color', v.color, 'hex', v.color_hex))
              FROM product_variants v WHERE v.product_id = p.id), '[]'::json) AS colors,
  COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id), 0) AS total_stock
`;

/** GET /api/categories */
router.get('/categories', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM products p
                   WHERE p.category_id = c.id AND p.is_active) AS product_count
       FROM categories c
      WHERE c.is_active
      ORDER BY c.sort_order, c.id`,
  );
  res.json(rows);
}));

/**
 * GET /api/products
 * Filters: category, size, color, minPrice, maxPrice, q, featured, sort, page, limit
 */
router.get('/products', ah(async (req, res) => {
  const {
    category, size, color, minPrice, maxPrice, q,
    featured, sort = 'curated',
  } = req.query;

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  const where = ['p.is_active'];
  const params = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('$?', `$${params.length}`)); };

  if (category) add('c.slug = $?', category);
  if (featured === 'true') where.push('p.is_featured');
  if (q) {
    params.push(`%${q}%`);
    const n = params.length;
    where.push(`(p.name ILIKE $${n} OR p.short_desc ILIKE $${n} OR c.name ILIKE $${n})`);
  }
  if (minPrice) add('p.sale_price >= $?', Number(minPrice));
  if (maxPrice) add('p.sale_price <= $?', Number(maxPrice));
  if (size) {
    const sizes = String(size).split(',').filter(Boolean);
    add('EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.size = ANY($?::text[]) AND v.stock > 0)', sizes);
  }
  if (color) {
    const colors = String(color).split(',').filter(Boolean);
    add('EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.color = ANY($?::text[]))', colors);
  }

  const orderBy = {
    /* The order the shop chose for itself, set by dragging in the admin.
       Named 'curated' rather than 'featured' because `featured` is already a
       filter on this endpoint, and one word meaning two things in the same
       query string is a bug waiting to be written. */
    curated: 'p.sort_order, p.id',
    newest: 'p.created_at DESC, p.id DESC',
    'price-asc': 'p.sale_price ASC, p.id',
    'price-desc': 'p.sale_price DESC, p.id',
    popular: 'p.review_count DESC, p.rating DESC, p.id',
    name: 'p.name ASC',
  }[sort] || 'p.sort_order, p.id';

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(
      `SELECT ${PRODUCT_CARD}
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
         ${whereSql}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${offset}`,
      params,
    ),
    query(
      `SELECT COUNT(*)::int AS n FROM products p
         LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
      params,
    ),
  ]);

  const total = countRows[0].n;
  res.json({ products: rows, page, limit, total, pages: Math.ceil(total / limit) || 1 });
}));

/** GET /api/products/filters — the facet values the shop sidebar offers */
router.get('/products/filters', ah(async (_req, res) => {
  const [sizes, colors, price] = await Promise.all([
    query(`SELECT DISTINCT size FROM product_variants`),
    query(`SELECT color, MIN(color_hex) AS hex, COUNT(*)::int AS n
             FROM product_variants GROUP BY color ORDER BY color`),
    query(`SELECT COALESCE(MIN(sale_price),0) AS min, COALESCE(MAX(sale_price),0) AS max
             FROM products WHERE is_active`),
  ]);
  const ORDER = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
  res.json({
    sizes: sizes.rows.map((r) => r.size).sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)),
    colors: colors.rows,
    price: { min: Number(price.rows[0].min), max: Number(price.rows[0].max) },
  });
}));

/** GET /api/products/:slug */
router.get('/products/:slug', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name,
       COALESCE((SELECT json_agg(x) FROM (
           SELECT id, url, alt, color, sort_order FROM product_images pi
            WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id) x), '[]'::json) AS images,
       COALESCE((SELECT json_agg(x) FROM (
           SELECT id, size, color, color_hex, sku, stock FROM product_variants v
            WHERE v.product_id = p.id
            ORDER BY v.color, array_position(ARRAY['S','M','L','XL','XXL','3XL'], v.size)) x), '[]'::json) AS variants
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.is_active`,
    [req.params.slug],
  );
  if (!rows[0]) return res.status(404).json({ error: 'That product could not be found.' });

  const product = rows[0];
  const { rows: related } = await query(
    `SELECT ${PRODUCT_CARD}
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active AND p.id <> $1
        AND (p.category_id = $2 OR $2 IS NULL)
      ORDER BY RANDOM() LIMIT 4`,
    [product.id, product.category_id],
  );
  const { rows: reviews } = await query(
    `SELECT id, author, rating, title, body, created_at FROM reviews
      WHERE product_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [product.id],
  );
  res.json({ ...product, related, reviews });
}));

/** POST /api/products/:slug/reviews */
router.post('/products/:slug/reviews', ah(async (req, res) => {
  const { author, rating, title, body } = req.body || {};
  const r = Math.round(Number(rating));
  if (!author?.trim()) return res.status(400).json({ error: 'Please add your name.' });
  if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: 'Pick a rating from 1 to 5.' });

  const { rows: p } = await query('SELECT id FROM products WHERE slug = $1', [req.params.slug]);
  if (!p[0]) return res.status(404).json({ error: 'That product could not be found.' });

  await query(
    `INSERT INTO reviews (product_id, user_id, author, rating, title, body)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [p[0].id, req.user?.id || null, author.trim().slice(0, 60), r,
     (title || '').slice(0, 120), (body || '').slice(0, 2000)],
  );
  await query(
    `UPDATE products SET
       rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = $1),
       review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
     WHERE id = $1`,
    [p[0].id],
  );
  res.status(201).json({ ok: true });
}));

export default router;
