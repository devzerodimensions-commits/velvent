/**
 * Turning whatever someone picked into a WebP the store can serve.
 *
 * This happens in the browser, before the upload leaves it. A phone photo or a
 * screenshot is usually several megabytes of PNG or JPEG; the same picture as
 * WebP is a fraction of that, so the upload is faster, the storage is smaller
 * and every shopper downloads less. It also means the server almost never
 * sees a large file, which is what the size limit was really protecting
 * against.
 *
 * Everything here degrades rather than fails: a browser that cannot encode
 * WebP, an image the canvas refuses to read, a file that is not really an
 * image — each falls back to uploading exactly what was picked, and the server
 * decides whether to accept it.
 */

/** Anything longer than this on its longest edge is scaled down first. */
export const MAX_EDGE = 2400;

/** 0.82 keeps photographs clean while cutting most of the weight. */
export const WEBP_QUALITY = 0.82;

/** Already-small WebP files are left exactly as they are. */
const SKIP_BELOW_BYTES = 40 * 1024;

const canEncodeWebp = () => {
  try {
    const cv = document.createElement('canvas');
    cv.width = 1;
    cv.height = 1;
    return cv.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
};

/** Swaps any extension for .webp, leaving the rest of the name alone. */
const webpName = (name) => `${String(name || 'image').replace(/\.[^.]+$/, '')}.webp`;

async function decode(file) {
  // createImageBitmap is faster and avoids an object URL, but Safari has
  // historically been patchy with it, so fall back to an <img>.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch { /* fall through */ }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('not an image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Returns a WebP File, or the original when converting it would not help or
 * is not possible. Never throws: the caller gets something uploadable either
 * way.
 */
export async function toWebp(file, { maxEdge = MAX_EDGE, quality = WEBP_QUALITY } = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;

  // An SVG is markup, not pixels — rasterising one would be a downgrade.
  if (file.type === 'image/svg+xml') return file;

  // A small WebP is already the thing we are trying to produce.
  if (file.type === 'image/webp' && file.size <= SKIP_BELOW_BYTES) return file;

  if (!canEncodeWebp()) return file;

  let source;
  try {
    source = await decode(file);
  } catch {
    return file;
  }

  const w = source.width;
  const h = source.height;
  if (!w || !h) return file;

  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // A PNG with transparency would otherwise come out with black behind it in
    // some encoders; WebP keeps the alpha, so just draw it as it is.
    ctx.drawImage(source, 0, 0, width, height);
    source.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') return file;

    // Converting a already-tight file can make it bigger. Keep whichever wins,
    // unless we also shrank the dimensions — then the smaller image is the
    // point, even at a few more bytes.
    if (blob.size >= file.size && scale === 1) return file;

    return new File([blob], webpName(file.name), { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
}
