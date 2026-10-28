import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, EmptyState, Notice, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Close, Grid as GridIcon, Menu as ListIcon, Search, Upload } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';

const size = (bytes) => (bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.round(bytes / 1024)} KB`);

const MONTH = (iso) => new Date(iso).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

/**
 * The media library.
 *
 * Images live in Postgres rather than on disk, because Render wipes the
 * filesystem on every deploy — so this is the real library, not a view of a
 * folder. Files can be dropped anywhere on the page, selected in bulk, and
 * inspected one at a time in a panel that carries the path the rest of the
 * admin needs when you paste an image into a content field.
 */
export default function Media() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(0);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('velvent.admin.media') || 'grid'; } catch { return 'grid'; }
  });
  const [term, setTerm] = useState('');
  const [month, setMonth] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [detail, setDetail] = useState(null);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef(null);
  const { success } = useToast();

  const load = () => api.admin.media().then(setRows).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    try { localStorage.setItem('velvent.admin.media', view); } catch { /* private mode */ }
  }, [view]);

  /* ------------------------------------------------------------- uploading */

  const send = async (files) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setBusy(images.length);
    setError(null);
    const failed = [];
    for (const file of images) {
      try {
        await api.admin.upload(file);
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`);
      }
      setBusy((n) => n - 1);
    }
    await load();
    if (failed.length) setError(failed.join(' · '));
    const ok = images.length - failed.length;
    if (ok > 0) success(ok === 1 ? 'Image uploaded.' : `${ok} images uploaded.`);
  };

  const pick = (e) => {
    const files = e.target.files;
    e.target.value = '';
    send(files);
  };

  /* Dropping anywhere on the screen uploads — the drop target is the page, not
     a small dashed box someone has to aim at. */
  useEffect(() => {
    let depth = 0;
    const over = (e) => { e.preventDefault(); };
    const enter = (e) => {
      if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
      depth += 1;
      setDragging(true);
    };
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    const drop = (e) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (e.dataTransfer?.files?.length) send(e.dataTransfer.files);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  /* -------------------------------------------------------------- deleting */

  const removeMany = async (ids) => {
    const many = ids.length > 1;
    if (!window.confirm(
      many
        ? `Delete ${ids.length} images? Anywhere still using them will show a broken image.`
        : 'Delete this image? Anywhere still using it will show a broken image.',
    )) return;

    try {
      await Promise.all(ids.map((id) => api.admin.deleteMedia(id)));
      setRows((r) => r.filter((x) => !ids.includes(x.id)));
      setSelected(new Set());
      setDetail((d) => (d && ids.includes(d.id) ? null : d));
      success(many ? `${ids.length} images deleted.` : 'Image deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      success(`Copied ${url}`);
    } catch {
      window.prompt('Copy this path:', url);
    }
  };

  /* -------------------------------------------------------------- filtering */

  const months = useMemo(
    () => [...new Set((rows || []).map((r) => MONTH(r.created_at)))],
    [rows],
  );

  const shown = useMemo(() => (rows || []).filter((r) => {
    if (month && MONTH(r.created_at) !== month) return false;
    if (!term.trim()) return true;
    return (r.filename || '').toLowerCase().includes(term.trim().toLowerCase());
  }), [rows, term, month]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <>
      <Seo title="Media" noindex />

      <ScreenHeader title="Media" count={rows?.length}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy > 0} className="ad-btn-primary">
            <Upload size={15} /> {busy > 0 ? `Uploading ${busy}…` : 'Add new'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={pick} className="hidden" />

          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by filename"
              className="ad-input w-full pl-9 sm:w-56"
            />
          </div>

          {months.length > 1 && (
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="ad-select">
              <option value="">All dates</option>
              {months.map((m) => <option key={m}>{m}</option>)}
            </select>
          )}

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-adm-line bg-white p-1">
            {[['grid', GridIcon, 'Grid view'], ['list', ListIcon, 'List view']].map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                aria-label={label}
                aria-pressed={view === key}
                className={`rounded-md p-1.5 transition ${view === key ? 'bg-navy text-white' : 'text-adm-mute hover:bg-adm-soft'}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-navy px-4 py-2.5 text-white">
            <span className="text-[12.5px] font-medium">{selected.size} selected</span>
            <button type="button" onClick={() => removeMany([...selected])} className="text-[12.5px] font-semibold underline">
              Delete
            </button>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[12.5px] text-white/70 hover:text-white">
              Clear
            </button>
          </div>
        )}
      </ScreenHeader>

      {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

      {rows === null && <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>}

      {rows && rows.length === 0 && (
        <EmptyState
          title="No images yet"
          body="Upload product photography, detail crops and anything the content editor needs. Files can also be dropped straight onto this page."
          action={<button type="button" onClick={() => fileRef.current?.click()} className="ad-btn-primary"><Upload size={15} /> Add new</button>}
        />
      )}

      {rows && rows.length > 0 && shown.length === 0 && (
        <EmptyState title="Nothing matches" body="Try a different filename or date." />
      )}

      {shown.length > 0 && view === 'grid' && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {shown.map((m) => (
            <li key={m.id} className="ad-card group relative overflow-hidden">
              <span className="absolute left-2 top-2 z-10 rounded-md bg-white/90 p-1 opacity-0 shadow-sm transition focus-within:opacity-100 group-hover:opacity-100 has-[:checked]:opacity-100">
                <Checkbox checked={selected.has(m.id)} onChange={() => toggle(m.id)} label={`Select ${m.filename || m.id}`} />
              </span>

              <button type="button" onClick={() => setDetail(m)} className="block w-full text-left">
                <img src={m.url} alt="" loading="lazy" className="aspect-square w-full bg-adm-soft object-cover" />
                <span className="block border-t border-adm-line p-2.5">
                  <span className="block truncate text-[12px] font-medium text-adm-ink" title={m.filename || ''}>
                    {m.filename || `Image ${m.id}`}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-adm-mute">{size(m.bytes)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown.length > 0 && view === 'list' && (
        <div className="ad-card overflow-hidden">
          <ul className="divide-y divide-adm-line">
            {shown.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-adm-soft">
                <Checkbox checked={selected.has(m.id)} onChange={() => toggle(m.id)} label={`Select ${m.filename || m.id}`} />
                <button type="button" onClick={() => setDetail(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <img src={m.url} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-adm-line bg-adm-soft object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-adm-ink">{m.filename || `Image ${m.id}`}</span>
                    <span className="block truncate text-[11.5px] text-adm-mute">{m.url}</span>
                  </span>
                  <span className="hidden shrink-0 text-[12px] text-adm-mute sm:block">{size(m.bytes)}</span>
                  <span className="hidden shrink-0 text-[12px] text-adm-mute md:block">{formatDateTime(m.created_at)}</span>
                </button>
                <button type="button" onClick={() => removeMany([m.id])} aria-label="Delete image" className="shrink-0 rounded-md p-1.5 text-adm-mute transition hover:bg-rose-50 hover:text-sale">
                  <Close size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------ detail panel */}
      {detail && <Detail item={detail} onClose={() => setDetail(null)} onCopy={copy} onDelete={() => removeMany([detail.id])} />}

      {/* --------------------------------------------------------- drop hint */}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-navy/70 p-8">
          <p className="rounded-2xl border-2 border-dashed border-white/60 px-10 py-14 text-center font-heading text-[20px] font-semibold text-white">
            Drop to upload
          </p>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------- one image, big */

function Detail({ item, onClose, onCopy, onDelete }) {
  const [dims, setDims] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-adm-ink/40" />

      <aside className="relative flex w-full max-w-md flex-col bg-white shadow-pop animate-slide-in">
        <header className="flex items-center justify-between border-b border-adm-line px-5 py-3.5">
          <h2 className="truncate text-[14px] font-semibold text-adm-ink">{item.filename || `Image ${item.id}`}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink">
            <Close size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <img
            src={item.url}
            alt=""
            onLoad={(e) => setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            className="w-full rounded-xl border border-adm-line bg-adm-soft object-contain"
          />

          <dl className="mt-5 space-y-2.5 text-[12.5px]">
            {[
              ['Uploaded', formatDateTime(item.created_at)],
              ['File size', size(item.bytes)],
              ['Dimensions', dims ? `${dims.w} × ${dims.h} px` : '—'],
              ['Type', item.mime],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-adm-mute">{k}</dt>
                <dd className="text-right font-medium text-adm-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <p className="ad-label mb-1.5">Path</p>
            <div className="flex gap-2">
              <input readOnly value={item.url} onFocus={(e) => e.target.select()} className="ad-input font-mono text-[12px]" />
              <button type="button" onClick={() => onCopy(item.url)} className="ad-btn-ghost shrink-0">Copy</button>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-adm-mute">
              Paste this into any image field in Content, or into a product's image list.
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-adm-line bg-adm-soft px-5 py-3">
          <button type="button" onClick={onDelete} className="text-[12.5px] font-medium text-sale transition hover:underline">
            Delete permanently
          </button>
          <a href={item.url} target="_blank" rel="noreferrer" className="ad-btn-ghost ad-btn-sm">Open original</a>
        </footer>
      </aside>
    </div>
  );
}
