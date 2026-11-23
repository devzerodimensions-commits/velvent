import { resolve } from './model';

/**
 * Settings in, CSS out.
 *
 * Every styled element gets a generated class — `vb-<id>` — and this module
 * writes the rules for it. Nothing is set as an inline style, for one reason
 * that decides the whole design: inline styles cannot carry a media query, so
 * a page built with them could never be genuinely responsive. Real CSS can.
 *
 * The same values are compiled two ways. On the storefront they become media
 * queries, which is how the page actually behaves for a shopper. In the
 * editor they become selectors under a device attribute on the canvas, so
 * switching to "Mobile" shows the mobile rules at full window width without
 * needing an iframe to fake a narrow viewport.
 */

export const TABLET_MAX = 1024;
export const MOBILE_MAX = 767;

export const classFor = (id) => `vb-${id}`;

/* ------------------------------------------------------------- primitives */

const isBlank = (v) => v === undefined || v === null || v === '';

/** A bare number means pixels; anything with a unit is passed through. */
const len = (v, fallbackUnit = 'px') => {
  if (isBlank(v)) return undefined;
  if (typeof v === 'number') return `${v}${fallbackUnit}`;
  const s = String(v).trim();
  return /^-?[\d.]+$/.test(s) ? `${s}${fallbackUnit}` : s;
};

/** A four-sided value: { top, right, bottom, left, unit }. */
const box = (v) => {
  if (!v || typeof v !== 'object') return undefined;
  const u = v.unit || 'px';
  const side = (n) => (isBlank(v[n]) ? '0' : `${v[n]}${u}`);
  if ([v.top, v.right, v.bottom, v.left].every(isBlank)) return undefined;
  return `${side('top')} ${side('right')} ${side('bottom')} ${side('left')}`;
};

/** Drops empty declarations so an untouched setting writes nothing. */
const clean = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (!isBlank(v)) out[k] = v;
  return out;
};

/* ------------------------------------------------------- shared decl sets */

function typography(s, d) {
  const family = resolve(s.fontFamily, d);
  return clean({
    'font-family': family === 'heading' ? 'var(--font-heading)'
      : family === 'body' ? 'var(--font-body)'
        : undefined,
    'font-size': len(resolve(s.fontSize, d)),
    'font-weight': resolve(s.fontWeight, d),
    'line-height': resolve(s.lineHeight, d),
    'letter-spacing': len(resolve(s.letterSpacing, d), 'em'),
    'text-transform': resolve(s.textTransform, d),
    'text-align': resolve(s.align, d),
    color: resolve(s.color, d),
  });
}

function background(s, d) {
  const type = resolve(s.bgType, d) || (s.bgColor ? 'color' : 'none');
  if (type === 'none') return {};
  if (type === 'image') {
    const url = resolve(s.bgImage, d);
    return clean({
      'background-color': resolve(s.bgColor, d),
      'background-image': url ? `url("${String(url).replace(/"/g, '%22')}")` : undefined,
      'background-size': resolve(s.bgSize, d) || 'cover',
      'background-position': resolve(s.bgPosition, d) || 'center',
      'background-repeat': resolve(s.bgRepeat, d) || 'no-repeat',
      'background-attachment': resolve(s.bgAttachment, d),
    });
  }
  return clean({ 'background-color': resolve(s.bgColor, d) });
}

function border(s, d) {
  const width = resolve(s.borderWidth, d);
  return clean({
    'border-style': isBlank(width) ? undefined : (resolve(s.borderStyle, d) || 'solid'),
    'border-width': box(width),
    'border-color': resolve(s.borderColor, d),
    'border-radius': box(resolve(s.radius, d)),
    'box-shadow': resolve(s.shadow, d),
  });
}

const spacing = (s, d) => clean({
  padding: box(resolve(s.padding, d)),
  margin: box(resolve(s.margin, d)),
});

/* --------------------------------------------------------- per node kind */

function sectionDecls(node, d) {
  const s = node.settings || {};
  return clean({
    ...background(s, d),
    ...border(s, d),
    ...spacing(s, d),
    'min-height': len(resolve(s.minHeight, d)),
    color: resolve(s.color, d),
  });
}

function sectionInnerDecls(node, d) {
  const s = node.settings || {};
  const boxed = (resolve(s.contentWidth, d) || 'boxed') === 'boxed';
  return clean({
    'max-width': boxed ? len(resolve(s.maxWidth, d) ?? 1200) : undefined,
    'align-items': resolve(s.align, d) || 'stretch',
    gap: len(resolve(s.gap, d) ?? 24),
  });
}

/**
 * A column's share of its row.
 *
 * The obvious `flex-basis: 60%` is wrong the moment the row has a gap, and
 * every row here has one by default. Two columns at 60% and 40% want all
 * 100% of the row, the 24px gap needs room too, the total overflows, and the
 * second column wraps onto its own line — a two-column layout that silently
 * becomes one column.
 *
 * So the gap is taken out of the widths first. With `n` columns there are
 * `n - 1` gaps between them, and a column asking for X% gets X% of what is
 * left once those are removed:
 *
 *     X% - gap × (n - 1) × X/100
 *
 * which is exact for any combination of widths, not just equal ones. Columns
 * with no width set are left alone: `flex: 1 1 0%` from the base stylesheet
 * already shares out the space that remains after the gaps.
 */
function columnDecls(node, d, parent) {
  const s = node.settings || {};
  const width = resolve(s.width, d);

  let basis;
  if (!isBlank(width)) {
    const gaps = Math.max(0, (parent?.columnCount ?? 1) - 1);
    /* The gap is itself responsive, so it has to be read for the same device
       the width is being written for — a narrower gap on mobile would
       otherwise be subtracted using the desktop figure. */
    const gap = Number(resolve(parent?.section?.settings?.gap, d) ?? 24);
    basis = gaps > 0 && gap > 0
      ? `calc(${width}% - ${Math.round(((gap * gaps * Number(width)) / 100) * 100) / 100}px)`
      : `${width}%`;
  }

  return clean({
    'flex-basis': basis,
    'max-width': basis,
    'justify-content': resolve(s.align, d),
    ...background(s, d),
    ...border(s, d),
    ...spacing(s, d),
    color: resolve(s.color, d),
  });
}

function widgetDecls(node, d) {
  const s = node.settings || {};
  const hidden = resolve(s.hide, d);
  if (hidden === true || hidden === 'yes') return { display: 'none' };
  return clean({
    ...spacing(s, d),
    ...background(s, d),
    ...border(s, d),
    'text-align': resolve(s.align, d),
    display: hidden === false ? 'block' : undefined,
  });
}

/* ------------------------------------------------------------- assembling */

const declsToText = (decls) =>
  Object.entries(decls).map(([k, v]) => `${k}:${v}`).join(';');

/**
 * Every rule one node contributes, as { selectorSuffix, d, t, m }.
 *
 * The suffix is appended to the node's own class, so a section can style both
 * itself and its inner row without the two needing separate ids.
 */
function rulesFor(node, parent) {
  if (node.kind === 'section') {
    return [
      { suffix: '', fn: (d) => sectionDecls(node, d) },
      { suffix: ' > .vb-row', fn: (d) => sectionInnerDecls(node, d) },
    ];
  }
  if (node.kind === 'column') return [{ suffix: '', fn: (d) => columnDecls(node, d, parent) }];
  return [
    { suffix: '', fn: (d) => widgetDecls(node, d) },
    { suffix: ' .vb-type', fn: (d) => typography(node.settings || {}, d) },
  ];
}

/**
 * Compiles a whole document.
 *
 * `mode` picks how the narrower devices are expressed: 'live' writes media
 * queries, 'editor' writes selectors under the canvas's device attribute.
 */
export function compile(doc, { mode = 'live', scope = '' } = {}) {
  const base = [];
  const tablet = [];
  const mobile = [];

  const visit = (node, parent) => {
    const cls = `${scope}.${classFor(node.id)}`;
    for (const rule of rulesFor(node, parent)) {
      const sel = `${cls}${rule.suffix}`;
      const dd = declsToText(rule.fn('d'));
      const td = declsToText(rule.fn('t'));
      const md = declsToText(rule.fn('m'));
      if (dd) base.push(`${sel}{${dd}}`);
      /* The narrower devices repeat the resolved value rather than only the
         override, because a value inherited from desktop and one set here
         must produce the same rule — otherwise a tablet override of one
         property would silently drop the rest. */
      if (td && td !== dd) tablet.push(`${sel}{${td}}`);
      if (md && md !== td) mobile.push(`${sel}{${md}}`);
    }
  };

  for (const section of doc.sections || []) {
    visit(section);
    /* A column's width depends on its row — how many columns share it and how
       wide the gap between them is — so the section travels down with it. */
    const parent = { section, columnCount: (section.columns || []).length };
    for (const column of section.columns || []) {
      visit(column, parent);
      for (const widget of column.widgets || []) visit(widget);
    }
  }

  if (mode === 'editor') {
    /* Specificity does the switching: the device-scoped selector outranks the
       base one, so picking a device in the toolbar re-styles the canvas with
       no reflow of the window. */
    return [
      base.join('\n'),
      tablet.map((r) => `[data-device="t"] ${r}`).join('\n'),
      tablet.map((r) => `[data-device="m"] ${r}`).join('\n'),
      mobile.map((r) => `[data-device="m"] ${r}`).join('\n'),
    ].filter(Boolean).join('\n');
  }

  return [
    base.join('\n'),
    tablet.length ? `@media (max-width:${TABLET_MAX}px){\n${tablet.join('\n')}\n}` : '',
    mobile.length ? `@media (max-width:${MOBILE_MAX}px){\n${mobile.join('\n')}\n}` : '',
  ].filter(Boolean).join('\n');
}
