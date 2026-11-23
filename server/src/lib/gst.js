import { money } from './helpers.js';
import { getContent } from './content.js';

/**
 * GST, for a shop that prices in MRP.
 *
 * The one thing to understand before reading any of this: every price in the
 * store already contains the tax. A ₹1,005 polo is ₹957.14 of polo and ₹47.86
 * of GST — it is not ₹1,005 plus something. So this module never adds tax to
 * a total. It splits a total the shopper has already been quoted.
 *
 * That is deliberate and it is what Indian retail does. The alternative —
 * adding tax at checkout — would change every price on the site the day it
 * shipped, and the client would have to re-do their whole price list.
 */

export const TAX_DEFAULTS = {
  enabled: false,
  gstin: '',
  legalName: '',
  sellerState: 'Gujarat',
  invoicePrefix: 'VLV/',
  defaultHsn: '6105',          // knitted shirts and polos
  pickup: { line1: '', line2: '', city: '', state: 'Gujarat', pincode: '' },
};

/**
 * India's apparel slabs: 5% up to ₹1,000 a piece, 12% above it.
 *
 * The threshold is on the value before tax, which is circular when the price
 * includes the tax — you need the rate to find the value and the value to
 * find the rate. It resolves in one step: assume the lower rate, and if the
 * resulting ex-tax price still fits under the threshold, that assumption was
 * right. Only when it does not fit does the higher rate apply.
 *
 * In practice this puts the break at ₹1,050 inclusive. VELVENT's ₹1,005 polo
 * is ₹957.14 ex-tax, so it sits in the 5% slab.
 */
export const GARMENT_LOW = 5;
export const GARMENT_HIGH = 12;
const SLAB_THRESHOLD = 1000;

export function slabRateFor(inclusivePrice) {
  const price = Number(inclusivePrice) || 0;
  const exAtLow = price / (1 + GARMENT_LOW / 100);
  return exAtLow <= SLAB_THRESHOLD ? GARMENT_LOW : GARMENT_HIGH;
}

/**
 * The rate a line is taxed at: the product's own, or the slab rule.
 *
 * The empty check is deliberate and has to come first. A product with no rate
 * set arrives here as null, and Number(null) is 0 — which would read as "this
 * product is tax free" and quietly put zero GST on every order in the shop.
 * Only an actual number counts as an override.
 */
export const rateForLine = (line) => {
  const own = line?.taxRate;
  if (own === null || own === undefined || own === '') return slabRateFor(line.unitPrice);
  const n = Number(own);
  return Number.isFinite(n) && n >= 0 ? n : slabRateFor(line.unitPrice);
};

/** Splits a tax-inclusive amount into what it is worth and what it carries. */
export function splitInclusive(amount, ratePercent) {
  const gross = money(amount);
  const rate = Number(ratePercent) || 0;
  const taxable = money(gross / (1 + rate / 100));
  return { taxable, tax: money(gross - taxable) };
}

/** The settings an invoice is built from, with the blanks filled in. */
export async function getTaxSettings() {
  const content = await getContent();
  const saved = content?.settings?.tax;
  if (!saved || typeof saved !== 'object') return TAX_DEFAULTS;
  return {
    ...TAX_DEFAULTS,
    ...saved,
    pickup: { ...TAX_DEFAULTS.pickup, ...(saved.pickup || {}) },
  };
}

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Works out the whole tax picture for one order.
 *
 * Discount is spread across the lines in proportion to what each is worth, so
 * a coupon reduces the taxable value of every item rather than being taken
 * off one of them. Shipping is taxed at the highest rate in the cart, which
 * is the rule for a composite supply and the safe way round when a cart mixes
 * slabs.
 *
 * Returns nulls when GST is switched off, so an order placed before the shop
 * registered is distinguishable from one that genuinely carried no tax.
 */
export function computeTax({ lines, totals, buyerState, settings }) {
  if (!settings?.enabled) {
    return { enabled: false, lines: lines.map(() => null), order: null };
  }

  const gross = money(totals.subtotal - totals.discount);
  const perLine = [];
  let taxTotal = 0;

  for (const line of lines) {
    const rate = rateForLine(line);
    /* The line's share of the discount, by value. When everything is free the
       share is zero rather than NaN. */
    const share = gross > 0 && totals.subtotal > 0
      ? money(line.lineTotal - (totals.discount * line.lineTotal) / totals.subtotal)
      : 0;
    const { taxable, tax } = splitInclusive(share, rate);
    perLine.push({
      hsn: line.hsn || settings.defaultHsn || null,
      rate,
      taxable,
      tax,
      gross: share,
    });
    taxTotal = money(taxTotal + tax);
  }

  /* Delivery rides at the highest rate the parcel contains. */
  const shippingRate = perLine.length
    ? Math.max(...perLine.map((l) => l.rate))
    : GARMENT_LOW;
  const shipSplit = splitInclusive(totals.shipping, shippingRate);
  taxTotal = money(taxTotal + shipSplit.tax);

  /* Derived rather than summed, so the three numbers on the invoice always
     add up to the number the customer was charged. */
  const taxableTotal = money(totals.total - taxTotal);

  const inState = norm(buyerState) === norm(settings.sellerState);
  const half = money(taxTotal / 2);

  return {
    enabled: true,
    lines: perLine,
    order: {
      taxable: taxableTotal,
      tax: taxTotal,
      /* Halving can leave a paisa behind; it goes on the second half so the
         pair always sums to the total. */
      cgst: inState ? half : 0,
      sgst: inState ? money(taxTotal - half) : 0,
      igst: inState ? 0 : taxTotal,
      placeOfSupply: String(buyerState || '').trim() || null,
      shippingRate,
    },
  };
}

/** India's financial year runs April to March. "2026-27" for March 2027. */
export function financialYear(date = new Date()) {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/**
 * The next invoice number, reserved atomically.
 *
 * Two orders placed in the same second must not be handed the same number, so
 * the counter is incremented by the database in one statement rather than
 * read and then written. Must be called inside the caller's transaction.
 */
export async function nextInvoiceNumber(client, { prefix = 'VLV/', date = new Date() } = {}) {
  const fy = financialYear(date);
  const { rows } = await client.query(
    `INSERT INTO invoice_counters (fy, last_number) VALUES ($1, 1)
     ON CONFLICT (fy) DO UPDATE SET last_number = invoice_counters.last_number + 1
     RETURNING last_number`,
    [fy],
  );
  return `${prefix}${fy}/${String(rows[0].last_number).padStart(4, '0')}`;
}

/** Statuses that mean a sale really happened, so an invoice is due. */
const INVOICEABLE = ['processing', 'shipped', 'completed'];

/**
 * Gives an order its invoice number, once.
 *
 * Numbering is deliberately late. An order sitting at "pending payment" may
 * never become a sale, and burning a number on it would leave a hole in a
 * sequence that is supposed to be unbroken. So the number is handed out when
 * the order first reaches a state that means money changed hands, and an
 * order that is cancelled before that never takes one.
 */
export async function ensureInvoiceNumber(client, orderId, status) {
  if (!INVOICEABLE.includes(status)) return null;

  const settings = await getTaxSettings();
  if (!settings.enabled) return null;

  const { rows: existing } = await client.query(
    'SELECT invoice_number FROM orders WHERE id = $1 FOR UPDATE',
    [orderId],
  );
  if (!existing[0] || existing[0].invoice_number) return existing[0]?.invoice_number || null;

  const number = await nextInvoiceNumber(client, { prefix: settings.invoicePrefix });
  await client.query(
    'UPDATE orders SET invoice_number = $2, invoice_date = NOW() WHERE id = $1',
    [orderId, number],
  );
  return number;
}
