import { useEffect, useRef, useState } from 'react';
import { Close, Plus, Search, Upload } from '../../components/Icons';
import { Field } from '../../components/adminUi';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

/**
 * Renders an editor from a section's field schema.
 *
 * Every section in `src/content/` declares its fields once; this turns that
 * declaration into inputs and hands back a value of the same shape. Adding a
 * field to a page is therefore a one-line change in one file — nothing here
 * knows what a footer or a policy is.
 */

/* ------------------------------------------------------- picking an image */

function MediaPicker({ onPick, onClose }) {
  const [rows, setRows] = useState(null);
  const [term, setTerm] = useState('');

  useEffect(() => {
    api.admin.media().then(setRows).catch(() => setRows([]));
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shown = (rows || []).filter(
    (r) => !term.trim() || (r.filename || '').toLowerCase().includes(term.trim().toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-adm-ink/50" />
      <div className="relative flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-pop">
        <header className="flex items-center gap-3 border-b border-adm-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-adm-ink">Choose an image</h2>
          <div className="relative ml-auto">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search" className="ad-input w-44 pl-9" />
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink">
            <Close size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {rows === null && <p className="py-10 text-center text-[13px] text-adm-mute">Loading…</p>}
          {rows && shown.length === 0 && (
            <p className="py-10 text-center text-[13px] text-adm-mute">
              Nothing in the library yet. Upload one with the button beside the field.
            </p>
          )}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {shown.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => { onPick(m.url); onClose(); }}
                  className="block w-full overflow-hidden rounded-lg border border-adm-line transition hover:border-navy hover:shadow-pop"
                >
                  <img src={m.url} alt="" loading="lazy" className="aspect-square w-full bg-adm-soft object-cover" />
                  <span className="block truncate border-t border-adm-line px-2 py-1.5 text-[11px] text-adm-mute">
                    {m.filename || `Image ${m.id}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ImagePicker({ value, onChange, id }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState(false);
  const { error } = useToast();

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await api.admin.upload(file);
      onChange(url);
    } catch (err) {
      error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-3">
        {value ? (
          <img src={value} alt="" className="h-[72px] w-[72px] shrink-0 rounded-lg border border-adm-line bg-adm-soft object-cover" />
        ) : (
          <span className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg border border-dashed border-adm-line bg-adm-soft text-[10px] text-adm-mute">
            None
          </span>
        )}

        <div className="min-w-0 flex-1">
          <input
            id={id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/products/photo.jpg"
            className="ad-input"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="ad-btn-ghost ad-btn-sm">
              <Upload size={13} /> {busy ? 'Uploading…' : 'Upload'}
            </button>
            <button type="button" onClick={() => setLibrary(true)} className="ad-btn-ghost ad-btn-sm">
              Library
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className="text-[11.5px] text-sale transition hover:underline">
                Clear
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
        </div>
      </div>

      {library && <MediaPicker onPick={onChange} onClose={() => setLibrary(false)} />}
    </>
  );
}

/* ------------------------------------------------------------- reordering */

function Reorder({ index, total, onMove }) {
  if (total < 2) return null;
  return (
    <span className="flex shrink-0">
      <button
        type="button"
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label="Move up"
        className="rounded-md px-1.5 py-1 text-[10px] text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink disabled:opacity-25"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1}
        aria-label="Move down"
        className="rounded-md px-1.5 py-1 text-[10px] text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink disabled:opacity-25"
      >
        ▼
      </button>
    </span>
  );
}

/** Shared list plumbing: every repeatable control edits the same way. */
function useList(value, onChange) {
  const list = Array.isArray(value) ? value : [];
  return {
    list,
    set: (i, v) => onChange(list.map((x, j) => (j === i ? v : x))),
    remove: (i) => onChange(list.filter((_, j) => j !== i)),
    add: (blank) => onChange([...list, blank]),
    move: (i, by) => {
      const to = i + by;
      if (to < 0 || to >= list.length) return;
      const next = [...list];
      [next[i], next[to]] = [next[to], next[i]];
      onChange(next);
    },
  };
}

function AddButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-adm-line py-2.5 text-[12.5px] font-medium text-adm-mute transition hover:border-navy hover:bg-adm-soft hover:text-navy"
    >
      <Plus size={14} /> Add {label.toLowerCase()}
    </button>
  );
}

function RemoveButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remove ${label}`}
      className="shrink-0 rounded-md p-1.5 text-adm-mute transition hover:bg-rose-50 hover:text-sale"
    >
      <Close size={15} />
    </button>
  );
}

/* --------------------------------------------- repeatable simple controls */

function StringList({ value, onChange, itemLabel = 'Item' }) {
  const { list, set, remove, add, move } = useList(value, onChange);
  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <input value={item} onChange={(e) => set(i, e.target.value)} className="ad-input" />
          <Reorder index={i} total={list.length} onMove={move} />
          <RemoveButton label={itemLabel} onClick={() => remove(i)} />
        </div>
      ))}
      <AddButton label={itemLabel} onClick={() => add('')} />
    </div>
  );
}

function ParagraphList({ value, onChange, itemLabel = 'Paragraph' }) {
  const { list, set, remove, add, move } = useList(value, onChange);
  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          <textarea value={item} rows={3} onChange={(e) => set(i, e.target.value)} className="ad-textarea" />
          <span className="flex flex-col items-center gap-0.5 pt-1">
            <Reorder index={i} total={list.length} onMove={move} />
            <RemoveButton label={itemLabel} onClick={() => remove(i)} />
          </span>
        </div>
      ))}
      <AddButton label={itemLabel} onClick={() => add('')} />
    </div>
  );
}

function ImageList({ value, onChange }) {
  const { list, set, remove, add, move } = useList(value, onChange);
  return (
    <div className="space-y-3">
      {list.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          <div className="min-w-0 flex-1"><ImagePicker value={item} onChange={(v) => set(i, v)} /></div>
          <span className="flex flex-col items-center gap-0.5">
            <Reorder index={i} total={list.length} onMove={move} />
            <RemoveButton label="image" onClick={() => remove(i)} />
          </span>
        </div>
      ))}
      <AddButton label="image" onClick={() => add('')} />
    </div>
  );
}

/* ------------------------------------------------- repeatable field groups */

function GroupList({ field, value, onChange, path }) {
  const { list, set, remove, add, move } = useList(value, onChange);
  const itemLabel = field.itemLabel || 'Item';
  const [open, setOpen] = useState(() => new Set([0]));

  const toggle = (i) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  /* A new row starts from the schema's own keys, so its shape matches the rows
     already there rather than being filled in piecemeal as fields are typed. */
  const blank = Object.fromEntries((field.fields || []).map((f) => [
    f.name,
    ['list', 'strings', 'paragraphs', 'images'].includes(f.type) ? [] : '',
  ]));

  return (
    <div className="space-y-2">
      {list.map((item, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className="overflow-hidden rounded-lg border border-adm-line">
            <div className="flex items-center gap-1 bg-adm-soft px-2.5 py-2">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white text-[10px] font-bold text-adm-mute">
                  {i + 1}
                </span>
                <span className="truncate text-[12.5px] font-semibold text-adm-ink">
                  {(field.titleKey && item?.[field.titleKey]) || `${itemLabel} ${i + 1}`}
                </span>
                <span className="ml-auto shrink-0 text-[10px] text-adm-mute">{isOpen ? '▲' : '▼'}</span>
              </button>
              <Reorder index={i} total={list.length} onMove={move} />
              <RemoveButton label={itemLabel} onClick={() => remove(i)} />
            </div>

            {isOpen && (
              <div className="border-t border-adm-line p-4">
                <FieldSet
                  fields={field.fields || []}
                  value={item || {}}
                  onChange={(v) => set(i, v)}
                  path={`${path}-${i}`}
                />
              </div>
            )}
          </div>
        );
      })}
      <AddButton
        label={itemLabel}
        onClick={() => { add(blank); setOpen((p) => new Set([...p, list.length])); }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- one control */

function Control({ field, value, onChange, id, path }) {
  switch (field.type) {
    case 'textarea':
    case 'rich':
      return (
        <textarea
          id={id}
          rows={field.type === 'rich' ? 4 : 3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="ad-textarea"
        />
      );
    case 'number':
      return (
        <input
          id={id}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="ad-input w-40"
        />
      );
    case 'image':
      return <ImagePicker id={id} value={value} onChange={onChange} />;
    case 'images':
      return <ImageList value={value} onChange={onChange} />;
    case 'strings':
      return <StringList value={value} onChange={onChange} itemLabel={field.itemLabel} />;
    case 'paragraphs':
      return <ParagraphList value={value} onChange={onChange} itemLabel={field.itemLabel} />;
    case 'list':
      return <GroupList field={field} value={value} onChange={onChange} path={path} />;
    case 'select':
      return (
        <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="ad-select">
          {(field.options || []).map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case 'url':
    case 'text':
    default:
      return <input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="ad-input" />;
  }
}

/** A run of fields over one object. Groups nest by recursing. */
export default function FieldSet({ fields, value, onChange, path = 'f' }) {
  const setKey = (name, v) => onChange({ ...value, [name]: v });

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        const id = `${path}-${field.name}`;

        if (field.type === 'group') {
          return (
            <section key={field.name} className="rounded-xl border border-adm-line bg-adm-soft/60 p-4">
              <h3 className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-adm-mute">{field.label}</h3>
              {field.help && <p className="mt-1 text-[11.5px] leading-relaxed text-adm-mute">{field.help}</p>}
              <div className="mt-4">
                <FieldSet
                  fields={field.fields || []}
                  value={value?.[field.name] || {}}
                  onChange={(v) => setKey(field.name, v)}
                  path={id}
                />
              </div>
            </section>
          );
        }

        /* Lists and image rows read better with the label above them than in a
           narrow column beside a tall control. */
        const stacked = ['list', 'strings', 'paragraphs', 'images'].includes(field.type);
        if (stacked) {
          return (
            <div key={field.name}>
              <p className="ad-label">{field.label}</p>
              {field.help && <p className="mb-2 mt-1 text-[11.5px] leading-relaxed text-adm-mute">{field.help}</p>}
              <div className={field.help ? '' : 'mt-2'}>
                <Control field={field} value={value?.[field.name]} onChange={(v) => setKey(field.name, v)} id={id} path={id} />
              </div>
            </div>
          );
        }

        return (
          <Field key={field.name} label={field.label} hint={field.help} htmlFor={id}>
            <Control field={field} value={value?.[field.name]} onChange={(v) => setKey(field.name, v)} id={id} path={id} />
          </Field>
        );
      })}
    </div>
  );
}
