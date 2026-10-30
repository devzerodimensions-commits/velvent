import { manual } from './manual.js';

/**
 * Shipping, with the courier kept at arm's length.
 *
 * The store knows four things about a parcel: who is carrying it, the number
 * they gave it, where a customer can follow it, and when it left. Nothing
 * above this module knows more than that, so swapping Shiprocket for Delhivery
 * — or for a clerk typing numbers off a manifest — changes one file here and
 * nothing anywhere else.
 *
 * A provider implements:
 *
 *   id            a short key, matching SHIPPING_PROVIDER
 *   label         what to call it in the admin
 *   manualEntry   true when a human types the tracking number in
 *   carriers()    the carrier names to offer, or [] for a free-text field
 *   trackingUrl({ carrier, trackingNumber })   where to send the customer
 *   createShipment(order)  books the parcel and returns the four things above
 *
 * `manual` is the one that ships today: nothing is booked, an admin enters
 * what the courier gave them, and the customer gets a working link. That is a
 * real way to run a small store, not a placeholder — and it means the admin
 * screens are already built and tested when a real provider is added.
 */

const PROVIDERS = { manual };

/* Registered by key so adding one is an import and a line here. A provider
   that needs credentials reads them from the environment itself, which keeps
   secrets out of the database and out of this file. */
export function getProvider(id = process.env.SHIPPING_PROVIDER) {
  return PROVIDERS[id] || manual;
}

export const listProviders = () => Object.values(PROVIDERS).map((p) => ({
  id: p.id,
  label: p.label,
  manualEntry: p.manualEntry,
  carriers: p.carriers(),
}));

/**
 * Normalises whatever a provider returns, so a half-filled response cannot
 * reach the database. A missing tracking URL is derived from the provider's
 * own pattern where it has one.
 */
export function normaliseShipment(provider, input = {}) {
  const carrier = String(input.carrier || '').trim() || null;
  const trackingNumber = String(input.trackingNumber || '').trim() || null;

  let trackingUrl = String(input.trackingUrl || '').trim() || null;
  if (!trackingUrl && trackingNumber) {
    trackingUrl = provider.trackingUrl({ carrier, trackingNumber }) || null;
  }
  // Only ever hand a customer a real link.
  if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) trackingUrl = null;

  return {
    carrier,
    trackingNumber,
    trackingUrl,
    meta: input.meta && typeof input.meta === 'object' ? input.meta : null,
  };
}
