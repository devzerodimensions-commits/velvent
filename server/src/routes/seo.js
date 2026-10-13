import { Router } from 'express';
import { query } from '../db.js';
import { ah } from '../lib/helpers.js';

const router = Router();

/** The real origin, taken from the request, so no domain is hard-coded. */
const origin = (req) => `${req.protocol}://${req.get('host')}`;

/** Pages that should never be indexed — private, or useless in a search result. */
const PRIVATE_PATHS = [
  '/admin', '/account', '/cart', '/checkout', '/order/', '/login', '/register', '/api/',
];

/** Everything a shopper can land on, with how often it is worth re-crawling. */
const STATIC_PAGES = [
  ['/', '1.0', 'daily'],
  ['/shop', '0.9', 'daily'],
  ['/about', '0.5', 'monthly'],
  ['/contact', '0.5', 'monthly'],
  ['/faq', '0.5', 'monthly'],
  ['/size-guide', '0.5', 'monthly'],
  ['/track-order', '0.3', 'yearly'],
  ['/shipping', '0.3', 'yearly'],
  ['/returns', '0.3', 'yearly'],
  ['/privacy', '0.3', 'yearly'],
  ['/terms', '0.3', 'yearly'],
];

const xmlEscape = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]
));

router.get('/robots.txt', (req, res) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${origin(req)}/sitemap.xml`,
    '',
  ];
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send(lines.join('\n'));
});

router.get('/sitemap.xml', ah(async (req, res) => {
  const base = origin(req);
  const [products, categories] = await Promise.all([
    query('SELECT slug, created_at FROM products WHERE is_active ORDER BY id'),
    query('SELECT slug FROM categories WHERE is_active ORDER BY sort_order, id'),
  ]);

  const url = (loc, priority, changefreq, lastmod) => [
    '  <url>',
    `    <loc>${xmlEscape(base + loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...STATIC_PAGES.map(([loc, priority, changefreq]) => url(loc, priority, changefreq)),
    ...categories.rows.map((c) => url(`/category/${c.slug}`, '0.8', 'weekly')),
    ...products.rows.map((p) => url(`/product/${p.slug}`, '0.8', 'weekly', p.created_at)),
    '</urlset>',
    '',
  ].join('\n');

  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(body);
}));

export default router;
