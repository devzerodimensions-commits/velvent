/** Wrap an async route so rejected promises reach the error handler. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const money = (n) => Math.round(Number(n) * 100) / 100;

export function orderNumber() {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VLV-${stamp}-${rand}`;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
export const isPhone = (v) => /^[6-9]\d{9}$/.test(String(v || '').replace(/\D/g, '').slice(-10));
export const isPincode = (v) => /^\d{6}$/.test(String(v || ''));

/** Collect missing/invalid fields up front so the client can show them all at once. */
export function validate(rules) {
  const errors = {};
  for (const [field, [value, test, message]] of Object.entries(rules)) {
    if (!test(value)) errors[field] = message;
  }
  return Object.keys(errors).length ? errors : null;
}
