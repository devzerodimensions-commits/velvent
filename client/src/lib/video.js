/**
 * Product video links.
 *
 * The client can paste whatever a browser gave them — a youtu.be share link,
 * a full watch URL, a Vimeo page, or a direct MP4 — and the storefront has to
 * work out how to play it. That decision is made here, once, so the admin
 * preview and the product page can never disagree about what a link is.
 *
 * Nothing here trusts the string. A pasted value ends up in an <iframe src>
 * or a <video src>, so anything that is not plainly an http(s) URL to a host
 * we recognise is refused rather than rendered.
 */

const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

/** Parses a URL, or returns null — never throws on rubbish. */
function parse(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;
  /* A relative /api/media/12 is ours and always fine. */
  if (raw.startsWith('/')) return { relative: true, href: raw };
  try {
    const u = new URL(raw);
    /* javascript: and data: must never reach a src attribute. */
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return { relative: false, url: u, href: u.href };
  } catch {
    return null;
  }
}

/** The YouTube or Vimeo id in a link, or null if it is neither. */
export function embedIdFor(url) {
  const p = parse(url);
  if (!p || p.relative) return null;
  const host = p.url.hostname.toLowerCase();

  if (YT_HOSTS.includes(host)) {
    /* youtu.be/ID, /watch?v=ID, /embed/ID and /shorts/ID all appear in the
       wild depending on which button someone pressed to copy the link. */
    const id = host.endsWith('youtu.be')
      ? p.url.pathname.slice(1)
      : p.url.searchParams.get('v') || p.url.pathname.split('/').filter(Boolean).pop();
    return /^[\w-]{6,20}$/.test(id || '') ? { kind: 'youtube', id } : null;
  }

  if (VIMEO_HOSTS.includes(host)) {
    const id = p.url.pathname.split('/').filter(Boolean).pop();
    return /^\d{6,12}$/.test(id || '') ? { kind: 'vimeo', id } : null;
  }

  return null;
}

/** True when this link plays in an iframe rather than a <video> tag. */
export const isEmbed = (url) => Boolean(embedIdFor(url));

/** The URL to put in an iframe, built from the id rather than the input. */
export function embedSrc(url) {
  const found = embedIdFor(url);
  if (!found) return null;
  return found.kind === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${found.id}?rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${found.id}`;
}

/** A link safe to use as a <video src>, or null. */
export function fileSrc(url) {
  const p = parse(url);
  if (!p || embedIdFor(url)) return null;
  return p.href;
}
