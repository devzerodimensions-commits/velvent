/**
 * Merging admin-edited copy over the copy that ships with the build.
 *
 * Every section declares its own defaults next to its field schema in
 * `src/content/`. The API returns only what an admin has actually saved, so a
 * fresh database — or a failed request — still renders a complete store, and a
 * field nobody has touched costs nothing to store or send.
 */

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Deep-merges an override onto a default.
 *
 * Objects merge key by key so a new field added in a later build shows up even
 * for a section an admin saved months ago. Arrays replace outright: a list the
 * admin edited is the list they meant, and merging index by index would
 * resurrect rows they deleted.
 */
export function mergeContent(base, override) {
  if (override === undefined || override === null) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;

  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key])
      ? mergeContent(base[key], value)
      : value;
  }
  return out;
}

/** Strips empty strings so a cleared field falls back instead of rendering blank. */
export function pruneBlank(value) {
  if (Array.isArray(value)) return value.map(pruneBlank);
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === '' || v === undefined) continue;
    out[k] = pruneBlank(v);
  }
  return out;
}

/** True when an override says nothing the defaults do not already say. */
export function isEmptyOverride(value) {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}
