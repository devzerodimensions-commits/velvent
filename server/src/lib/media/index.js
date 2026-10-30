import { database } from './database.js';
import { disk } from './disk.js';

/**
 * Where uploaded images live.
 *
 * On Render they go in Postgres, because its filesystem is wiped on every
 * deploy — anything written to disk is gone the next time the service
 * restarts. That is the right answer there and the wrong one on a server with
 * its own disk, where image bytes in the database bloat every backup and make
 * every dump slower for no benefit.
 *
 * So it is a choice, read from MEDIA_STORE. Both drivers implement the same
 * four calls, and the rest of the application only ever sees an id and a URL:
 *
 *   id           the key stored in MEDIA_STORE
 *   put(file)    stores bytes, returns { key, bytes }
 *   get(key)     returns { mime, bytes } or null
 *   remove(key)  deletes, and does not mind if it was already gone
 *
 * Nothing above this module knows which one is running, so moving hosts is a
 * change of environment variable plus a one-off copy of what already exists.
 */

const DRIVERS = { database, disk };

export function getMediaStore(id = process.env.MEDIA_STORE) {
  /* Defaulting to the database keeps an existing deployment working when it
     is upgraded to a build that has this choice — the wrong default here
     would make every uploaded image disappear at once. */
  return DRIVERS[id] || database;
}

export const mediaStoreName = () => getMediaStore().id;
