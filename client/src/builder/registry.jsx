import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Rich } from '../components/RichText';
import { api } from '../lib/api';
import { embedSrc, fileSrc } from '../lib/video';
import { resolve } from './model';

/**
 * The widgets a page can be built from.
 *
 * Each one declares three things: what it renders, what the Content tab asks
 * for, and what the Style tab offers beyond the styling every widget shares.
 * Adding a widget means adding an entry here and nothing else — the panel,
 * the drag source and the renderer all read this list.
 *
 * There is no "custom HTML" widget, deliberately. Elementor has one, and it
 * is how a compromised admin account turns into a script running in every
 * shopper's browser. Everything here renders through React, which escapes
 * what it is given.
 */

/* ---------------------------------------------------------------- fields */

const LINK = { name: 'href', label: 'Link', type: 'link', help: 'A page on this site like /shop, or a full https:// address. Leave empty for no link.' };

const TYPOGRAPHY = [
  { name: 'fontFamily', label: 'Font', type: 'select', responsive: false, options: [['', 'Inherit'], ['heading', 'Heading font'], ['body', 'Body font']] },
  { name: 'fontSize', label: 'Size (px)', type: 'number', responsive: true },
  { name: 'fontWeight', label: 'Weight', type: 'select', responsive: false, options: [['', 'Inherit'], ['300', 'Light'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']] },
  { name: 'lineHeight', label: 'Line height', type: 'number', step: 0.05, responsive: true },
  { name: 'letterSpacing', label: 'Letter spacing (em)', type: 'number', step: 0.01, responsive: true },
  { name: 'textTransform', label: 'Case', type: 'select', responsive: false, options: [['', 'As typed'], ['uppercase', 'UPPERCASE'], ['lowercase', 'lowercase'], ['capitalize', 'Capitalise']] },
  { name: 'color', label: 'Text colour', type: 'color', responsive: false },
];

/* ---------------------------------------------------------- the widgets */

const widgets = {
  heading: {
    label: 'Heading',
    glyph: 'H',
    defaults: { text: 'Your heading here', tag: 'h2', align: { d: 'left' }, fontFamily: 'heading' },
    content: [
      { name: 'text', label: 'Text', type: 'textarea' },
      { name: 'tag', label: 'HTML tag', type: 'select', options: [['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['h6', 'H6'], ['p', 'Paragraph'], ['div', 'Div']], help: 'Use one H1 per page. The rest should step down in order — it is what search engines read the page structure from.' },
      LINK,
    ],
    style: TYPOGRAPHY,
    Render({ settings }) {
      const Tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'].includes(settings.tag) ? settings.tag : 'h2';
      const body = <Tag className="vb-type m-0">{settings.text || ''}</Tag>;
      return settings.href ? <SafeLink href={settings.href}>{body}</SafeLink> : body;
    },
  },

  text: {
    label: 'Text',
    glyph: '¶',
    defaults: { body: 'Write something here. You can add [a link](/shop) with square brackets.', align: { d: 'left' } },
    content: [
      { name: 'body', label: 'Text', type: 'richtext', help: 'Blank lines start a new paragraph. [Link text](/shop) makes a link.' },
    ],
    style: TYPOGRAPHY,
    /* Rich handles links and brand tokens inside one string but knows nothing
       about paragraphs, so the split happens here — a blank line starts a new
       one, which is what anyone typing into a box expects. */
    Render: ({ settings }) => (
      <div className="vb-type vb-prose">
        {String(settings.body || '').split(/\n\s*\n/).filter((p) => p.trim()).map((para, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={i}><Rich>{para.trim()}</Rich></p>
        ))}
      </div>
    ),
  },

  image: {
    label: 'Image',
    glyph: '▣',
    defaults: { src: '', alt: '', align: { d: 'center' }, imgWidth: { d: 100 } },
    content: [
      { name: 'src', label: 'Image', type: 'image' },
      { name: 'alt', label: 'Alt text', type: 'text', help: 'What the picture shows, for screen readers and search engines.' },
      { name: 'caption', label: 'Caption', type: 'text' },
      LINK,
    ],
    style: [
      { name: 'imgWidth', label: 'Width (%)', type: 'number', responsive: true },
      { name: 'ratio', label: 'Crop to', type: 'select', options: [['', 'Original shape'], ['3/4', 'Portrait 3:4'], ['1/1', 'Square'], ['4/3', 'Landscape 4:3'], ['16/9', 'Wide 16:9']] },
      { name: 'imgRadius', label: 'Corner radius (px)', type: 'number' },
    ],
    Render({ settings, device }) {
      if (!settings.src) return <Placeholder label="Pick an image" />;
      const img = (
        <img
          src={settings.src}
          alt={settings.alt || ''}
          loading="lazy"
          style={{
            width: `${resolve(settings.imgWidth, device) ?? 100}%`,
            aspectRatio: settings.ratio || undefined,
            objectFit: settings.ratio ? 'cover' : undefined,
            borderRadius: settings.imgRadius ? `${settings.imgRadius}px` : undefined,
          }}
        />
      );
      return (
        <figure className="m-0">
          {settings.href ? <SafeLink href={settings.href}>{img}</SafeLink> : img}
          {settings.caption && <figcaption className="vb-type mt-2 text-[12px] opacity-70">{settings.caption}</figcaption>}
        </figure>
      );
    },
  },

  button: {
    label: 'Button',
    glyph: '▭',
    defaults: { label: 'Shop now', href: '/shop', variant: 'solid', size: 'md', align: { d: 'left' } },
    content: [
      { name: 'label', label: 'Text', type: 'text' },
      LINK,
      { name: 'variant', label: 'Style', type: 'select', options: [['solid', 'Filled'], ['outline', 'Outlined'], ['text', 'Text only']] },
      { name: 'size', label: 'Size', type: 'select', options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] },
      { name: 'full', label: 'Full width', type: 'toggle', responsive: true },
    ],
    style: [
      { name: 'btnBg', label: 'Background', type: 'color' },
      { name: 'btnColor', label: 'Text colour', type: 'color' },
      { name: 'btnRadius', label: 'Corner radius (px)', type: 'number' },
      ...TYPOGRAPHY.filter((f) => f.name !== 'color'),
    ],
    Render({ settings, device }) {
      const pad = { sm: '8px 18px', md: '12px 28px', lg: '16px 40px' }[settings.size] || '12px 28px';
      const solid = settings.variant !== 'outline' && settings.variant !== 'text';
      const style = {
        padding: settings.variant === 'text' ? 0 : pad,
        background: settings.variant === 'text' ? 'transparent' : (settings.btnBg || (solid ? 'var(--vb-ink)' : 'transparent')),
        color: settings.btnColor || (solid ? 'var(--vb-paper)' : 'var(--vb-ink)'),
        border: settings.variant === 'outline' ? `1px solid ${settings.btnColor || 'currentColor'}` : 'none',
        borderRadius: settings.btnRadius ? `${settings.btnRadius}px` : 0,
        width: resolve(settings.full, device) ? '100%' : undefined,
        textDecoration: settings.variant === 'text' ? 'underline' : 'none',
        display: 'inline-block',
        cursor: 'pointer',
      };
      return (
        <SafeLink href={settings.href} className="vb-type" style={style}>
          {settings.label || 'Button'}
        </SafeLink>
      );
    },
  },

  spacer: {
    label: 'Spacer',
    glyph: '↕',
    defaults: { height: { d: 60 } },
    content: [{ name: 'height', label: 'Height (px)', type: 'number', responsive: true }],
    style: [],
    Render: ({ settings, device }) => (
      <div aria-hidden style={{ height: `${resolve(settings.height, device) ?? 60}px` }} />
    ),
  },

  divider: {
    label: 'Divider',
    glyph: '—',
    defaults: { lineWidth: { d: 100 }, thickness: 1, lineStyle: 'solid', align: { d: 'center' } },
    content: [
      { name: 'lineWidth', label: 'Width (%)', type: 'number', responsive: true },
      { name: 'thickness', label: 'Thickness (px)', type: 'number' },
      { name: 'lineStyle', label: 'Style', type: 'select', options: [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']] },
      { name: 'lineColor', label: 'Colour', type: 'color' },
    ],
    style: [],
    Render: ({ settings, device }) => (
      <hr
        className="m-0 border-0 border-t"
        style={{
          width: `${resolve(settings.lineWidth, device) ?? 100}%`,
          borderTopWidth: `${settings.thickness || 1}px`,
          borderTopStyle: settings.lineStyle || 'solid',
          borderTopColor: settings.lineColor || 'currentColor',
          display: 'inline-block',
        }}
      />
    ),
  },

  video: {
    label: 'Video',
    glyph: '▶',
    defaults: { url: '', ratio: '16/9' },
    content: [
      { name: 'url', label: 'Video link', type: 'text', help: 'A YouTube or Vimeo link, or an MP4 you uploaded in Media.' },
      { name: 'ratio', label: 'Shape', type: 'select', options: [['16/9', 'Wide 16:9'], ['4/3', 'Landscape 4:3'], ['1/1', 'Square'], ['9/16', 'Portrait 9:16']] },
    ],
    style: [],
    Render({ settings }) {
      if (!settings.url) return <Placeholder label="Paste a video link" />;
      const frame = embedSrc(settings.url);
      const box = { aspectRatio: settings.ratio || '16/9', width: '100%' };
      if (frame) {
        return <iframe src={frame} title="Video" allowFullScreen className="border-0" style={box} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />;
      }
      const src = fileSrc(settings.url);
      if (!src) return <Placeholder label="That link cannot be played" />;
      return <video src={src} controls playsInline preload="metadata" style={box} />;
    },
  },

  gallery: {
    label: 'Gallery',
    glyph: '▦',
    defaults: { items: [], cols: { d: 3 }, gap: { d: 12 }, ratio: '3/4' },
    content: [
      { name: 'items', label: 'Images', type: 'images' },
      { name: 'cols', label: 'Columns', type: 'number', responsive: true },
      { name: 'gap', label: 'Gap (px)', type: 'number', responsive: true },
      { name: 'ratio', label: 'Crop to', type: 'select', options: [['3/4', 'Portrait 3:4'], ['1/1', 'Square'], ['4/3', 'Landscape 4:3'], ['', 'Original shape']] },
    ],
    style: [],
    Render({ settings, device }) {
      const items = Array.isArray(settings.items) ? settings.items : [];
      if (!items.length) return <Placeholder label="Add some images" />;
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${resolve(settings.cols, device) ?? 3}, minmax(0,1fr))`,
            gap: `${resolve(settings.gap, device) ?? 12}px`,
          }}
        >
          {items.map((it, n) => (
            <img
              key={(it.url || '') + n}
              src={it.url}
              alt={it.alt || ''}
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ aspectRatio: settings.ratio || undefined }}
            />
          ))}
        </div>
      );
    },
  },

  products: {
    label: 'Products',
    glyph: '◫',
    defaults: { source: 'featured', count: 4, cols: { d: 4 }, gap: { d: 20 } },
    content: [
      { name: 'source', label: 'Show', type: 'select', options: [['featured', 'Featured products'], ['newest', 'Newest first'], ['category', 'One category']] },
      { name: 'category', label: 'Category', type: 'category', when: (s) => s.source === 'category' },
      { name: 'count', label: 'How many', type: 'number' },
      { name: 'cols', label: 'Columns', type: 'number', responsive: true },
      { name: 'gap', label: 'Gap (px)', type: 'number', responsive: true },
    ],
    style: [],
    Render({ settings, device, editing }) {
      const [rows, setRows] = useState(null);
      const { source, category, count } = settings;

      useEffect(() => {
        let alive = true;
        const params = { limit: Math.max(1, Math.min(24, Number(count) || 4)) };
        if (source === 'featured') params.featured = 'true';
        if (source === 'newest') params.sort = 'newest';
        if (source === 'category' && category) params.category = category;
        api.products(params)
          .then((r) => { if (alive) setRows(r.products || r.items || []); })
          .catch(() => { if (alive) setRows([]); });
        return () => { alive = false; };
      }, [source, category, count]);

      if (rows === null) return <Placeholder label="Loading products…" />;
      if (!rows.length) return <Placeholder label={editing ? 'No products match this yet' : ''} />;

      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${resolve(settings.cols, device) ?? 4}, minmax(0,1fr))`,
            gap: `${resolve(settings.gap, device) ?? 20}px`,
          }}
        >
          {rows.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      );
    },
  },
};

/* --------------------------------------------------------------- helpers */

/** A link that refuses anything but a site path or an http(s) address. */
function SafeLink({ href, children, ...rest }) {
  const raw = String(href || '').trim();
  if (!raw) return <span {...rest}>{children}</span>;
  if (raw.startsWith('/')) return <Link to={raw} {...rest}>{children}</Link>;
  if (/^https?:\/\//i.test(raw)) {
    return <a href={raw} target="_blank" rel="noreferrer noopener" {...rest}>{children}</a>;
  }
  /* mailto:, tel: and javascript: all land here. The first two are useful and
     harmless; the third must never reach the DOM. */
  if (/^(mailto|tel):/i.test(raw)) return <a href={raw} {...rest}>{children}</a>;
  return <span {...rest}>{children}</span>;
}

/** Shown in the editor where a widget has nothing to render yet. */
const Placeholder = ({ label }) => (
  <span className="block border border-dashed border-current/30 px-4 py-6 text-center text-[12px] opacity-50">
    {label}
  </span>
);

export const WIDGETS = widgets;
export const WIDGET_LIST = Object.entries(widgets).map(([type, def]) => ({ type, ...def }));
export const widgetDef = (type) => widgets[type] || null;
