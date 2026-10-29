/** Bits both media screens need. */

/** Matches the server's own limit. Reached only when conversion could not run. */
export const UPLOAD_MAX_BYTES = 12 * 1024 * 1024;
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const UPLOAD_HINT = 'JPG, PNG, WEBP or AVIF. Images are converted to WebP automatically.';

export const fileSize = (bytes) => (bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.round(bytes / 1024)} KB`);

/** "October 2026" — the grouping the date filter offers. */
export const monthOf = (iso) => new Date(iso).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

/** "JPEG" from "image/jpeg", for the type filter and the detail panel. */
export const typeOf = (mime) => String(mime || '').split('/')[1]?.toUpperCase() || 'Image';
