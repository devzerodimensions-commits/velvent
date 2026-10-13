import dotenv from 'dotenv';
import { pool } from '../db.js';
import { hashPassword } from '../lib/auth.js';

dotenv.config();

const MRP = 1499;
const SALE = 1005;              // 33% off, as set by the brand
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const DEFAULT_STOCK = 25;       // per size, per colour — edit any of these in /admin

const CATEGORIES = [
  {
    slug: 'polo-t-shirt',
    name: 'Polo T-Shirt',
    tagline: 'Knitted collars, everyday polish',
    description:
      'Soft knitted cotton polos cut for daily wear. Ribbed collars that hold their shape, '
      + 'clean stripes and a regular fit that works from desk to dinner.',
    image_url: '/products/rugby-stripe-polo-1.jpg',
  },
  {
    slug: 'polo-shirt',
    name: 'Polo Shirt',
    tagline: 'Button-through knitwear',
    description:
      'Full button-through knitted shirts with an open camp collar. Relaxed through the body, '
      + 'tailored in detail — our most dressed-up knit.',
    image_url: '/products/vertical-stripe-shirt-olive-1.jpg',
  },
  {
    slug: 'oversized-t-shirt',
    name: 'Oversized T-Shirt',
    tagline: 'Relaxed cuts, heavy cotton',
    description:
      'Drop-shoulder tees in heavyweight knitted cotton. Boxy through the body, ribbed at the '
      + 'neck, built to keep its shape wash after wash.',
    image_url: '/products/monogram-oversized-tee-navy.svg',
  },
];

const base = {
  mrp: MRP,
  sale_price: SALE,
  fabric: 'Knitted Cotton',
  wash_care: 'Machine wash cold with like colours. Do not bleach. Tumble dry low. Warm iron on reverse.',
  weight_grams: 450,
};

const PRODUCTS = [
  {
    ...base,
    slug: 'rugby-stripe-knitted-polo',
    name: 'Rugby Stripe Knitted Polo',
    category: 'polo-t-shirt',
    short_desc: 'Full-sleeve knitted polo in a bold block stripe.',
    description:
      'A full-sleeve take on the knitted polo, worked in wide block stripes of black and off-white. '
      + 'The ribbed collar is tipped in a contrast line, the three-button placket sits flat, and the '
      + 'knitted cotton has enough weight to drape without clinging. Wear it over denim now, under a '
      + 'jacket later.',
    fit: 'Regular Fit',
    sleeve: 'Full Sleeve',
    collar: 'Ribbed polo collar with contrast tipping',
    is_featured: true,
    is_new: true,
    images: [{ url: '/products/rugby-stripe-polo-1.jpg', color: 'Black / White' }],
    colors: [{ name: 'Black / White', hex: '#1A1D22' }],
  },
  {
    ...base,
    slug: 'heritage-stripe-knitted-polo',
    name: 'Heritage Stripe Knitted Polo',
    category: 'polo-t-shirt',
    short_desc: 'Fine horizontal stripes with a contrast knitted collar.',
    description:
      'Narrow horizontal stripes across a fine-gauge cotton knit, finished with a solid contrast '
      + 'collar and placket. Lighter than our block-stripe polos and easy to layer — a quiet, '
      + 'retro-leaning piece that reads smart without trying.',
    fit: 'Regular Fit',
    sleeve: 'Half Sleeve',
    collar: 'Contrast knitted collar',
    is_featured: true,
    images: [{ url: '/products/fine-stripe-polo-1.jpg', color: 'Black / White' }],
    colors: [{ name: 'Black / White', hex: '#23262B' }],
  },
  {
    ...base,
    slug: 'cable-knit-contrast-polo',
    name: 'Cable Knit Contrast Polo',
    category: 'polo-t-shirt',
    short_desc: 'Textured cable panels with a contrast collar and placket.',
    description:
      'Vertical cable panels run the length of the body, catching light across the texture. '
      + 'The contrast collar and placket are knitted in, not stitched on, so the finish stays flat '
      + 'through the wash. Our most tactile polo, in two deep seasonal shades.',
    fit: 'Regular Fit',
    sleeve: 'Half Sleeve',
    collar: 'Contrast knitted collar with tipped edge',
    is_featured: true,
    is_new: true,
    images: [
      { url: '/products/cable-knit-polo-burgundy-1.jpg', color: 'Wine' },
      { url: '/products/cable-knit-polo-green-1.jpg', color: 'Bottle Green' },
    ],
    colors: [
      { name: 'Wine', hex: '#6B2435' },
      { name: 'Bottle Green', hex: '#174C3C' },
    ],
  },
  {
    ...base,
    slug: 'coastal-stripe-knitted-polo',
    name: 'Coastal Stripe Knitted Polo',
    category: 'polo-t-shirt',
    short_desc: 'Graduated navy and sky stripes on a soft cotton knit.',
    description:
      'Bands of navy, sky and cream graduate down the body in a pattern borrowed from old sailing '
      + 'jerseys. The open knitted collar sits soft against the neck, and the cotton breathes well '
      + 'enough for an Indian summer.',
    fit: 'Regular Fit',
    sleeve: 'Half Sleeve',
    collar: 'Open knitted collar',
    is_featured: true,
    images: [
      { url: '/products/coastal-stripe-polo-1.jpg', color: 'Navy' },
      { url: '/products/coastal-stripe-polo-2.jpg', color: 'Navy' },
    ],
    colors: [{ name: 'Navy', hex: '#2C3544' }],
  },
  {
    ...base,
    slug: 'riviera-stripe-knitted-shirt',
    name: 'Riviera Stripe Knitted Shirt',
    category: 'polo-shirt',
    short_desc: 'Full button-through knit with vertical panel stripes.',
    description:
      'A full button-through knitted shirt with vertical stripe panels down the front and an open '
      + 'camp collar. Relaxed through the chest with a straight hem, so it sits well untucked. '
      + 'The dressiest knit we make — pair it with pleated trousers and loafers.',
    fit: 'Relaxed Fit',
    sleeve: 'Half Sleeve',
    collar: 'Open camp collar, full button placket',
    is_featured: true,
    is_new: true,
    images: [
      { url: '/products/vertical-stripe-shirt-navy-1.jpg', color: 'Navy' },
      { url: '/products/vertical-stripe-shirt-olive-1.jpg', color: 'Olive' },
    ],
    colors: [
      { name: 'Navy', hex: '#2C3544' },
      { name: 'Olive', hex: '#4A4D30' },
    ],
  },
  {
    ...base,
    slug: 'essential-oversized-tee',
    name: 'Essential Oversized Tee',
    category: 'oversized-t-shirt',
    short_desc: 'Heavyweight drop-shoulder tee in three core shades.',
    description:
      'The plain one you reach for first. Heavyweight knitted cotton, dropped shoulders and a boxy '
      + 'body, with a ribbed neck that will not stretch out. Cut long enough to wear loose without '
      + 'looking borrowed.',
    fit: 'Oversized Fit',
    sleeve: 'Half Sleeve',
    collar: 'Ribbed crew neck',
    is_featured: true,
    images: [
      { url: '/products/essential-oversized-tee-black.svg', color: 'Black' },
      { url: '/products/essential-oversized-tee-white.svg', color: 'White' },
      { url: '/products/essential-oversized-tee-navy.svg', color: 'Navy' },
    ],
    colors: [
      { name: 'Black', hex: '#1A1D22' },
      { name: 'White', hex: '#F5F3EE' },
      { name: 'Navy', hex: '#2C3544' },
    ],
  },
  {
    ...base,
    slug: 'pigment-oversized-tee',
    name: 'Pigment Dyed Oversized Tee',
    category: 'oversized-t-shirt',
    short_desc: 'Garment-dyed heavyweight tee in warm seasonal colour.',
    description:
      'Dyed after it is knitted, so the colour settles unevenly and softens with every wash. Same '
      + 'heavyweight boxy body as our Essential tee, in the warmer end of the VELVENT palette.',
    fit: 'Oversized Fit',
    sleeve: 'Half Sleeve',
    collar: 'Ribbed crew neck',
    is_new: true,
    images: [
      { url: '/products/pigment-oversized-tee-butter.svg', color: 'Butter' },
      { url: '/products/pigment-oversized-tee-yellow.svg', color: 'Yellow' },
      { url: '/products/pigment-oversized-tee-bottle-green.svg', color: 'Bottle Green' },
    ],
    colors: [
      { name: 'Butter', hex: '#EFE0B0' },
      { name: 'Yellow', hex: '#E6B733' },
      { name: 'Bottle Green', hex: '#174C3C' },
    ],
  },
  {
    ...base,
    slug: 'monogram-oversized-tee',
    name: 'Monogram Oversized Tee',
    category: 'oversized-t-shirt',
    short_desc: 'Tonal V monogram on a heavyweight oversized body.',
    description:
      'Our V monogram printed tonally at the chest — visible up close, quiet from across the room. '
      + 'Built on the same heavyweight knitted cotton and oversized block as the rest of the range.',
    fit: 'Oversized Fit',
    sleeve: 'Half Sleeve',
    collar: 'Ribbed crew neck',
    is_featured: true,
    is_new: true,
    images: [
      { url: '/products/monogram-oversized-tee-navy.svg', color: 'Navy' },
      { url: '/products/monogram-oversized-tee-black.svg', color: 'Black' },
      { url: '/products/monogram-oversized-tee-white.svg', color: 'White' },
    ],
    colors: [
      { name: 'Navy', hex: '#2C3544' },
      { name: 'Black', hex: '#1A1D22' },
      { name: 'White', hex: '#F5F3EE' },
    ],
  },
];

const COUPONS = [
  { code: 'VELVENT10', kind: 'percent', value: 10, min_order: 999, max_discount: 300,
    description: '10% off orders above ₹999' },
  { code: 'FIRST200', kind: 'flat', value: 200, min_order: 1500, max_discount: null,
    description: '₹200 off your first order above ₹1,500' },
  { code: 'PAIRUP', kind: 'percent', value: 15, min_order: 2000, max_discount: 500,
    description: '15% off when you buy two or more' },
];

const skuOf = (slug, color, size) =>
  `VLV-${slug.split('-').map((w) => w[0]).join('').toUpperCase()}`
  + `-${color.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase()}-${size}`;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe catalog data only — customers and orders are left alone.
    await client.query('DELETE FROM product_variants');
    await client.query('DELETE FROM product_images');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');

    const catIds = {};
    for (const [i, c] of CATEGORIES.entries()) {
      const { rows } = await client.query(
        `INSERT INTO categories (slug, name, tagline, description, image_url, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [c.slug, c.name, c.tagline, c.description, c.image_url, i],
      );
      catIds[c.slug] = rows[0].id;
      console.log(`  category  ${c.name}`);
    }

    for (const [i, p] of PRODUCTS.entries()) {
      const { rows } = await client.query(
        `INSERT INTO products (slug, name, category_id, short_desc, description, mrp, sale_price,
             fabric, wash_care, fit, sleeve, collar, weight_grams, is_featured, is_new, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
        [p.slug, p.name, catIds[p.category], p.short_desc, p.description, p.mrp, p.sale_price,
          p.fabric, p.wash_care, p.fit, p.sleeve, p.collar, p.weight_grams,
          !!p.is_featured, !!p.is_new, i],
      );
      const id = rows[0].id;

      for (const [j, img] of p.images.entries()) {
        await client.query(
          'INSERT INTO product_images (product_id, url, alt, color, sort_order) VALUES ($1,$2,$3,$4,$5)',
          [id, img.url, `${p.name} in ${img.color}`, img.color, j],
        );
      }
      for (const color of p.colors) {
        for (const size of SIZES) {
          await client.query(
            `INSERT INTO product_variants (product_id, size, color, color_hex, sku, stock)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, size, color.name, color.hex, skuOf(p.slug, color.name, size), DEFAULT_STOCK],
          );
        }
      }
      console.log(`  product   ${p.name}  (${p.colors.length} colour(s) x ${SIZES.length} sizes)`);
    }

    for (const c of COUPONS) {
      await client.query(
        `INSERT INTO coupons (code, kind, value, min_order, max_discount, description)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (code) DO UPDATE SET value = EXCLUDED.value,
           min_order = EXCLUDED.min_order, description = EXCLUDED.description`,
        [c.code, c.kind, c.value, c.min_order, c.max_discount, c.description],
      );
    }
    console.log(`  coupons   ${COUPONS.map((c) => c.code).join(', ')}`);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@velvent.in').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
      console.log('\n  ADMIN_PASSWORD is not set in server/.env — skipping admin account.');
    } else {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1,$2,$3,'admin')
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
        ['VELVENT Admin', adminEmail, await hashPassword(adminPass)],
      );
      console.log(`  admin     ${adminEmail}`);
    }

    await client.query('COMMIT');

    const { rows: n } = await client.query(
      `SELECT (SELECT COUNT(*) FROM products)::int p,
              (SELECT COUNT(*) FROM product_variants)::int v,
              (SELECT COUNT(*) FROM product_images)::int i`,
    );
    console.log(`\n[velvent] seeded ${n[0].p} products, ${n[0].v} variants, ${n[0].i} images.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[velvent] seed failed:', err.message);
  process.exit(1);
});
