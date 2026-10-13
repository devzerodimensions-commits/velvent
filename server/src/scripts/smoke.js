/**
 * End-to-end smoke test against a running API.
 *
 *   npm run smoke                      # tests http://localhost:5000
 *   npm run smoke -- https://your.app  # tests a deployed instance
 *
 * Exercises the real customer path: browse -> product -> price cart -> coupon ->
 * place a COD order -> look it up as a guest -> cancel it and confirm stock came back.
 * Admin checks run only when ADMIN_EMAIL / ADMIN_PASSWORD are set.
 */
import dotenv from 'dotenv';

dotenv.config();

const BASE = (process.argv[2] || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
let pass = 0;
let fail = 0;
let token = null;

const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

async function call(path, { method = 'GET', body, auth } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function check(name, fn) {
  try {
    const detail = await fn();
    pass += 1;
    console.log(`${g('  PASS')}  ${name}${detail ? dim(`  — ${detail}`) : ''}`);
  } catch (err) {
    fail += 1;
    console.log(`${r('  FAIL')}  ${name}\n        ${r(err.message)}`);
  }
}

const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

async function run() {
  console.log(`\nVELVENT smoke test → ${BASE}\n`);

  /* ---------------------------------------------------------- storefront */
  console.log('Catalog');

  let categories = [];
  await check('GET /health reports a connected database', async () => {
    const { status, data } = await call('/health');
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.db === 'connected', 'database is not connected');
    return `${data.counts.products} products, ${data.counts.categories} categories`;
  });

  await check('GET /categories returns the three categories', async () => {
    const { status, data } = await call('/categories');
    expect(status === 200, `expected 200, got ${status}`);
    expect(Array.isArray(data) && data.length >= 1, 'no categories returned');
    categories = data;
    return data.map((c) => c.name).join(', ');
  });

  let product = null;
  await check('GET /products returns a page of products', async () => {
    const { status, data } = await call('/products?limit=50');
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.products?.length > 0, 'no products returned');
    expect(data.products.every((p) => Number(p.sale_price) > 0), 'a product has no price');
    expect(data.products.every((p) => p.images?.length > 0), 'a product has no image');
    return `${data.total} products`;
  });

  await check('GET /products/filters returns sizes and colours', async () => {
    const { status, data } = await call('/products/filters');
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.sizes.includes('S') && data.sizes.includes('3XL'), 'size range is not S–3XL');
    return `${data.sizes.join('/')} · ${data.colors.length} colours`;
  });

  await check('GET /products?category= filters correctly', async () => {
    const slug = categories[0].slug;
    const { status, data } = await call(`/products?category=${slug}`);
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.products.every((p) => p.category_slug === slug), 'a product from another category leaked in');
    return `${slug}: ${data.total}`;
  });

  await check('GET /products/:slug returns variants and images', async () => {
    const list = await call('/products?limit=1');
    const { status, data } = await call(`/products/${list.data.products[0].slug}`);
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.variants?.length > 0, 'product has no variants');
    expect(data.images?.length > 0, 'product has no images');
    product = data;
    return `${data.name}: ${data.variants.length} variants`;
  });

  await check('GET /products/:slug 404s for an unknown slug', async () => {
    const { status } = await call('/products/this-does-not-exist');
    expect(status === 404, `expected 404, got ${status}`);
  });

  /* ------------------------------------------------------------- pricing */
  console.log('\nPricing');

  const variant = () => product.variants.find((v) => v.stock > 1) || product.variants[0];
  let expectedLineTotal = 0;

  await check('POST /cart/price prices a cart from the database', async () => {
    const v = variant();
    const { status, data } = await call('/cart/price', {
      method: 'POST', body: { items: [{ variantId: v.id, quantity: 2 }] },
    });
    expect(status === 200, `expected 200, got ${status}: ${JSON.stringify(data)}`);
    expectedLineTotal = Number(product.sale_price) * 2;
    expect(data.totals.subtotal === expectedLineTotal,
      `subtotal ${data.totals.subtotal} should be ${expectedLineTotal}`);
    return `2 × ${product.name} = ₹${data.totals.subtotal}, total ₹${data.totals.total}`;
  });

  await check('cart pricing ignores a price sent by the client', async () => {
    const v = variant();
    const { data } = await call('/cart/price', {
      method: 'POST',
      body: { items: [{ variantId: v.id, quantity: 1, salePrice: 1, unitPrice: 1 }] },
    });
    expect(Number(data.totals.subtotal) === Number(product.sale_price),
      `client price was honoured: got ${data.totals.subtotal}`);
    return `held at ₹${data.totals.subtotal}`;
  });

  await check('cart pricing rejects an absurd quantity', async () => {
    const { status } = await call('/cart/price', {
      method: 'POST', body: { items: [{ variantId: variant().id, quantity: 9999 }] },
    });
    expect(status === 400, `expected 400, got ${status}`);
  });

  await check('a valid coupon reduces the total', async () => {
    const offers = await call('/offers');
    if (!offers.data?.length) return 'no coupons configured — skipped';
    const coupon = offers.data.find((c) => Number(c.min_order) <= expectedLineTotal);
    if (!coupon) return 'no coupon reachable at this cart value — skipped';
    const { status, data } = await call('/cart/price', {
      method: 'POST',
      body: { items: [{ variantId: variant().id, quantity: 2 }], couponCode: coupon.code },
    });
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.totals.discount > 0, 'coupon applied no discount');
    return `${coupon.code} → −₹${data.totals.discount}`;
  });

  await check('an unknown coupon is rejected', async () => {
    const { status } = await call('/cart/price', {
      method: 'POST',
      body: { items: [{ variantId: variant().id, quantity: 1 }], couponCode: 'NOPE-NOT-REAL' },
    });
    expect(status === 400, `expected 400, got ${status}`);
  });

  /* -------------------------------------------------------------- orders */
  console.log('\nCheckout');

  const email = `smoke+${Date.now()}@velvent.test`;
  const address = {
    full_name: 'Smoke Test', phone: '9876543210', line1: '12 Test Street',
    city: 'Surat', state: 'Gujarat', pincode: '395001',
  };
  let orderNumber = null;
  let stockBefore = 0;

  await check('bad checkout details come back as field errors', async () => {
    const { status, data } = await call('/orders', {
      method: 'POST',
      body: {
        items: [{ variantId: variant().id, quantity: 1 }],
        address: { ...address, pincode: '12' }, email: 'not-an-email', phone: '123',
      },
    });
    expect(status === 400, `expected 400, got ${status}`);
    expect(data.errors?.pincode && data.errors?.email, 'per-field errors were not returned');
    return Object.keys(data.errors).join(', ');
  });

  await check('POST /orders places a cash-on-delivery order', async () => {
    const v = variant();
    const fresh = await call(`/products/${product.slug}`);
    stockBefore = fresh.data.variants.find((x) => x.id === v.id).stock;

    const { status, data } = await call('/orders', {
      method: 'POST',
      body: { items: [{ variantId: v.id, quantity: 1 }], address, email, phone: address.phone, paymentMethod: 'cod' },
    });
    expect(status === 201, `expected 201, got ${status}: ${JSON.stringify(data)}`);
    expect(data.order.order_number?.startsWith('VLV-'), 'order number is malformed');
    orderNumber = data.order.order_number;
    return `${orderNumber} · ₹${data.order.total}`;
  });

  await check('placing the order decremented stock', async () => {
    const fresh = await call(`/products/${product.slug}`);
    const now = fresh.data.variants.find((x) => x.id === variant().id).stock;
    expect(now === stockBefore - 1, `stock went ${stockBefore} → ${now}, expected ${stockBefore - 1}`);
    return `${stockBefore} → ${now}`;
  });

  await check('a guest can look the order up with the right email', async () => {
    const { status, data } = await call(`/orders/${orderNumber}?email=${encodeURIComponent(email)}`);
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.items?.length === 1, 'order items missing');
  });

  await check('the order is hidden from the wrong email', async () => {
    const { status } = await call(`/orders/${orderNumber}?email=someone-else@example.com`);
    expect(status === 403, `expected 403, got ${status}`);
  });

  /* --------------------------------------------------------------- auth */
  console.log('\nAccounts');

  const userEmail = `smoke-user+${Date.now()}@velvent.test`;
  await check('POST /auth/register creates an account', async () => {
    const { status, data } = await call('/auth/register', {
      method: 'POST', body: { name: 'Smoke User', email: userEmail, password: 'test-password-123' },
    });
    expect(status === 201, `expected 201, got ${status}: ${JSON.stringify(data)}`);
    expect(data.token, 'no token returned');
    token = data.token;
  });

  await check('a short password is rejected', async () => {
    const { status } = await call('/auth/register', {
      method: 'POST', body: { name: 'X', email: `x${Date.now()}@velvent.test`, password: '123' },
    });
    expect(status === 400, `expected 400, got ${status}`);
  });

  await check('the same email cannot register twice', async () => {
    const { status } = await call('/auth/register', {
      method: 'POST', body: { name: 'Dup', email: userEmail, password: 'test-password-123' },
    });
    expect(status === 409, `expected 409, got ${status}`);
  });

  await check('a wrong password is refused', async () => {
    const { status } = await call('/auth/login', {
      method: 'POST', body: { email: userEmail, password: 'wrong-password' },
    });
    expect(status === 401, `expected 401, got ${status}`);
  });

  await check('GET /auth/me returns the signed-in customer', async () => {
    const { status, data } = await call('/auth/me', { auth: true });
    expect(status === 200, `expected 200, got ${status}`);
    expect(data.email === userEmail, 'wrong account returned');
    expect(data.role === 'customer', 'a new signup should not be an admin');
  });

  await check('a signed-in order can be cancelled and returns its stock', async () => {
    const v = variant();
    const placed = await call('/orders', {
      method: 'POST', auth: true,
      body: { items: [{ variantId: v.id, quantity: 1 }], address, email: userEmail, phone: address.phone },
    });
    expect(placed.status === 201, `could not place order: ${JSON.stringify(placed.data)}`);
    const num = placed.data.order.order_number;

    const before = (await call(`/products/${product.slug}`)).data.variants.find((x) => x.id === v.id).stock;
    const cancelled = await call(`/orders/${num}/cancel`, { method: 'POST', auth: true });
    expect(cancelled.status === 200, `cancel failed: ${JSON.stringify(cancelled.data)}`);
    const after = (await call(`/products/${product.slug}`)).data.variants.find((x) => x.id === v.id).stock;
    expect(after === before + 1, `stock went ${before} → ${after}, expected ${before + 1}`);
    return `${num} cancelled, stock ${before} → ${after}`;
  });

  /* --------------------------------------------------------------- admin */
  console.log('\nAdmin');

  await check('admin endpoints reject a customer token', async () => {
    const { status } = await call('/admin/stats', { auth: true });
    expect(status === 403, `expected 403, got ${status}`);
  });

  await check('admin endpoints reject anonymous callers', async () => {
    const saved = token; token = null;
    const { status } = await call('/admin/stats', { auth: true });
    token = saved;
    expect(status === 401, `expected 401, got ${status}`);
  });

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await check('the seeded admin can sign in', async () => {
      const { status, data } = await call('/auth/login', {
        method: 'POST',
        body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
      });
      expect(status === 200, `expected 200, got ${status}`);
      expect(data.user.role === 'admin', `role is ${data.user.role}, expected admin`);
      token = data.token;
      return data.user.email;
    });

    await check('GET /admin/stats returns the dashboard figures', async () => {
      const { status, data } = await call('/admin/stats', { auth: true });
      expect(status === 200, `expected 200, got ${status}`);
      expect(typeof data.revenue === 'number', 'revenue missing');
      expect(Array.isArray(data.chart) && data.chart.length === 14, 'the 14-day chart is wrong');
      return `₹${data.revenue} across ${data.orders.total} orders`;
    });

    await check('GET /admin/orders lists the smoke order', async () => {
      const { status, data } = await call('/admin/orders', { auth: true });
      expect(status === 200, `expected 200, got ${status}`);
      expect(data.some((o) => o.order_number === orderNumber), 'the order placed above is missing');
      return `${data.length} orders visible`;
    });
  } else {
    console.log(dim('  SKIP  admin sign-in — ADMIN_EMAIL / ADMIN_PASSWORD not set in server/.env'));
  }

  /* --------------------------------------------------------------- misc */
  console.log('\nForms');

  await check('POST /newsletter accepts a subscriber', async () => {
    const { status } = await call('/newsletter', { method: 'POST', body: { email: `news+${Date.now()}@velvent.test` } });
    expect(status === 201, `expected 201, got ${status}`);
  });

  await check('POST /newsletter rejects a malformed address', async () => {
    const { status } = await call('/newsletter', { method: 'POST', body: { email: 'nope' } });
    expect(status === 400, `expected 400, got ${status}`);
  });

  await check('POST /contact stores a message', async () => {
    const { status } = await call('/contact', {
      method: 'POST',
      body: { name: 'Smoke', email: 'smoke@velvent.test', subject: 'Test', message: 'Automated smoke test.' },
    });
    expect(status === 201, `expected 201, got ${status}`);
  });

  await check('an unknown endpoint 404s as JSON', async () => {
    const { status, data } = await call('/not-a-real-endpoint');
    expect(status === 404, `expected 404, got ${status}`);
    expect(data.error, 'no error message returned');
  });

  console.log(`\n${fail === 0 ? g(`All ${pass} checks passed.`) : r(`${pass} passed, ${fail} failed.`)}`);
  console.log(dim(`Test order ${orderNumber} and the smoke accounts remain in the database — delete them from /admin when you are done.\n`));
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(r(`\nSmoke test could not run: ${err.message}`));
  console.error(dim('Is the API running?  npm run dev:server\n'));
  process.exit(1);
});
