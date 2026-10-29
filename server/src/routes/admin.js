import { Router } from 'express';
import multer from 'multer';
import { query, withTransaction } from '../db.js';
import { ah, slugify } from '../lib/helpers.js';
import { requireAdmin } from '../lib/auth.js';
import { ORDER_STATUS_KEYS, NEEDS_ACTION, STOCK_ALREADY_RETURNED } from '../lib/orderStatus.js';
import { deleteContent, saveContent } from '../lib/content.js';

const router = Router();
router.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WEBP or AVIF images are allowed.'), ok);
  },
});

/* ---------------------------------------------------------------- dashboard */

router.get('/stats', ah(async (_req, res) => {
  const [orders, revenue, products, lowStock, recent, byDay] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE status = ANY($1::text[]))::int AS new_orders,
                  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS week
             FROM orders`, [NEEDS_ACTION]),
    // Money that never arrived is not revenue.
    query(`SELECT COALESCE(SUM(total),0)::float AS revenue
             FROM orders WHERE status <> ALL($1::text[])`, [['cancelled', 'refunded', 'failed']]),
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE is_active)::int AS active FROM products`),
    query(`SELECT p.name, v.size, v.color, v.stock, v.sku
             FROM product_variants v JOIN products p ON p.id = v.product_id
            WHERE v.stock <= 5 ORDER BY v.stock, p.name LIMIT 20`),
    query(`SELECT id, order_number, email, status, payment_method, payment_status, total, created_at
             FROM orders ORDER BY created_at DESC LIMIT 8`),
    query(`SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
                  COALESCE(SUM(o.total), 0)::float AS revenue,
                  COUNT(o.id)::int AS orders
             FROM generate_series(NOW() - INTERVAL '13 days', NOW(), INTERVAL '1 day') d
             LEFT JOIN orders o
               ON o.created_at::date = d::date
              AND o.status <> ALL(ARRAY['cancelled','refunded','failed'])
            GROUP BY d ORDER BY d`),
  ]);
  res.json({
    orders: orders.rows[0],
    revenue: revenue.rows[0].revenue,
    products: products.rows[0],
    lowStock: lowStock.rows,
    recentOrders: recent.rows,
    chart: byDay.rows,
  });
}));

/* ----------------------------------------------------------------- products */

router.get('/products', ah(async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : null;
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name,
            COALESCE((SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id), 0)::int AS stock,
            (SELECT url FROM product_images pi WHERE pi.product_id = p.id
              ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE ($1::text IS NULL OR p.name ILIKE $1)
      ORDER BY p.id DESC`,
    [q],
  );
  res.json(rows);
}));

router.get('/products/:id', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*,
       COALESCE((SELECT json_agg(x) FROM (
         SELECT id, url, alt, color, sort_order FROM product_images pi
          WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id) x), '[]'::json) AS images,
       COALESCE((SELECT json_agg(x) FROM (
         SELECT id, size, color, color_hex, sku, stock FROM product_variants v
          WHERE v.product_id = p.id ORDER BY v.color, v.id) x), '[]'::json) AS variants
       FROM products p WHERE p.id = $1`,
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
  res.json(rows[0]);
}));

const PRODUCT_FIELDS = ['name', 'category_id', 'short_desc', 'description', 'mrp', 'sale_price',
  'fabric', 'wash_care', 'fit', 'sleeve', 'collar', 'weight_grams',
  'is_active', 'is_featured', 'is_new', 'sort_order'];

router.post('/products', ah(async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim()) return res.status(400).json({ error: 'Product name is required.' });
  if (!(Number(b.sale_price) > 0)) return res.status(400).json({ error: 'Enter a sale price.' });

  const slug = await uniqueSlug(b.slug || b.name);
  const cols = ['slug', ...PRODUCT_FIELDS];
  const vals = [slug, ...PRODUCT_FIELDS.map((f) => normalise(f, b[f]))];
  const { rows } = await query(
    `INSERT INTO products (${cols.join(',')})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`,
    vals,
  );
  await replaceChildren(rows[0].id, b);
  res.status(201).json(rows[0]);
}));

router.put('/products/:id', ah(async (req, res) => {
  const b = req.body || {};
  const sets = PRODUCT_FIELDS.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const { rows } = await query(
    `UPDATE products SET ${sets} WHERE id = $1 RETURNING *`,
    [req.params.id, ...PRODUCT_FIELDS.map((f) => normalise(f, b[f]))],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
  await replaceChildren(rows[0].id, b);
  res.json(rows[0]);
}));

/**
 * Partial update, for the list table's Quick Edit and its bulk actions.
 * The full PUT above replaces every field and both child collections, which is
 * wrong when all the caller wants is to flip a product to draft.
 */
const QUICK_FIELDS = ['name', 'slug', 'mrp', 'sale_price', 'category_id',
  'is_active', 'is_featured', 'is_new', 'sort_order'];

router.patch('/products/:id', ah(async (req, res) => {
  const b = req.body || {};
  const vals = [req.params.id];
  const sets = [];

  for (const field of QUICK_FIELDS) {
    if (b[field] === undefined) continue;
    let value = normalise(field, b[field]);
    if (field === 'slug') {
      value = await uniqueSlug(b.slug || b.name || 'product', req.params.id);
    }
    vals.push(value);
    sets.push(`${field} = ${vals.length}`);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });

  const { rows } = await query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    vals,
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found.' });
  res.json(rows[0]);
}));

router.delete('/products/:id', ah(async (req, res) => {
  await query('DELETE FROM products WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/** Quick stock edit straight from the products table. */
router.put('/variants/:id/stock', ah(async (req, res) => {
  const stock = Math.max(0, parseInt(req.body?.stock, 10) || 0);
  const { rows } = await query('UPDATE product_variants SET stock = $2 WHERE id = $1 RETURNING *', [req.params.id, stock]);
  if (!rows[0]) return res.status(404).json({ error: 'Variant not found.' });
  res.json(rows[0]);
}));

function normalise(field, value) {
  if (value === undefined || value === '') {
    return ['is_active', 'is_featured', 'is_new'].includes(field) ? false
      : ['sort_order'].includes(field) ? 0 : null;
  }
  if (['is_active', 'is_featured', 'is_new'].includes(field)) return Boolean(value);
  if (['category_id', 'weight_grams', 'sort_order'].includes(field)) return parseInt(value, 10) || null;
  if (['mrp', 'sale_price'].includes(field)) return Number(value);
  return value;
}

async function uniqueSlug(base, exceptId = null) {
  const root = slugify(base) || 'product';
  let slug = root;
  for (let n = 2; ; n += 1) {
    const { rowCount } = await query(
      'SELECT 1 FROM products WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)',
      [slug, exceptId],
    );
    if (!rowCount) return slug;
    slug = `${root}-${n}`;
  }
}

/** Images and variants are sent as complete lists, so replace them wholesale. */
async function replaceChildren(productId, body) {
  await withTransaction(async (client) => {
    if (Array.isArray(body.images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      for (const [i, img] of body.images.entries()) {
        if (!img?.url) continue;
        await client.query(
          'INSERT INTO product_images (product_id, url, alt, color, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [productId, img.url, img.alt || null, img.color || null, img.sort_order ?? i],
        );
      }
    }
    if (Array.isArray(body.variants)) {
      const keep = body.variants.filter((v) => v?.size && v?.color);
      const ids = keep.map((v) => v.id).filter(Boolean);
      await client.query(
        `DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::int[]))`,
        [productId, ids.length ? ids : [0]],
      );
      for (const v of keep) {
        const sku = v.sku || `VLV-${productId}-${slugify(v.color).toUpperCase()}-${v.size}`;
        if (v.id) {
          await client.query(
            `UPDATE product_variants SET size=$2, color=$3, color_hex=$4, stock=$5
              WHERE id=$1 AND product_id=$6`,
            [v.id, v.size, v.color, v.color_hex || null, Math.max(0, parseInt(v.stock, 10) || 0), productId],
          );
        } else {
          await client.query(
            `INSERT INTO product_variants (product_id, size, color, color_hex, sku, stock)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (product_id, size, color)
             DO UPDATE SET stock = EXCLUDED.stock, color_hex = EXCLUDED.color_hex`,
            [productId, v.size, v.color, v.color_hex || null, sku, Math.max(0, parseInt(v.stock, 10) || 0)],
          );
        }
      }
    }
  });
}

/* --------------------------------------------------------------- categories */

router.get('/categories', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)::int AS product_count
       FROM categories c ORDER BY c.sort_order, c.id`,
  );
  res.json(rows);
}));

/**
 * Trims a size chart down to the shape the storefront reads, so a stray field
 * from a form cannot end up stored. An empty chart is stored as NULL, which is
 * what makes the storefront fall back to its built-in table.
 */
const cleanSizeChart = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const rows = Array.isArray(v.rows)
    ? v.rows
      .filter((r) => Array.isArray(r) && String(r[0] ?? '').trim())
      .map((r) => [String(r[0]).trim(), ...r.slice(1, 5).map((n) => (n === '' || n === null ? null : Number(n)))])
    : [];
  const howTo = Array.isArray(v.howTo)
    ? v.howTo
      .filter((s) => Array.isArray(s) && String(s[0] ?? '').trim() && String(s[1] ?? '').trim())
      .map((s) => [String(s[0]).trim(), String(s[1]).trim()])
    : [];
  const note = String(v.note ?? '').trim();
  if (!rows.length && !howTo.length && !note) return null;
  return { note, rows, howTo };
};

/** jsonb wants a string or null; an empty chart must clear the column. */
const chartParam = (v) => {
  const chart = cleanSizeChart(v);
  return chart ? JSON.stringify(chart) : null;
};

router.post('/categories', ah(async (req, res) => {
  const b = req.body || {};
  if (!b.name?.trim()) return res.status(400).json({ error: 'Category name is required.' });
  const { rows } = await query(
    `INSERT INTO categories (slug, name, tagline, description, image_url, sort_order, is_active, size_chart)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
    [slugify(b.slug || b.name), b.name.trim(), b.tagline || null, b.description || null,
      b.image_url || null, parseInt(b.sort_order, 10) || 0, b.is_active !== false,
      chartParam(b.size_chart)],
  );
  res.status(201).json(rows[0]);
}));

router.put('/categories/:id', ah(async (req, res) => {
  const b = req.body || {};
  const { rows } = await query(
    `UPDATE categories SET name=$2, tagline=$3, description=$4, image_url=$5, sort_order=$6,
            is_active=$7, size_chart=$8::jsonb
      WHERE id=$1 RETURNING *`,
    [req.params.id, b.name, b.tagline || null, b.description || null, b.image_url || null,
      parseInt(b.sort_order, 10) || 0, b.is_active !== false, chartParam(b.size_chart)],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found.' });
  res.json(rows[0]);
}));

router.delete('/categories/:id', ah(async (req, res) => {
  await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------- orders */

router.get('/orders', ah(async (req, res) => {
  const status = req.query.status || null;
  const { rows } = await query(
    `SELECT o.*, COALESCE((SELECT json_agg(i) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
       FROM orders o
      WHERE ($1::text IS NULL OR o.status = $1)
      ORDER BY o.created_at DESC LIMIT 200`,
    [status],
  );
  res.json(rows);
}));

router.put('/orders/:id/status', ah(async (req, res) => {
  const allowed = ORDER_STATUS_KEYS;
  const { status, payment_status } = req.body || {};
  if (status && !allowed.includes(status)) return res.status(400).json({ error: 'Unknown order status.' });

  const updated = await withTransaction(async (client) => {
    const { rows: before } = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id],
    );
    if (!before[0]) return null;

    const { rows } = await client.query(
      `UPDATE orders SET status = COALESCE($2, status),
                         payment_status = COALESCE($3, payment_status),
                         updated_at = NOW()
        WHERE id = $1 RETURNING *`,
      [req.params.id, status || null, payment_status || null],
    );

    // Cancelling from here has to return the stock, exactly as it does when a
    // customer cancels their own order.
    if (STOCK_ALREADY_RETURNED.includes(status) && !STOCK_ALREADY_RETURNED.includes(before[0].status)) {
      const { rows: items } = await client.query(
        'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
        [before[0].id],
      );
      for (const i of items) {
        if (i.variant_id) {
          await client.query(
            'UPDATE product_variants SET stock = stock + $2 WHERE id = $1',
            [i.variant_id, i.quantity],
          );
        }
      }
    }
    return rows[0];
  });

  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  res.json(updated);
}));

/* ---------------------------------------------------------- media + inbox */

/** Stores uploads in Postgres so images survive Render's ephemeral filesystem. */
router.post('/media', upload.single('file'), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose an image to upload.' });
  const { rows } = await query(
    'INSERT INTO media (filename, mime, bytes) VALUES ($1,$2,$3) RETURNING id',
    [req.file.originalname, req.file.mimetype, req.file.buffer],
  );
  res.status(201).json({ id: rows[0].id, url: `/api/media/${rows[0].id}` });
}));

router.get('/messages', ah(async (_req, res) => {
  const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200');
  res.json(rows);
}));

router.put('/messages/:id/read', ah(async (req, res) => {
  await query('UPDATE contact_messages SET is_read = TRUE WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

router.get('/subscribers', ah(async (_req, res) => {
  const { rows } = await query('SELECT * FROM newsletter ORDER BY created_at DESC LIMIT 500');
  res.json(rows);
}));

router.get('/coupons', ah(async (_req, res) => {
  const { rows } = await query('SELECT * FROM coupons ORDER BY id DESC');
  res.json(rows);
}));

router.post('/coupons', ah(async (req, res) => {
  const b = req.body || {};
  if (!b.code?.trim()) return res.status(400).json({ error: 'Enter a coupon code.' });
  const { rows } = await query(
    `INSERT INTO coupons (code, kind, value, min_order, max_discount, description, is_active, expires_at)
     VALUES (UPPER($1),$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (code) DO UPDATE SET kind=EXCLUDED.kind, value=EXCLUDED.value,
       min_order=EXCLUDED.min_order, max_discount=EXCLUDED.max_discount,
       description=EXCLUDED.description, is_active=EXCLUDED.is_active, expires_at=EXCLUDED.expires_at
     RETURNING *`,
    [b.code.trim(), b.kind || 'percent', Number(b.value) || 0, Number(b.min_order) || 0,
      b.max_discount ? Number(b.max_discount) : null, b.description || null,
      b.is_active !== false, b.expires_at || null],
  );
  res.status(201).json(rows[0]);
}));

router.delete('/coupons/:id', ah(async (req, res) => {
  await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

/* -------------------------------------------------------------- site content
   The storefront holds the defaults; these rows hold only what the admin has
   changed. Any shape is accepted because the editor on the client decides it —
   the one rule is that a key stores a JSON object, never a bare string, so a
   half-saved field can never collapse a whole section. */

const CONTENT_KEYS = new Set([
  'brand', 'header', 'footer',
  'home', 'about', 'contact', 'faq', 'sizeGuide', 'notFound',
  'shop', 'product', 'cart', 'checkout', 'account',
  'shipping', 'returns', 'privacy', 'terms',
]);

router.get('/content', ah(async (_req, res) => {
  const { rows } = await query('SELECT key, value, updated_at FROM site_content ORDER BY key');
  res.json(rows);
}));

router.put('/content/:key', ah(async (req, res) => {
  const key = String(req.params.key || '');
  if (!CONTENT_KEYS.has(key)) return res.status(400).json({ error: 'Unknown content section.' });

  const value = req.body?.value;
  if (value === null || typeof value !== 'object') {
    return res.status(400).json({ error: 'Content must be sent as an object.' });
  }
  if (JSON.stringify(value).length > 400000) {
    return res.status(413).json({ error: 'That section is too large to save.' });
  }

  res.json(await saveContent(key, value));
}));

/** Drops the overrides for one section, so the built-in copy shows again. */
router.delete('/content/:key', ah(async (req, res) => {
  if (!CONTENT_KEYS.has(String(req.params.key || ''))) {
    return res.status(400).json({ error: 'Unknown content section.' });
  }
  await deleteContent(req.params.key);
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ customers */

router.get('/customers', ah(async (req, res) => {
  const q = (req.query.q || '').trim();
  const params = [];
  let where = "WHERE u.role = 'customer'";
  if (q) {
    params.push(`%${q}%`);
    where += ' AND (u.name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1)';
  }
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.created_at,
            COUNT(o.id)::int                   AS orders,
            COALESCE(SUM(o.total), 0)::numeric AS spent,
            MAX(o.created_at)                  AS last_order_at
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id AND o.status <> 'cancelled'
       ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 500`,
    params,
  );
  res.json(rows);
}));

router.get('/customers/:id', ah(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
    [req.params.id],
  );
  const customer = rows[0];
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });

  const [{ rows: addresses }, { rows: orders }, { rows: wishlist }] = await Promise.all([
    query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC', [customer.id]),
    query(
      `SELECT id, order_number, status, payment_method, payment_status, total, created_at
         FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [customer.id],
    ),
    query(
      `SELECT p.id, p.name, p.slug FROM wishlist w
         JOIN products p ON p.id = w.product_id
        WHERE w.user_id = $1 ORDER BY w.id DESC LIMIT 50`,
      [customer.id],
    ),
  ]);

  res.json({ ...customer, addresses, orders, wishlist });
}));

/** Contact details only. An admin never sets or sees a customer's password. */
router.put('/customers/:id', ah(async (req, res) => {
  const { name, phone } = req.body || {};
  if (!String(name || '').trim()) return res.status(400).json({ error: 'Name cannot be empty.' });

  const { rows } = await query(
    `UPDATE users SET name = $1, phone = $2
      WHERE id = $3 AND role = 'customer'
      RETURNING id, name, email, phone, role, created_at`,
    [String(name).trim(), phone ? String(phone).trim() : null, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: 'Customer not found.' });
  res.json(rows[0]);
}));

/* ------------------------------------------------------------- media library */

router.get('/media', ah(async (_req, res) => {
  const { rows } = await query(
    `SELECT id, filename, mime, OCTET_LENGTH(bytes) AS bytes, created_at
       FROM media ORDER BY id DESC LIMIT 300`,
  );
  res.json(rows.map((r) => ({ ...r, bytes: Number(r.bytes), url: `/api/media/${r.id}` })));
}));

router.delete('/media/:id', ah(async (req, res) => {
  await query('DELETE FROM media WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

export default router;
