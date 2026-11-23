/**
 * The GST slab rule, for showing someone what a price contains while they
 * type it.
 *
 * This is a copy of the rule in server/src/lib/gst.js, and the server's copy
 * is the one that counts — every figure written to an order is calculated
 * there, from the database, and nothing here is ever sent back. This exists
 * so the product editor can show the split live instead of making the client
 * save and go looking for it.
 */

export const GARMENT_LOW = 5;
export const GARMENT_HIGH = 12;
const SLAB_THRESHOLD = 1000;

/** 5% up to ₹1,000 of goods, 12% above — which lands at ₹1,050 inclusive. */
export function slabRateFor(inclusivePrice) {
  const price = Number(inclusivePrice) || 0;
  return price / (1 + GARMENT_LOW / 100) <= SLAB_THRESHOLD ? GARMENT_LOW : GARMENT_HIGH;
}

const round = (n) => Math.round(Number(n) * 100) / 100;

/** Splits a price that already contains tax into goods and tax. */
export function splitInclusive(amount, ratePercent) {
  const gross = round(amount);
  const taxable = round(gross / (1 + (Number(ratePercent) || 0) / 100));
  return { taxable, tax: round(gross - taxable) };
}
