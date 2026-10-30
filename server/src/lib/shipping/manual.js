/**
 * Shipping by hand.
 *
 * Nothing is booked over an API. Someone packs the parcel, hands it to a
 * courier, and types the number back into the admin. For a store sending a few
 * parcels a day that is how it actually works, and it keeps the shop free of a
 * courier account until it wants one.
 *
 * The tracking links are the public consumer pages for each courier, so a
 * customer gets a working link today without any integration at all.
 */

const TRACKING = {
  'Blue Dart': (n) => `https://www.bluedart.com/trackdartresultthirdparty?handler=tfb&trackFor=0&trackNo=${n}`,
  Delhivery: (n) => `https://www.delhivery.com/track/package/${n}`,
  DTDC: (n) => `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${n}`,
  'Ecom Express': (n) => `https://ecomexpress.in/tracking/?awb_field=${n}`,
  'India Post': (n) => `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?logicalname=${n}`,
  Shadowfax: (n) => `https://tracker.shadowfax.in/#/tracking/${n}`,
  Xpressbees: (n) => `https://www.xpressbees.com/shipment/tracking?awb=${n}`,
};

export const manual = {
  id: 'manual',
  label: 'Enter tracking by hand',
  manualEntry: true,

  carriers: () => Object.keys(TRACKING),

  /**
   * Returns null for a carrier we have no pattern for — the admin can still
   * paste a link, and a wrong guess would be worse than none.
   */
  trackingUrl: ({ carrier, trackingNumber }) => {
    const build = TRACKING[carrier];
    return build && trackingNumber ? build(encodeURIComponent(trackingNumber)) : null;
  },

  /**
   * There is nothing to book, so this just hands back what the admin typed.
   * A real provider would call its API here and return the same shape.
   */
  createShipment: async (_order, input = {}) => ({
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    trackingUrl: input.trackingUrl,
    meta: null,
  }),
};
