import { query } from '../../db.js';

/**
 * Images kept in Postgres.
 *
 * The right choice on a host with no persistent disk, which is most managed
 * platforms — Render wipes the filesystem on every deploy, so a file written
 * during one release is gone by the next. The cost is that image bytes travel
 * in every database backup.
 */
export const database = {
  id: 'database',
  label: 'In the database',

  async put(file) {
    const { rows } = await query(
      'INSERT INTO media (filename, mime, bytes) VALUES ($1,$2,$3) RETURNING id',
      [file.originalname, file.mimetype, file.buffer],
    );
    return { key: String(rows[0].id), bytes: file.buffer.length };
  },

  async get(key) {
    const { rows } = await query('SELECT mime, bytes FROM media WHERE id = $1', [key]);
    return rows[0] ? { mime: rows[0].mime, bytes: rows[0].bytes } : null;
  },

  /* The row carries the bytes, so deleting the row is the whole job. The
     media table row itself is removed by the caller. */
  async remove() {},
};
