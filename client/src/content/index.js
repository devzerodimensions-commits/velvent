import * as brand from './brand';
import * as header from './header';
import * as footer from './footer';
import * as home from './home';
import * as about from './about';
import * as contact from './contact';
import * as faq from './faq';
import { shipping, returns, privacy, terms } from './policies';

/**
 * Every editable section of the store, in the order the admin menu lists them.
 *
 * A section is its built-in copy plus the fields that copy is edited through,
 * so adding something new to a page means adding it here once — the editor,
 * the storefront and the API all pick it up without further wiring.
 */
export const SECTIONS = [
  { key: 'brand', label: 'Brand & contact', group: 'Site', blurb: 'Name, phone, email, hours, social links and the shipping rules.', ...brand },
  { key: 'header', label: 'Header', group: 'Site', blurb: 'The announcement bar and the main menu.', ...header },
  { key: 'footer', label: 'Footer', group: 'Site', blurb: 'Link columns, the newsletter note and payment badges.', ...footer },

  { key: 'home', label: 'Home', group: 'Pages', blurb: 'The opening stages, the range, the anatomy section and the bands below.', ...home },
  { key: 'about', label: 'About', group: 'Pages', blurb: 'The story, the photo grids and the brand values.', ...about },
  { key: 'contact', label: 'Contact', group: 'Pages', blurb: 'The heading, the intro and the enquiry subjects.', ...contact },
  { key: 'faq', label: 'FAQs', group: 'Pages', blurb: 'Every question and answer, in groups.', ...faq },

  { key: 'shipping', label: 'Shipping policy', group: 'Policies', blurb: 'Where you ship, what it costs and how long it takes.', ...shipping },
  { key: 'returns', label: 'Returns & exchange', group: 'Policies', blurb: 'The return window, refunds and exchanges.', ...returns },
  { key: 'privacy', label: 'Privacy policy', group: 'Policies', blurb: 'What you collect and what you do with it.', ...privacy },
  { key: 'terms', label: 'Terms of service', group: 'Policies', blurb: 'The ground rules for buying from the store.', ...terms },
];

export const SECTION_BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

/** What the storefront falls back to for everything nobody has edited. */
export const DEFAULTS = Object.fromEntries(SECTIONS.map((s) => [s.key, s.defaults]));
