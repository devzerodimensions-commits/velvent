import { slugify } from './helpers.js';

/**
 * Rules about built pages that both the admin and the storefront rely on.
 */

/**
 * Slugs a built page may not take.
 *
 * Every one of these is a route the storefront already serves. A page saved
 * at "cart" would never be reachable — the real cart wins — and the client
 * would be left with a page they built, published, and cannot find. Refusing
 * the slug up front is the only version of this that is explainable.
 */
export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'shop', 'search', 'cart', 'checkout', 'order', 'track-order',
  'login', 'register', 'account', 'product', 'category', 'about', 'contact',
  'faq', 'size-guide', 'shipping', 'returns', 'privacy', 'terms', 'wishlist',
  'sitemap.xml', 'robots.txt',
]);

/** How deep and how wide a page may get before we stop accepting it. */
const LIMITS = { sections: 80, columns: 12, widgets: 120, bytes: 512 * 1024 };

export function checkSlug(raw) {
  const slug = slugify(raw || '');
  if (!slug) return { error: 'Give the page a name.' };
  if (slug.length > 80) return { error: 'That address is too long.' };
  if (RESERVED_SLUGS.has(slug)) {
    return { error: `“/${slug}” is already used by the store itself. Pick another address.` };
  }
  return { slug };
}

/**
 * Checks a layout document before it is stored.
 *
 * The editor only ever sends well-formed trees, but the endpoint is reachable
 * with anything, and a page is read back by every visitor. Size and shape are
 * checked here so a bad document is refused at the door rather than found at
 * render time.
 */
export function checkContent(content) {
  if (!content || typeof content !== 'object' || !Array.isArray(content.sections)) {
    return { error: 'That page layout could not be read.' };
  }
  if (JSON.stringify(content).length > LIMITS.bytes) {
    return { error: 'That page is too large to save. Try splitting it into two pages.' };
  }
  if (content.sections.length > LIMITS.sections) {
    return { error: `A page can hold up to ${LIMITS.sections} sections.` };
  }
  for (const section of content.sections) {
    const columns = Array.isArray(section?.columns) ? section.columns : [];
    if (columns.length > LIMITS.columns) {
      return { error: `A section can hold up to ${LIMITS.columns} columns.` };
    }
    for (const column of columns) {
      const widgets = Array.isArray(column?.widgets) ? column.widgets : [];
      if (widgets.length > LIMITS.widgets) {
        return { error: `A column can hold up to ${LIMITS.widgets} widgets.` };
      }
    }
  }
  return { content };
}
