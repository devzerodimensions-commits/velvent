import { money } from './helpers.js';
import { getShipping } from './content.js';

/**
 * Re-prices a client cart from the database so the browser can never dictate
 * what an order costs. Returns the priced lines plus a totals breakdown.
 */
export async function priceCart(client, items, coupon = null) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Your cart is empty.' };
  }
  if (items.length > 50) return { error: 'Too many items in one order.' };

  const variantIds = [...new Set(items.map((i) => Number(i.variantId)).filter(Boolean))];
  if (variantIds.length !== items.length) {
    return { error: 'Some items in your cart are no longer valid. Please refresh and try again.' };
  }

  const { rows } = await client.query(
    `SELECT v.id, v.size, v.color, v.stock, v.sku,
            p.id AS product_id, p.name, p.slug, p.sale_price, p.mrp, p.is_active,
            (SELECT url FROM product_images pi
              WHERE pi.product_id = p.id
              ORDER BY (pi.color IS DISTINCT FROM v.color), pi.sort_order, pi.id
              LIMIT 1) AS image_url
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
      WHERE v.id = ANY($1::int[])`,
    [variantIds],
  );
  const byId = new Map(rows.map((r) => [r.id, r]));

  const lines = [];
  for (const item of items) {
    const v = byId.get(Number(item.variantId));
    const qty = Math.floor(Number(item.quantity));
    if (!v || !v.is_active) return { error: 'An item in your cart is no longer available.' };
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return { error: `Choose a quantity between 1 and 10 for ${v.name}.` };
    }
    if (v.stock < qty) {
      return { error: `Only ${v.stock} left of ${v.name} (${v.color} / ${v.size}).` };
    }
    lines.push({
      variantId: v.id,
      productId: v.product_id,
      name: v.name,
      slug: v.slug,
      imageUrl: v.image_url,
      size: v.size,
      color: v.color,
      sku: v.sku,
      mrp: Number(v.mrp),
      unitPrice: Number(v.sale_price),
      quantity: qty,
      lineTotal: money(Number(v.sale_price) * qty),
    });
  }

  const subtotal = money(lines.reduce((s, l) => s + l.lineTotal, 0));

  let discount = 0;
  let couponCode = null;
  if (coupon) {
    if (subtotal < Number(coupon.min_order)) {
      return { error: `Coupon ${coupon.code} needs a minimum order of ₹${Number(coupon.min_order)}.` };
    }
    discount = coupon.kind === 'flat'
      ? Number(coupon.value)
      : (subtotal * Number(coupon.value)) / 100;
    if (coupon.max_discount) discount = Math.min(discount, Number(coupon.max_discount));
    discount = money(Math.min(discount, subtotal));
    couponCode = coupon.code;
  }

  const afterDiscount = money(subtotal - discount);
  /* The threshold and the fee are whatever the admin last saved, so the price
     the shopper was quoted and the price the order is written at come from
     the same place. */
  const rules = await getShipping();
  const shipping = afterDiscount >= rules.freeAbove || afterDiscount === 0 ? 0 : rules.fee;
  const total = money(afterDiscount + shipping);
  const mrpTotal = money(lines.reduce((s, l) => s + l.mrp * l.quantity, 0));

  return {
    lines,
    totals: { mrpTotal, subtotal, discount, couponCode, shipping, total, savings: money(mrpTotal - subtotal + discount) },
  };
}

/** Looks up an active, unexpired coupon. */
export async function findCoupon(client, code) {
  if (!code) return null;
  const { rows } = await client.query(
    `SELECT * FROM coupons
      WHERE UPPER(code) = UPPER($1) AND is_active
        AND (expires_at IS NULL OR expires_at > NOW())`,
    [String(code).trim()],
  );
  return rows[0] || null;
}
