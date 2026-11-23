-- VELVENT store schema (PostgreSQL / Neon)

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  tagline     TEXT,
  description TEXT,
  image_url   TEXT,
  sort_order  INT  NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  -- { note, rows: [[size, chest, length, sleeve, shoulder], ...],
  --   howTo: [[label, text], ...] } — the size guide for this category, edited
  -- in the admin. NULL means the storefront falls back to its built-in chart.
  size_chart  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  short_desc    TEXT,
  description   TEXT,
  mrp           NUMERIC(10,2) NOT NULL,
  sale_price    NUMERIC(10,2) NOT NULL,
  fabric        TEXT,
  wash_care     TEXT,
  fit           TEXT,
  sleeve        TEXT,
  collar        TEXT,
  weight_grams  INT,
  rating        NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count  INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN NOT NULL DEFAULT FALSE,
  is_new        BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_active_idx   ON products(is_active);

CREATE TABLE IF NOT EXISTS product_images (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt        TEXT,
  color      TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL,
  color      TEXT NOT NULL,
  color_hex  TEXT,
  sku        TEXT UNIQUE NOT NULL,
  stock      INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, size, color)
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT,
  full_name  TEXT NOT NULL,
  phone      TEXT NOT NULL,
  line1      TEXT NOT NULL,
  line2      TEXT,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL,
  pincode    TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses(user_id);

CREATE TABLE IF NOT EXISTS coupons (
  id          SERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'percent',      -- percent | flat
  value       NUMERIC(10,2) NOT NULL,
  min_order   NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(10,2),
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
  id                  SERIAL PRIMARY KEY,
  order_number        TEXT UNIQUE NOT NULL,
  user_id             INT REFERENCES users(id) ON DELETE SET NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'processing', -- WooCommerce: pending|processing|on-hold|shipped|completed|cancelled|refunded|failed
  payment_method      TEXT NOT NULL DEFAULT 'cod',      -- cod|razorpay
  payment_status      TEXT NOT NULL DEFAULT 'pending',  -- pending|paid|failed|refunded
  subtotal            NUMERIC(10,2) NOT NULL,
  discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total               NUMERIC(10,2) NOT NULL,
  coupon_code         TEXT,
  shipping_address    JSONB NOT NULL,
  notes               TEXT,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_user_idx    ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE SET NULL,
  variant_id  INT REFERENCES product_variants(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  slug        TEXT,
  image_url   TEXT,
  size        TEXT NOT NULL,
  color       TEXT NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL,
  quantity    INT NOT NULL
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);

CREATE TABLE IF NOT EXISTS wishlist (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT NOT NULL,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      TEXT,
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews(product_id);

CREATE TABLE IF NOT EXISTS media (
  id         SERIAL PRIMARY KEY,
  filename   TEXT,
  mime       TEXT NOT NULL,
  bytes      BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS newsletter (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* Every piece of standing copy the admin can edit — the header ticker, the
   footer columns, the brand's phone and hours, each static page's text and
   images. One row per area, the shape of the value decided by the editor that
   writes it, so a new field is a client change and never a migration. The
   client ships defaults for all of it, so an empty table renders the store. */
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


/* Checkouts that were started and never finished.

   One row per shopper, replaced as they go, so a person who tries three times
   is one row and not three. It is deleted the moment their order is placed —
   a cart that became a sale is not abandoned, and keeping it would mean the
   shop chasing people who have already paid.

   This is personal data about someone who did not buy, so it carries a
   deliberate expiry rather than sitting there forever; see purgeAbandoned. */
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  name       TEXT,
  phone      TEXT,
  items      JSONB NOT NULL,
  subtotal   NUMERIC(10,2) NOT NULL DEFAULT 0,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_email_idx
  ON abandoned_carts (LOWER(email));

/* ---------------------------------------------------------------- migrations
   CREATE TABLE IF NOT EXISTS leaves an existing table alone, so a column added
   after a database was first built needs saying again here. Each one is
   idempotent, so running setup against any database brings it up to date. */

ALTER TABLE categories ADD COLUMN IF NOT EXISTS size_chart JSONB;

/* Dispatch details. Deliberately plain columns rather than a courier's own
   shape: a carrier name, the number it gave us, and the two timestamps a
   customer actually asks about. Whatever provider is plugged in later fills
   these same fields, so the storefront never learns who is carrying the
   parcel. shipment_meta holds whatever extra that provider wants to keep. */
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_meta   JSONB;

/* What the shop says to itself about an order — "customer asked to change the
   size", "second delivery attempt". Separate from notes, which is what the
   customer wrote at checkout and is theirs, not ours to edit. */
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

/* Review moderation.

   The two statements are a pair and the order matters. The first adds the
   column with DEFAULT 'approved', which backfills every review already in
   the table — those were live on the storefront before moderation existed,
   and silently hiding them would be the wrong way to introduce it. The second
   changes the default so everything written from now on arrives pending.
   Both are idempotent, so running this again changes nothing. */
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE reviews ALTER COLUMN status SET DEFAULT 'pending';

/* The shop answering a review in public, under the review it answers. */
/* Media can live in this table or on the server's disk — see lib/media.
   storage_key names the file when it is on disk, and bytes is then empty, so
   the column can no longer be NOT NULL. size_bytes records the size either
   way, because OCTET_LENGTH(bytes) has nothing to measure once the bytes are
   somewhere else. */
ALTER TABLE media ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS size_bytes  INT;
ALTER TABLE media ALTER COLUMN bytes DROP NOT NULL;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply      TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

/* ------------------------------------------------------------------- GST

   Indian apparel is sold at an MRP that already contains the tax, so these
   columns record a split of a price the shopper already saw rather than
   anything added on top. Changing them never changes what the store charges.

   tax_rate is per product and may be NULL, which means "work it out from the
   price": garments are 5% up to ₹1,000 a piece and 12% above it. Setting a
   rate here overrides that for products the slab rule gets wrong. */
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);

/* Parcel size. Shiprocket and every other courier API refuses an order
   without these, so they live beside weight_grams rather than in whatever
   provider gets plugged in later. */
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm  NUMERIC(6,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth_cm NUMERIC(6,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm  NUMERIC(6,2);

/* One product video. A URL rather than a table of its own: YouTube, Vimeo or
   a direct MP4 all fit, and a shop with no video stores nothing. */
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

/* The tax split, frozen onto the order the moment it is placed. Recomputing
   it later from today's rates would rewrite history every time a rate or a
   price changed, and a tax invoice must say what was actually charged.

   Place of supply decides the split: the buyer's state inside Gujarat means
   CGST + SGST, anywhere else means IGST. Both are stored so neither has to be
   inferred when an invoice is printed months later. */
ALTER TABLE orders ADD COLUMN IF NOT EXISTS taxable_amount  NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cgst            NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sgst            NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS igst            NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS place_of_supply TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number  TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_date    TIMESTAMPTZ;

/* Per line, because an invoice has to show the rate and HSN against each
   item, and because a cart can mix the 5% and 12% slabs. */
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS hsn_code       TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_rate       NUMERIC(5,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tax_amount     NUMERIC(10,2);

/* Invoice numbering.

   A tax invoice number has to be unique and run in sequence within a
   financial year, so the counter is a row the database increments atomically
   rather than a MAX() read that two orders could win at once. One row per
   year, which is also what makes the number restart each April. */
CREATE TABLE IF NOT EXISTS invoice_counters (
  fy          TEXT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);

/* ----------------------------------------------------------- built pages

   Pages assembled in the visual builder. The layout is one JSON document —
   sections holding columns holding widgets — because the shape of a page is
   the thing the client keeps changing, and a schema that needed a migration
   every time they added a widget would be the wrong shape for the job.

   Nothing here is ever rendered as HTML. The storefront walks the tree and
   renders React components, so a value in this column cannot become markup
   in a shopper's browser. */
CREATE TABLE IF NOT EXISTS pages (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  content    JSONB NOT NULL DEFAULT '{"sections":[]}'::jsonb,
  seo_title  TEXT,
  seo_desc   TEXT,
  show_in_nav BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pages_status_idx ON pages(status);

/* Every save keeps the version it replaced, so a client who spends an
   afternoon on a page and then wrecks it has somewhere to go back to. Undo
   in the editor only survives while the tab is open; this survives the tab
   being closed. Trimmed to the last 30 per page on write. */
CREATE TABLE IF NOT EXISTS page_revisions (
  id         SERIAL PRIMARY KEY,
  page_id    INT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  content    JSONB NOT NULL,
  author_id  INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS page_revisions_page_idx ON page_revisions(page_id, id DESC);
