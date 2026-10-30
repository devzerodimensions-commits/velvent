import dotenv from 'dotenv';
import { pool, query } from '../db.js';
import { getMediaStore } from '../lib/media/index.js';

dotenv.config();

/**
 * Moving uploaded images between stores.
 *
 *   npm run media:move -- --to disk        database  ->  server disk
 *   npm run media:move -- --to database    server disk  ->  database
 *   npm run media:move -- --to disk --dry  say what would happen
 *
 * Run it once after changing MEDIA_STORE. Until it has run, images uploaded
 * under the old setting will 404, because the new store has never heard of
 * them.
 *
 * Deliberately additive: it writes into the destination and only then clears
 * the source for that row, one row at a time. Interrupt it halfway and the
 * rows already moved are moved and the rest are untouched — running it again
 * picks up where it stopped. Nothing is deleted until its copy exists.
 */

const argFor = (name) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
};

const target = argFor('--to');
const dryRun = process.argv.includes('--dry');

if (!['disk', 'database'].includes(target)) {
  console.error('\n[velvent] Usage: npm run media:move -- --to disk|database [--dry]\n');
  process.exit(1);
}

const run = async () => {
  const store = getMediaStore(target);

  /* Rows that have not yet arrived in the destination. Moving to disk means
     anything with no storage_key; moving to the database means anything whose
     bytes are empty. */
  const { rows } = target === 'disk'
    ? await query('SELECT id, filename, mime, bytes FROM media WHERE storage_key IS NULL AND bytes IS NOT NULL ORDER BY id')
    : await query('SELECT id, filename, mime, storage_key FROM media WHERE bytes IS NULL AND storage_key IS NOT NULL ORDER BY id');

  if (!rows.length) {
    console.log(`[velvent] Nothing to move — every image is already in the ${target} store.`);
    await pool.end();
    return;
  }

  console.log(`[velvent] ${dryRun ? 'Would move' : 'Moving'} ${rows.length} image(s) to the ${target} store.`);

  let moved = 0;
  for (const row of rows) {
    if (dryRun) {
      console.log(`  ${row.id}  ${row.filename || '(no name)'}`);
      continue;
    }

    try {
      if (target === 'disk') {
        const stored = await store.put({
          originalname: row.filename || `image-${row.id}`,
          mimetype: row.mime,
          buffer: row.bytes,
          size: row.bytes.length,
        });
        // Written first, cleared second: never both empty at once.
        await query(
          'UPDATE media SET storage_key = $2, size_bytes = COALESCE(size_bytes, $3) WHERE id = $1',
          [row.id, stored.key, row.bytes.length],
        );
        await query('UPDATE media SET bytes = NULL WHERE id = $1', [row.id]);
      } else {
        const found = await getMediaStore('disk').get(row.id);
        if (!found) {
          console.warn(`  ! ${row.id} has no file on disk — left alone.`);
          continue;
        }
        await query(
          'UPDATE media SET bytes = $2, size_bytes = COALESCE(size_bytes, $3) WHERE id = $1',
          [row.id, found.bytes, found.bytes.length],
        );
        await getMediaStore('disk').remove(row.storage_key);
        await query('UPDATE media SET storage_key = NULL WHERE id = $1', [row.id]);
      }
      moved += 1;
    } catch (err) {
      console.error(`  ! ${row.id} failed: ${err.message}`);
    }
  }

  if (!dryRun) {
    console.log(`[velvent] Moved ${moved} of ${rows.length}.`);
    console.log(`[velvent] Set MEDIA_STORE=${target} and restart, if you have not already.`);
  }

  await pool.end();
};

run().catch((err) => {
  console.error('[velvent] media:move failed:', err.message);
  process.exit(1);
});
