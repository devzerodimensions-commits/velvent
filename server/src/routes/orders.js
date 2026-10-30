import { Router } from 'express';
import crypto from 'node:crypto';
import { query, withTransaction } from '../db.js';
import { ah, isEmail, isPhone, isPincode, orderNumber, validate } from '../lib/helpers.js';
import { requireAuth } from '../lib/auth.js';
import { priceCart, findCoupon } from '../lib/pricing.js';
import { CANCELLABLE, initialStatus } from '../lib/orderStatus.js';

const router = Router();

const razorpayEnabled = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

/** GET /api/payment-methods - lets checkout show only what is actually configured. */
router.get('/payment-methods', (_req, res) => {
  res.json({
    cod: true,
    razorpay: razorpayEnabled(),
    razorpayKeyId: razorpayEnabled() ? process.env.RAZORPAY_KEY_ID : null,
  });
});

/** POST /api/cart/price - authoritative totals for the cart and checkout screens. */
router.post('/cart/price', ah(async (req, res) => {
  const { items, couponCode } = req.body || {};
  const coupon = couponCode ? await findCoupon({ query }, couponCode) : null;
  if (couponCode && !coupon) return res.status(400).json({ error: 'That coupon code is not valid.' });

  const priced = await priceCart({ query }, items, coupon);
  if (priced.error) return res.status(400).json({ error: priced.error });
  res.json(priced);
}));

/** POST /api/orders - place an order. Works for guests and signed-in customers. */
router.post('/orders', ah(async (req, res) => {
  const { items, address, couponCode, paymentMethod = 'cod', notes, email, phone } = req.body || {};
  const a = address || {};

  const errors = validate({
    email: [email, isEmail, 'Enter a valid email address.'],
    phone: [phone, isPhone, 'Enter a valid 10-digit mobile number.'],
    full_name: [a.full_name, (v) => String(v || '').trim().length >= 2, 'Enter the full name.'],
    line1: [a.line1, (v) => String(v || '').trim().length >= 4, 'Enter the address.'],
    city: [a.city, (v) => String(v || '').trim().length >= 2, 'Enter the city.'],
    state: [a.state, (v) => String(v || '').trim().length >= 2, 'Enter the state.'],
    pincode: [a.pincode, isPincode, 'Enter a valid 6-digit PIN code.'],
  });
  if (errors) return res.status(400).json({ error: 'Please check your details.', errors });

  const method = paymentMethod === 'razorpay' && razorpayEnabled() ? 'razorpay' : 'cod';

  const result = await withTransaction(async (client) => {
    const coupon = couponCode ? await findCoupon(client, couponCode) : null;
    if (couponCode && !coupon) return { status: 400, body: { error: 'That coupon code is not valid.' } };

    const priced = await priceCart(client, items, coupon);
    if (priced.error) return { status: 400, body: { error: priced.error } };

    // Lock the variant rows and re-check stock so two orders cannot take the same last piece.
    const ids = priced.lines.map((l) => l.variantId);
    const { rows: locked } = await client.query(
      'SELECT id, stock FROM product_variants WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
      [ids],
    );
    const stock = new Map(locked.map((r) => [r.id, r.stock]));
    for (const line of priced.lines) {
      if ((stock.get(line.variantId) ?? 0) < line.quantity) {
        return {
          status: 409,
          body: { error: `${line.name} (${line.color} / ${line.size}) just went out of stock.` },
        };
      }
    }

    const { totals } = priced;
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (order_number, user_id, email, phone, payment_method, payment_status, status,
                           subtotal, discount, shipping, total, coupon_code, shipping_address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [orderNumber(), req.user?.id || null, String(email).toLowerCase(), phone, method, 'pending',
        initialStatus(method),
        totals.subtotal, totals.discount, totals.shipping, totals.total,
        totals.couponCode, JSON.stringify(a), notes || null],
    );
    const order = orderRows[0];

    for (const l of priced.lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, slug, image_url,
                                  size, color, unit_price, quantity)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [order.id, l.productId, l.variantId, l.name, l.slug, l.imageUrl, l.size, l.color, l.unitPrice, l.quantity],
      );
      await client.query('UPDATE product_variants SET stock = stock - $2 WHERE id = $1', [l.variantId, l.quantity]);
    }
    return { status: 201, body: { order: { ...order, items: priced.lines }, totals } };
  });

  if (result.status !== 201) return res.status(result.status).json(result.body);

  // For online payment, hand the client a Razorpay order to open the checkout with.
  if (method === 'razorpay') {
    try {
      const { default: Razorpay } = await import('razorpay');
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const rzpOrder = await rzp.orders.create({
        amount: Math.round(Number(result.body.order.total) * 100),
        currency: 'INR',
        receipt: result.body.order.order_number,
      });
      await query('UPDATE orders SET razorpay_order_id = $2 WHERE id = $1',
        [result.body.order.id, rzpOrder.id]);
      result.body.razorpay = {
        orderId: rzpOrder.id,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
      };
    } catch (err) {
      console.error('[velvent] razorpay order failed:', err.message);
      return res.status(502).json({
        error: 'Online payment is unavailable right now. Please choose Cash on Delivery.',
      });
    }
  }

  res.status(201).json(result.body);
}));

/** POST /api/orders/:orderNumber/verify - confirm a Razorpay payment signature. */
router.post('/orders/:orderNumber/verify', ah(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpayEnabled()) return res.status(400).json({ error: 'Online payment is not enabled.' });

  // Find the order this Razorpay order actually belongs to first. Without that
  // match, anyone who knew an order number could post a bad signature and mark
  // someone else's order failed.
  const { rows: matched } = await query(
    'SELECT * FROM orders WHERE order_number = $1 AND razorpay_order_id = $2',
    [req.params.orderNumber, String(razorpay_order_id || '')],
  );
  const order = matched[0];
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // The checkout widget can fire its callback twice; the second one is a no-op.
  if (order.payment_status === 'paid') return res.json({ ok: true, order });

  const signature = String(razorpay_signature || '');
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  const verified = signature.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!verified) {
    await query(
      `UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = $1`,
      [order.id],
    );
    return res.status(400).json({ error: 'We could not verify that payment.' });
  }

  const { rows } = await query(
    `UPDATE orders SET payment_status = 'paid', status = 'processing',
            razorpay_payment_id = $2, updated_at = NOW()
      WHERE id = $1 RETURNING *`,
    [order.id, razorpay_payment_id],
  );
  res.json({ ok: true, order: rows[0] });
}));

/** GET /api/orders - the signed-in customer's order history. */
/* What the shop keeps to itself.

   shipment_meta is whatever the courier's API handed back, and admin_note is
   the shop writing to the shop — "customer asked to swap the size", "second
   delivery attempt failed". A note written on the assumption nobody outside
   reads it is exactly the thing that must not be served to the person it is
   about. The fields a customer does need are columns of their own, so
   dropping these costs them nothing. */
const withoutInternals = ({ shipment_meta, admin_note, ...order }) => order;

router.get('/orders', requireAuth, ah(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*, COALESCE((SELECT json_agg(i) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
       FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
    [req.user.id],
  );
  res.json(rows.map(withoutInternals));
}));

/**
 * GET /api/orders/:orderNumber
 * Guests look an order up with the email it was placed with; the owner just needs their token.
 */
router.get('/orders/:orderNumber', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT o.*, COALESCE((SELECT json_agg(i) FROM order_items i WHERE i.order_id = o.id), '[]'::json) AS items
       FROM orders o WHERE o.order_number = $1`,
    [req.params.orderNumber],
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: 'We could not find that order.' });

  const isOwner = req.user && order.user_id === req.user.id;
  const emailMatches = String(req.query.email || '').toLowerCase() === order.email;
  if (!isOwner && !emailMatches && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Enter the email address used on this order to view it.' });
  }
  res.json(withoutInternals(order));
}));

/** POST /api/orders/:orderNumber/cancel - allowed until the parcel ships. */
router.post('/orders/:orderNumber/cancel', requireAuth, ah(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM orders WHERE order_number = $1 AND user_id = $2',
    [req.params.orderNumber, req.user.id],
  );
  const order = rows[0];
  if (!order) return res.status(404).json({ error: 'We could not find that order.' });
  if (!CANCELLABLE.includes(order.status)) {
    return res.status(400).json({ error: 'This order has already shipped and can no longer be cancelled.' });
  }

  await withTransaction(async (client) => {
    await client.query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [order.id]);
    const { rows: items } = await client.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
      [order.id],
    );
    for (const i of items) {
      if (i.variant_id) {
        await client.query('UPDATE product_variants SET stock = stock + $2 WHERE id = $1', [i.variant_id, i.quantity]);
      }
    }
  });
  res.json({ ok: true });
}));

export default router;
