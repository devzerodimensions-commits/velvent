# VELVENT — E-commerce store

Premium knitted-cotton clothing store: **React (Vite) + Node/Express + Neon Postgres**, deployed as a
single service on **Render**.

- **Brand colours** — navy `#2C3544`, cream `#F6F2EA`, white, with slate `#586272` and mist `#D6D6D6` as supports.
- **Typography** — Montserrat, matching the brand sheet.
- **Logo** — the V monogram was traced from the brand sheet into a scalable SVG path
  (`client/src/lib/mark.js`), so it stays sharp at every size and can be recoloured with CSS.

---

## What is in the box

### Storefront
| Page | Route |
| --- | --- |
| Home — see **Homepage sections** below | `/` |
| Shop with filters (size, colour, price) + sort + pagination | `/shop` |
| Category listing | `/category/:slug` |
| Product detail — gallery, colour/size pickers, live stock, reviews, related | `/product/:slug` |
| Search | `/search?q=` |
| Cart | `/cart` |
| Checkout — guest or signed-in, COD + optional online payment | `/checkout` |
| Order confirmation & tracking timeline | `/order/:orderNumber` |
| Track an order without an account | `/track-order` |
| Sign in / Register | `/login`, `/register` |
| Account — orders, addresses, profile, password | `/account` |
| Wishlist | `/account/wishlist` |
| About, Contact, FAQs, Size Guide | `/about`, `/contact`, `/faq`, `/size-guide` |
| Shipping, Returns, Privacy, Terms | `/shipping`, `/returns`, `/privacy`, `/terms` |

### Homepage sections
Built to read like a clothing label rather than a generic shop. In order:

1. **Hero** — full-bleed editorial shot, vertical lookbook rule, and a "shown here" credit card
   linking straight to the product.
2. **Promise bar** — shipping, returns, COD, secure checkout.
3. **Shop by Category** — three numbered editorial tiles with live style counts.
4. **Brand marquee** — a scrolling typographic band (Simple · Timeless · Premium · Knitted Cotton)
   separated by the V mark. Pauses on hover.
5. **New Arrivals** — product rail.
6. **Anatomy of a polo** — the interactive showpiece. One full garment photo with four numbered
   markers over it; tapping or hovering a marker swaps the macro close-up and the copy beside it.
   The four points (collar, placket, cable panel, hem) are all on the *same* garment, and each
   close-up is cropped from that same photograph, so a marker always points at the thing it
   describes. The points are repeated as a row of buttons underneath so it works without hunting
   for markers, and on touch screens.
7. **Bestsellers** — product rail.
8. **Which fit is for you?** — three comparison cards (fit, collar, best for, sizing note) plus the
   S–3XL size run as links into a size-filtered shop.
9. **Brand story** — the V mark, the positioning, a four-up image grid.
10. **Questions, answered** — the five most-asked questions as an accordion, linking on to the FAQ page.
11. **Signup band** — newsletter, sitting flush against the footer.

To move a marker, edit `POINTS` in `client/src/pages/Home.jsx` — `x` and `y` are percentages of the
garment photo. The close-ups live in `client/public/products/anatomy-*.jpg`.

### Admin panel (`/admin`, admin role only)
Dashboard with 14-day revenue chart and low-stock alerts · product CRUD with image upload and a
bulk "add S–3XL for this colour" builder · order management with status workflow · categories ·
coupons · contact inbox and newsletter subscribers.

### Commerce behaviour worth knowing
- **Prices are never trusted from the browser.** Every cart is re-priced server-side from the
  database (`server/src/lib/pricing.js`) before an order is written.
- **Stock is locked on checkout** with `SELECT … FOR UPDATE`, so two people cannot buy the same
  last piece.
- **Cancelling an order returns its stock.**
- **Uploaded images are stored in Postgres** and served from `/api/media/:id`, because Render's
  filesystem is wiped on every deploy.
- **`/robots.txt` and `/sitemap.xml` are generated from the live catalog**, with the origin taken
  from the request, so there is no domain to configure and every new product appears in the
  sitemap on its own.
- **Only Vite’s fingerprinted assets are cached for a year.** The HTML shell is `no-cache` so a
  deploy takes effect at once, and product photos keep a one-hour cache since their names are
  stable across deploys.

---

## Running it locally

### 1. Create a Neon database
1. Sign in at [neon.tech](https://neon.tech) and create a project.
2. Copy the **pooled** connection string (it has `-pooler` in the host).

### 2. Configure the server
```bash
cp server/.env.example server/.env
```
Fill in `server/.env`:
```
DATABASE_URL=postgresql://…-pooler….neon.tech/neondb?sslmode=require
JWT_SECRET=<a long random string>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<pick a strong one>
```
Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Install, create the tables, load the catalog
```bash
npm run install:all
npm run db:setup
npm run db:seed
```

### 4. Start both halves
```bash
npm run dev:server   # API on http://localhost:5000
npm run dev:client   # Store on http://localhost:5173
```
Vite proxies `/api` to the server, so there is nothing else to configure.

Sign in at `/login` with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set, then open `/admin`.

---

## Deploying to Render

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, point it at the repo. `render.yaml` is picked up automatically.
3. Set these environment variables in the Render dashboard (they are marked `sync: false`):
   - `DATABASE_URL` — the Neon pooled connection string
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — only if you want online payment
   `JWT_SECRET` is generated for you. The server refuses to start in production without it,
   so do not clear it.
4. Deploy. Then run the migrations **once** against the same Neon database, from your machine:
   ```bash
   npm run db:setup
   npm run db:seed
   ```
5. Check `https://<your-service>.onrender.com/api/health` — it should report
   `{"status":"ok","db":"connected",…}`.
6. Run the end-to-end check against the deployed store:
   ```bash
   npm run smoke -- https://<your-service>.onrender.com
   ```
   It browses, prices a cart, applies a coupon, places a COD order, looks it up as a guest and
   cancels it to confirm the stock came back. **It writes to whatever database it points at**, so
   against production it leaves a test order and a test account behind — delete them from
   `/admin` afterwards.

Render builds with `npm run build` (installs both halves and builds the client) and serves with
`npm start`. In production Express serves `client/dist` itself, so there is only one service and
no CORS to configure.

> On Render's free plan the service sleeps after inactivity; the first request after a sleep takes
> ~30 seconds. Any paid instance type removes that.

---

## Payments

Out of the box the store takes **Cash on Delivery**, which needs no configuration.

Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` and an online payment option (UPI, cards, net
banking, wallets) appears at checkout automatically — the server exposes what is configured via
`GET /api/payment-methods`, and the payment signature is verified server-side before an order is
marked paid. No keys, no option shown.

---

## Catalog data

Seeded from `server/src/scripts/seed.js`:

| Category | Products |
| --- | --- |
| Polo T-Shirt | Rugby Stripe, Heritage Stripe, Cable Knit Contrast (2 colours), Coastal Stripe |
| Polo Shirt | Riviera Stripe Knitted Shirt (2 colours) |
| Oversized T-Shirt | Essential, Pigment Dyed, Monogram (3 colours each) |

Every product carries **S, M, L, XL, XXL, 3XL** at **MRP ₹1,499 / sale ₹1,005 (33% off)**,
Knitted Cotton, machine wash, 450 g.

**Stock** is seeded at **25 per size per colour** — change `DEFAULT_STOCK` in the seed, or edit any
variant in the admin panel.

Coupons seeded: `VELVENT10` (10% above ₹999), `FIRST200` (₹200 off above ₹1,500),
`PAIRUP` (15% above ₹2,000).

### Product imagery
- The eight supplied photographs live in `client/public/products/`. The Gemini sparkle watermark
  was removed from the five images that carried it (mask-based inpainting; the originals are
  untouched in your source folder).
- The **Oversized T-Shirt** category has no photography yet, so its nine images are
  brand-built SVG product renders in the VELVENT palette. Replace them with real photos from
  **Admin → Products → Images → Upload** whenever the shoot is done; nothing else needs changing.

---

## Project layout

```
client/                 React + Vite + Tailwind
  public/products/      product imagery
  public/brand/         logo mark + favicon
  src/components/       Header, Footer, ProductCard, CartDrawer, Icons, ui primitives
  src/pages/            storefront pages
  src/pages/admin/      admin panel (lazy-loaded, separate bundle)
  src/store/            cart, auth and toast context
  src/lib/              api client, formatters, brand constants, logo path

server/                 Express API
  src/schema.sql        full database schema
  src/routes/           catalog, auth, orders, admin, misc
  src/lib/              auth, pricing, helpers
  src/scripts/          setup.js (migrate), seed.js (catalog + admin user)

render.yaml             Render blueprint
```

## Useful commands

```bash
npm run install:all   # install client + server
npm run db:setup      # create tables (add -- --drop to rebuild from scratch)
npm run db:seed       # load categories, products, variants, coupons, admin user
npm run build         # production build
npm start             # production server (serves API + built client)
```
