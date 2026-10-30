import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import { optionalAuth } from './lib/auth.js';
import { migrateOnBoot } from './lib/migrate.js';
import { purgeAbandoned } from './lib/abandoned.js';
import catalogRoutes from './routes/catalog.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import miscRoutes from './routes/misc.js';
import seoRoutes from './routes/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Written out by hand rather than pulling in helmet, so there is no default
// content policy that could quietly start blocking the fonts or Razorpay.
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (isProd) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// In production the store and the API are the same origin, so no CORS headers
// are needed at all. Only open it up when CLIENT_ORIGIN names a separate front
// end, and never reflect an arbitrary origin back with credentials allowed.
const corsOrigin = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : !isProd;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(optionalAuth);

/** Throttle for anything a stranger can write to. POST only, so reads stay free. */
const writeLimit = (minutes, limit) => rateLimit({
  windowMs: minutes * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method !== 'POST',
  message: { error: 'That is a lot of requests. Please wait a minute and try again.' },
});

app.use('/api/auth/login', writeLimit(15, 20));
app.use('/api/auth/register', writeLimit(60, 10));
app.use('/api/orders', writeLimit(10, 12));       // placing orders + payment verification
app.use('/api/products', writeLimit(60, 10));     // the only POST here is a review
app.use('/api/contact', writeLimit(60, 5));
app.use('/api/newsletter', writeLimit(60, 10));

/**
 * The admin API had no ceiling at all.
 *
 * Every route behind it already requires an admin token, so this is not about
 * strangers — it is about what a leaked or stolen token can do before anyone
 * notices, and about a loop in the panel that goes wrong at three in the
 * morning. The limit is deliberately generous: a real stock-take saves a
 * screenful at a time and a media upload is one request per file, so ordinary
 * work never comes close.
 *
 * Unlike the others this counts reads as well. Exporting the customer list is
 * a GET, and quietly draining it is the thing worth slowing down.
 */
app.use('/api/admin', rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  /* Counted per admin, so one person working hard never throttles another.
     Every route here needs a token, so a request without one is already going
     to be refused — those share a single bucket, which is the behaviour we
     want anyway: it is someone knocking without a key.

     Keying on the admin id rather than the address also sidesteps the IPv6
     question entirely. A hand-written address key counts every address in a
     /64 separately, which is one household, and this version of the library
     does not export the helper that handles it. */
  keyGenerator: (req) => (req.user?.id ? `admin:${req.user.id}` : 'no-token'),
  message: { error: 'That is a lot of requests in one minute. Wait a moment and try again.' },
}));

app.use('/api', miscRoutes);
app.use('/api', catalogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown endpoint.' }));

// robots.txt and sitemap.xml are generated from the live catalog.
app.use(seoRoutes);

// In production this one service also serves the built React app.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    index: false,
    setHeaders: (res, filePath) => {
      if (!isProd) return res.set('Cache-Control', 'no-cache');
      if (filePath.endsWith('.html')) {
        // The shell must never be cached, or a deploy leaves browsers asking
        // for asset filenames that no longer exist.
        return res.set('Cache-Control', 'no-cache');
      }
      // Vite fingerprints everything under assets/, so it can never go stale.
      if (path.relative(clientDist, filePath).split(path.sep)[0] === 'assets') {
        return res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Product photos and the logo keep their names across deploys.
      return res.set('Cache-Control', 'public, max-age=3600');
    },
  }));
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else if (isProd) {
  console.warn('[velvent] client/dist not found - run "npm run build" before starting in production.');
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.message?.includes('allowed') ? 400 : 500);
  if (status >= 500) console.error('[velvent]', err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
  });
});

// The schema is brought up to date before the first request, not during the
// build: the running server is the one place DATABASE_URL is guaranteed.
await migrateOnBoot();

// Personal data of people who did not buy should not outlive its usefulness.
await purgeAbandoned();

app.listen(PORT, () => {
  console.log(`[velvent] API listening on http://localhost:${PORT}`);
  console.log(`[velvent] mode: ${isProd ? 'production' : 'development'}`);
});
