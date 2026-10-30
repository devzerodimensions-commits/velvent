import * as settings from './settings';
import * as brand from './brand';
import * as header from './header';
import * as footer from './footer';
import * as home from './home';
import * as about from './about';
import * as contact from './contact';
import * as faq from './faq';
import * as sizeGuide from './sizeGuide';
import * as notFound from './notFound';
import * as shop from './shop';
import * as product from './product';
import * as cart from './cart';
import * as checkout from './checkout';
import * as account from './account';
import { shipping, returns, privacy, terms } from './policies';

/**
 * Every editable section of the store, in the order the admin menu lists them.
 *
 * A section is its built-in copy plus the fields that copy is edited through,
 * so adding something new to a page means adding it here once — the editor,
 * the storefront and the API all pick it up without further wiring.
 *
 * Between them these cover every page the store has. What is deliberately not
 * here is anything that belongs to a single product, category or order: that
 * is data, edited where that record is edited.
 */
export const SECTIONS = [
  { key: 'settings', label: 'Store settings', group: 'Site', blurb: 'Site icon, search defaults, stock warnings and maintenance mode.', ...settings },
  { key: 'brand', label: 'Brand & contact', group: 'Site', blurb: 'Name, phone, email, hours, social links and the shipping rules.', ...brand },
  { key: 'header', label: 'Header', group: 'Site', blurb: 'The announcement bar and the main menu.', ...header },
  { key: 'footer', label: 'Footer', group: 'Site', blurb: 'Link columns, the newsletter note and payment badges.', ...footer },

  { key: 'home', label: 'Home', group: 'Pages', blurb: 'The opening stages, the range, the anatomy section and the bands below.', ...home },
  { key: 'about', label: 'About', group: 'Pages', blurb: 'The story, the photo grids and the brand values.', ...about },
  { key: 'contact', label: 'Contact', group: 'Pages', blurb: 'The heading, the intro and the enquiry subjects.', ...contact },
  { key: 'faq', label: 'FAQs', group: 'Pages', blurb: 'Every question and answer, in groups.', ...faq },
  { key: 'sizeGuide', label: 'Size guide', group: 'Pages', blurb: 'The intro and the between-two-sizes box. Charts are per category.', ...sizeGuide },
  { key: 'notFound', label: 'Page not found', group: 'Pages', blurb: 'What a stale link shows.', ...notFound },

  { key: 'shop', label: 'Shop & search', group: 'Shopping', blurb: 'Listing headings, filter labels and the no-results text.', ...shop },
  { key: 'product', label: 'Product page', group: 'Shopping', blurb: 'The reassurance strip, section headings and shipping lines.', ...product },
  { key: 'cart', label: 'Bag', group: 'Shopping', blurb: 'The bag, its empty state and the free-shipping nudge.', ...cart },
  { key: 'checkout', label: 'Checkout & confirmation', group: 'Shopping', blurb: 'Checkout headings, the thank-you page and the membership offer.', ...checkout },
  { key: 'account', label: 'Account & sign in', group: 'Shopping', blurb: 'Signing in, registering, the account area, wishlist and tracking.', ...account },

  { key: 'shipping', label: 'Shipping policy', group: 'Policies', blurb: 'Where you ship, what it costs and how long it takes.', ...shipping },
  { key: 'returns', label: 'Returns & exchange', group: 'Policies', blurb: 'The return window, refunds and exchanges.', ...returns },
  { key: 'privacy', label: 'Privacy policy', group: 'Policies', blurb: 'What you collect and what you do with it.', ...privacy },
  { key: 'terms', label: 'Terms of service', group: 'Policies', blurb: 'The ground rules for buying from the store.', ...terms },
];

export const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

/** What the storefront falls back to for everything nobody has edited. */
export const DEFAULTS = Object.fromEntries(SECTIONS.map((s) => [s.key, s.defaults]));
