/**
 * End-to-end check of the page builder and GST, against a running API.
 *
 *   npm --prefix server run smoke:builder
 *   npm --prefix server run smoke:builder -- https://your.app
 *
 * Everything it creates, it deletes. The page it builds is left as a draft
 * until the moment it needs to prove publishing works, and the slug is
 * stamped with a timestamp so a half-finished run can never collide with a
 * real page. It writes to `pages` and `page_revisions` only — no product,
 * order or customer data is touched.
 */
import dotenv from 'dotenv';

dotenv.config();

const BASE = (process.argv[2] || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');
const SLUG = `zz-builder-test-${Date.now()}`;

let pass = 0;
let fail = 0;
let token = null;
let pageId = null;

const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

async function call(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function check(name, fn) {
  try {
    const note = await fn();
    pass += 1;
    console.log(`${g('PASS')}  ${name}${note ? ` ${dim(note)}` : ''}`);
  } catch (err) {
    fail += 1;
    console.log(`${r('FAIL')}  ${name}\n      ${err.message}`);
  }
}

const must = (cond, message) => { if (!cond) throw new Error(message); };

/* A small page: one section, two columns, a heading and a button. */
const DOC = {
  sections: [{
    id: 'sec1',
    kind: 'section',
    settings: { bgType: 'color', bgColor: '#F6F2EA', padding: { d: { top: 40, right: 20, bottom: 40, left: 20, unit: 'px' } } },
    columns: [
      {
        id: 'col1',
        kind: 'column',
        settings: { width: { d: 60 } },
        widgets: [{ id: 'w1', kind: 'widget', type: 'heading', settings: { text: 'Builder smoke test', tag: 'h1', fontSize: { d: 42, m: 24 } } }],
      },
      {
        id: 'col2',
        kind: 'column',
        settings: { width: { d: 40 } },
        widgets: [{ id: 'w2', kind: 'widget', type: 'button', settings: { label: 'Shop', href: '/shop' } }],
      },
    ],
  }],
};

async function main() {
  console.log(dim(`\nBuilder + GST smoke test against ${BASE}\n`));

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(r('ADMIN_EMAIL / ADMIN_PASSWORD are not set — nothing here can run.'));
    process.exit(1);
  }

  await check('admin can sign in', async () => {
    const { status, data } = await call('/auth/login', { method: 'POST', auth: false, body: { email, password } });
    must(status === 200 && data.token, `login returned ${status}`);
    must(data.user?.role === 'admin', 'that account is not an admin');
    token = data.token;
  });
  if (!token) { console.log(r('\nCannot continue without a session.')); process.exit(1); }

  /* ------------------------------------------------------------- pages */

  await check('the pages list answers', async () => {
    const { status, data } = await call('/admin/pages');
    must(status === 200 && Array.isArray(data), `got ${status}`);
    return `${data.length} existing`;
  });

  await check('a page can be created', async () => {
    const { status, data } = await call('/admin/pages', { method: 'POST', body: { title: 'Builder smoke test', slug: SLUG } });
    must(status === 201, `got ${status}: ${JSON.stringify(data)}`);
    must(data.status === 'draft', 'a new page should start as a draft');
    must(data.slug === SLUG, `slug came back as ${data.slug}`);
    pageId = data.id;
    return `/${SLUG}`;
  });
  if (!pageId) { console.log(r('\nNo page to work with.')); process.exit(1); }

  await check('a reserved slug is refused', async () => {
    const { status, data } = await call('/admin/pages', { method: 'POST', body: { title: 'Cart', slug: 'cart' } });
    must(status === 400, `expected 400, got ${status}`);
    must(/already used by the store/i.test(data.error || ''), `unexpected message: ${data.error}`);
  });

  await check('a duplicate slug is refused', async () => {
    const { status } = await call('/admin/pages', { method: 'POST', body: { title: 'Again', slug: SLUG } });
    must(status === 409, `expected 409, got ${status}`);
  });

  await check('the layout saves', async () => {
    const { status, data } = await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { content: DOC } });
    must(status === 200, `got ${status}: ${JSON.stringify(data)}`);
    must(data.content?.sections?.length === 1, 'the section did not come back');
    must(data.content.sections[0].columns.length === 2, 'the columns did not come back');
  });

  await check('a draft is invisible to shoppers', async () => {
    const { status } = await call(`/pages/${SLUG}`, { auth: false });
    must(status === 404, `a draft answered with ${status}`);
  });

  await check('publishing makes it visible', async () => {
    const put = await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { status: 'published' } });
    must(put.status === 200 && put.data.status === 'published', 'publish did not take');

    const { status, data } = await call(`/pages/${SLUG}`, { auth: false });
    must(status === 200, `the published page answered with ${status}`);
    must(data.content?.sections?.[0]?.columns?.[1]?.widgets?.[0]?.type === 'button', 'the layout did not survive the round trip');
  });

  await check('the public page hides what it should', async () => {
    const { data } = await call(`/pages/${SLUG}`, { auth: false });
    must(!('id' in data), 'the internal id is exposed');
    must(!('show_in_nav' in data), 'show_in_nav is exposed');
  });

  await check('editing again keeps a revision', async () => {
    const changed = JSON.parse(JSON.stringify(DOC));
    changed.sections[0].columns[0].widgets[0].settings.text = 'Changed';
    const put = await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { content: changed } });
    must(put.status === 200, `save returned ${put.status}`);

    const { status, data } = await call(`/admin/pages/${pageId}/revisions`);
    must(status === 200 && data.length >= 1, `expected a revision, got ${data.length}`);
    return `${data.length} kept`;
  });

  await check('renaming does not add a revision', async () => {
    const before = (await call(`/admin/pages/${pageId}/revisions`)).data.length;
    await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { title: 'Renamed' } });
    const after = (await call(`/admin/pages/${pageId}/revisions`)).data.length;
    must(before === after, `revisions went from ${before} to ${after}`);
  });

  await check('an earlier version can be restored', async () => {
    const revisions = (await call(`/admin/pages/${pageId}/revisions`)).data;
    must(revisions.length > 0, 'nothing to restore');
    const { status, data } = await call(`/admin/pages/${pageId}/revisions/${revisions[0].id}/restore`, { method: 'POST' });
    must(status === 200, `restore returned ${status}`);
    must(data.content.sections[0].columns[0].widgets[0].settings.text === 'Builder smoke test', 'the old text did not come back');
  });

  await check('an oversized layout is refused', async () => {
    const huge = { sections: Array.from({ length: 200 }, (_, i) => ({ id: `s${i}`, kind: 'section', settings: {}, columns: [] })) };
    const { status } = await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { content: huge } });
    must(status === 400, `expected 400, got ${status}`);
  });

  await check('rubbish content is refused', async () => {
    const { status } = await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { content: { nope: true } } });
    must(status === 400, `expected 400, got ${status}`);
  });

  await check('the nav list only shows what opted in', async () => {
    const before = (await call('/nav-pages', { auth: false })).data;
    must(!before.some((p) => p.slug === SLUG), 'it is in the menu without being asked');
    await call(`/admin/pages/${pageId}`, { method: 'PUT', body: { show_in_nav: true } });
    const after = (await call('/nav-pages', { auth: false })).data;
    must(after.some((p) => p.slug === SLUG), 'it did not appear after opting in');
  });

  /* --------------------------------------------------------------- GST */

  await check('the cart reports tax', async () => {
    const list = await call('/products?limit=1', { auth: false });
    const product = list.data?.products?.[0];
    must(product, 'no products to price');

    const full = await call(`/products/${product.slug}`, { auth: false });
    const variant = (full.data.variants || []).find((v) => v.stock > 0);
    must(variant, 'no variant in stock to price');

    const { status, data } = await call('/cart/price', {
      method: 'POST',
      auth: false,
      body: { items: [{ variantId: variant.id, quantity: 1 }] },
    });
    must(status === 200, `pricing returned ${status}`);

    /* GST ships switched off, so `null` here is the correct answer until the
       client fills in a GSTIN — the point of the check is that the field is
       wired through either way, and that no price moved. */
    const tax = data.totals?.tax;
    must(tax === null || typeof tax?.amount === 'number', `unexpected tax shape: ${JSON.stringify(tax)}`);
    must(Number(data.totals.total) > 0, 'the total is wrong');
    return tax === null ? 'GST is off, as shipped' : `₹${tax.amount} of ₹${data.totals.total}`;
  });

  /* ------------------------------------------------------------ cleanup */

  await check('the test page is deleted', async () => {
    const { status } = await call(`/admin/pages/${pageId}`, { method: 'DELETE' });
    must(status === 200, `delete returned ${status}`);

    const gone = await call(`/pages/${SLUG}`, { auth: false });
    must(gone.status === 404, 'it is still being served');

    const list = await call('/admin/pages');
    must(!list.data.some((p) => p.slug === SLUG), 'it is still in the list');
    pageId = null;
  });

  console.log(`\n${pass} passed, ${fail === 0 ? '0 failed' : r(`${fail} failed`)}\n`);
  process.exit(fail ? 1 : 0);
}

main().catch(async (err) => {
  console.error(r(`\nThe run stopped: ${err.message}`));
  /* Never leave a test page behind, however the run ended. */
  if (pageId) {
    await call(`/admin/pages/${pageId}`, { method: 'DELETE' }).catch(() => {});
    console.error(dim('The test page was deleted.'));
  }
  process.exit(1);
});
