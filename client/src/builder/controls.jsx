import { useEffect, useRef, useState } from 'react';
import { Close, Upload } from '../components/Icons';
import { api } from '../lib/api';
import { DEVICE_LABEL, DEVICES, resolve, setDevice } from './model';

/**
 * The inputs in the settings panel.
 *
 * A field descriptor says what it wants — `{ name, label, type, responsive }`
 * — and `Control` turns that into an input. Responsive fields write only the
 * device currently selected in the toolbar, which is what makes "set this
 * smaller on mobile" a single click rather than a separate screen.
 */

/* ------------------------------------------------------------ media picker */

function MediaPicker({ onPick, onClose }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.admin.media().then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    setBusy(true);
    try {
      let last = null;
      for (const f of files) last = await api.admin.upload(f);
      await load();
      if (last) onPick(last.url);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const images = (rows || []).filter((r) => String(r.mime || '').startsWith('image/'));

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-adm-ink/50" />
      <div className="relative flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-adm-line px-4 py-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-adm-ink">Choose an image</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-adm-mute hover:text-adm-ink">
            <Close size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {rows === null && <p className="py-10 text-center text-[13px] text-adm-mute">Loading…</p>}
          {rows && !images.length && <p className="py-10 text-center text-[13px] text-adm-mute">Nothing in the library yet.</p>}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onPick(m.url); onClose(); }}
                className="group aspect-square overflow-hidden rounded-lg border border-adm-line transition hover:border-navy"
              >
                <img src={m.url} alt={m.filename || ''} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-adm-line px-4 py-3">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="ad-btn-primary">
            <Upload size={14} /> {busy ? 'Uploading…' : 'Upload new'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" />
          <span className="text-[11.5px] text-adm-mute">Uploads are converted to WebP automatically.</span>
        </div>
      </div>
    </div>
  );
}

function ImageField({ value, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <>
      {value ? (
        <div className="mb-2 overflow-hidden rounded-lg border border-adm-line">
          <img src={value} alt="" className="block max-h-32 w-full object-cover" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setPicking(true)} className="vb-btn">Choose</button>
        {value && <button type="button" onClick={() => onChange('')} className="vb-btn vb-btn-danger">Remove</button>}
      </div>
      {picking && <MediaPicker onPick={onChange} onClose={() => setPicking(false)} />}
    </>
  );
}

function ImagesField({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const [picking, setPicking] = useState(false);
  const move = (i, step) => {
    const next = [...items];
    const to = i + step;
    if (to < 0 || to >= next.length) return;
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  return (
    <>
      <ul className="mb-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={(it.url || '') + i} className="flex items-center gap-2 rounded-lg border border-adm-line p-1.5">
            <img src={it.url} alt="" className="h-10 w-8 shrink-0 rounded object-cover" />
            <input
              value={it.alt || ''}
              onChange={(e) => onChange(items.map((x, n) => (n === i ? { ...x, alt: e.target.value } : x)))}
              placeholder="Alt text"
              className="vb-input min-w-0 flex-1"
            />
            <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="vb-btn px-1.5">↑</button>
            <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="vb-btn px-1.5">↓</button>
            <button type="button" onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label="Remove" className="vb-btn vb-btn-danger px-1.5">×</button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setPicking(true)} className="vb-btn">Add image</button>
      {picking && (
        <MediaPicker
          onPick={(url) => onChange([...items, { url, alt: '' }])}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- spacing */

const SIDES = [['top', 'Top'], ['right', 'Right'], ['bottom', 'Bottom'], ['left', 'Left']];

function SpacingField({ value, onChange }) {
  const v = value && typeof value === 'object' ? value : {};
  const [linked, setLinked] = useState(true);

  const set = (side, raw) => {
    const n = raw === '' ? '' : Number(raw);
    if (linked) {
      onChange({ unit: v.unit || 'px', top: n, right: n, bottom: n, left: n });
    } else {
      onChange({ unit: v.unit || 'px', ...v, [side]: n });
    }
  };

  return (
    <div className="flex items-end gap-1.5">
      {SIDES.map(([key, label]) => (
        <label key={key} className="min-w-0 flex-1">
          <span className="mb-1 block text-center text-[10px] uppercase tracking-wide text-adm-mute">{label}</span>
          <input
            type="number"
            value={v[key] ?? ''}
            onChange={(e) => set(key, e.target.value)}
            className="vb-input text-center"
          />
        </label>
      ))}
      <button
        type="button"
        onClick={() => setLinked((x) => !x)}
        title={linked ? 'Editing all four together' : 'Editing each side separately'}
        aria-pressed={linked}
        className={`vb-btn mb-px px-2 ${linked ? 'bg-navy text-white' : ''}`}
      >
        {linked ? '⛓' : '⛓̸'}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------- categories */

let categoryCache = null;

function CategoryField({ value, onChange }) {
  const [rows, setRows] = useState(categoryCache);
  useEffect(() => {
    if (categoryCache) return;
    api.categories().then((r) => { categoryCache = r; setRows(r); }).catch(() => setRows([]));
  }, []);
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="vb-input">
      <option value="">Pick a category…</option>
      {(rows || []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
    </select>
  );
}

/* --------------------------------------------------------------- the switch */

function Input({ field, value, onChange }) {
  const set = (v) => onChange(v);

  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return (
        <textarea
          rows={field.type === 'richtext' ? 6 : 3}
          value={value ?? ''}
          onChange={(e) => set(e.target.value)}
          className="vb-input resize-y"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          step={field.step ?? 1}
          value={value ?? ''}
          onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value))}
          className="vb-input"
        />
      );

    case 'select':
      return (
        <select value={value ?? ''} onChange={(e) => set(e.target.value)} className="vb-input">
          {(field.options || []).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      );

    case 'toggle':
      return (
        <label className="flex items-center gap-2 text-[12px] text-adm-ink">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
          {field.onLabel || 'Yes'}
        </label>
      );

    case 'color':
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'}
            onChange={(e) => set(e.target.value)}
            className="h-8 w-9 shrink-0 cursor-pointer rounded border border-adm-line bg-white p-0.5"
          />
          <input
            value={value ?? ''}
            onChange={(e) => set(e.target.value)}
            placeholder="Inherit"
            className="vb-input min-w-0 flex-1 font-mono"
          />
          {value ? <button type="button" onClick={() => set('')} aria-label="Clear colour" className="vb-btn px-1.5">×</button> : null}
        </div>
      );

    case 'image':   return <ImageField value={value} onChange={set} />;
    case 'images':  return <ImagesField value={value} onChange={set} />;
    case 'spacing': return <SpacingField value={value} onChange={set} />;
    case 'category': return <CategoryField value={value} onChange={set} />;

    case 'align':
      return (
        <div className="flex gap-1">
          {[['left', '◧'], ['center', '▣'], ['right', '◨']].map(([v, glyph]) => (
            <button
              key={v}
              type="button"
              onClick={() => set(v)}
              aria-pressed={value === v}
              title={v}
              className={`vb-btn flex-1 ${value === v ? 'bg-navy text-white' : ''}`}
            >
              {glyph}
            </button>
          ))}
        </div>
      );

    case 'link':
    case 'text':
    default:
      return (
        <input
          value={value ?? ''}
          onChange={(e) => set(e.target.value)}
          placeholder={field.placeholder || ''}
          className="vb-input"
        />
      );
  }
}

/**
 * One row of the panel: a label, the device switcher when the field is
 * responsive, the input, and any help text.
 */
export default function Control({ field, settings, device, onDevice, onChange }) {
  if (field.when && !field.when(settings)) return null;

  const raw = settings?.[field.name];
  const responsive = field.responsive === true;
  const value = responsive ? resolve(raw, device) : raw;

  const write = (next) => {
    onChange({ [field.name]: responsive ? setDevice(raw, device, next) : next });
  };

  /* A value inherited from a wider device is shown but marked, so the client
     can tell "this is 40 because desktop says so" from "this is 40 here". */
  const own = responsive && raw && typeof raw === 'object' && raw[device] !== undefined;
  const inherited = responsive && device !== 'd' && !own && value !== undefined;

  return (
    <div className="mb-3.5">
      <div className="mb-1 flex items-center gap-2">
        <label className="flex-1 text-[11.5px] font-semibold text-adm-ink">{field.label}</label>

        {responsive && (
          <span className="flex gap-0.5">
            {DEVICES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDevice(d)}
                title={DEVICE_LABEL[d]}
                aria-pressed={device === d}
                className={`h-5 w-5 rounded text-[10px] font-bold transition ${
                  device === d ? 'bg-navy text-white' : 'text-adm-mute hover:bg-adm-soft'
                }`}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </span>
        )}

        {own && device !== 'd' && (
          <button
            type="button"
            onClick={() => write('')}
            title={`Clear the ${DEVICE_LABEL[device].toLowerCase()} override`}
            className="text-[10px] text-sale hover:underline"
          >
            reset
          </button>
        )}
      </div>

      <Input field={field} value={value} onChange={write} />

      {inherited && (
        <p className="mt-1 text-[10.5px] italic text-adm-mute">
          Inherited from {device === 'm' ? 'tablet or desktop' : 'desktop'}.
        </p>
      )}
      {field.help && <p className="mt-1 text-[10.5px] leading-relaxed text-adm-mute">{field.help}</p>}
    </div>
  );
}
