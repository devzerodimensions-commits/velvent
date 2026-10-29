import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, EmptyState, Notice, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Check, Close, Grid as GridIcon, Menu as ListIcon, Search, Upload } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';
import { UPLOAD_HINT, fileSize, monthOf, typeOf } from './media/shared';

/**
 * The media library.
 *
 * Laid out the way a media library is expected to be: view toggle, type and
 * date filters and a bulk-select mode on the left, search on the right, and a
 * separate page for uploading. Selection is a mode rather than a checkbox on
 * every tile, so browsing stays quiet until you actually want to delete
 * something.
 *
 * Images live in Postgres rather than on disk, because Render wipes the
 * filesystem on every deploy — so this is the real library, not a view of a
 * folder.
 */
export default function Media() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('velvent.admin.media') || 'grid'; } catch { return 'grid'; }
  });

  const [term, setTerm] = useState('');
  const [type, setType] = useState('');
  const [month, setMonth] = useState('');

  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [detail, setDetail] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(0);

  const { success } = useToast();

  const load = () => api.admin.media().then(setRows).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    try { localStorage.setItem('velvent.admin.media', view); } catch { /* private mode */ }
  }, [view]);

  /* Dropping on the library uploads too, even though the upload page is where
     the big target lives — having files bounce off this page would be odd. */
  const send = async (files) => {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    setBusy(images.length);
    setError(null);
    const failed = [];
    for (const file of images) {
      try { await api.admin.upload(file); } catch (err) { failed.push(`${file.name}: ${err.message}`); }
      setBusy((n) => n - 1);
    }
    await load();
    if (failed.length) setError(failed.join(' · '));
    const ok = images.length - failed.length;
    if (ok > 0) success(ok === 1 ? 'Image uploaded.' : `${ok} images uploaded.`);
  };

  useEffect(() => {
    let depth = 0;
    const over = (e) => e.preventDefault();
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
        ? `Delete ${ids.length} images permanently? Anywhere still using them will show a broken image.`
        : 'Delete this image permanently? Anywhere still using it will show a broken image.',
    )) return;

    try {
      await Promise.all(ids.map((id) => api.admin.deleteMedia(id)));
      setRows((r) => r.filter((x) => !ids.includes(x.id)));
      setSelected(new Set());
      setPicking(false);
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

  /* ------------------------------------------------------------- filtering */

  const types = useMemo(() => [...new Set((rows || []).map((r) => typeOf(r.mime)))].sort(), [rows]);
  const months = useMemo(() => [...new Set((rows || []).map((r) => monthOf(r.created_at)))], [rows]);

  const shown = useMemo(() => (rows || []).filter((r) => {
    if (type && typeOf(r.mime) !== type) return false;
    if (month && monthOf(r.created_at) !== month) return false;
    if (!term.trim()) return true;
    return (r.filename || '').toLowerCase().includes(term.trim().toLowerCase());
  }), [rows, term, type, month]);

  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const open = (m) => (picking ? toggle(m.id) : setDetail(m));

  const leavePicking = () => { setPicking(false); setSelected(new Set()); };

  return (
    <>
      <Seo title="Media" noindex />

      <ScreenHeader title="Media" count={rows?.length} action="Add Media File" actionTo="/admin/media/new">
        <div className="flex flex-wrap items-center gap-2">
          {/* view toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-adm-line bg-white p-1">
            {[['list', ListIcon, 'List view'], ['grid', GridIcon, 'Grid view']].map(([key, Icon, label]) => (
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

          <select value={type} onChange={(e) => setType(e.target.value)} className="ad-select" aria-label="Filter by type">
            <option value="">All media items</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={month} onChange={(e) => setMonth(e.target.value)} className="ad-select" aria-label="Filter by date">
            <option value="">All dates</option>
            {months.map((m) => <option key={m}>{m}</option>)}
          </select>

          {picking ? (
            <>
              <button
                type="button"
                onClick={() => removeMany([...selected])}
                disabled={selected.size === 0}
                className="ad-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete permanently{selected.size > 0 ? ` (${selected.size})` : ''}
              </button>
              <button type="button" onClick={leavePicking} className="ad-btn-quiet">Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setPicking(true)} className="ad-btn-ghost">Bulk select</button>
          )}

          <div className="relative ml-auto">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search media"
              className="ad-input w-full pl-9 sm:w-56"
            />
          </div>
        </div>

        {busy > 0 && (
          <p className="mt-3 text-[12.5px] text-adm-mute">Uploading {busy} file{busy === 1 ? '' : 's'}…</p>
        )}
      </ScreenHeader>

      {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

      {rows === null && <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>}

      {rows && rows.length === 0 && (
        <EmptyState
          title="No images yet"
          body={`Upload product photography, detail crops and anything the content editor needs. ${UPLOAD_HINT}`}
          action={<Link to="/admin/media/new" className="ad-btn-primary"><Upload size={15} /> Add Media File</Link>}
        />
      )}

      {rows && rows.length > 0 && shown.length === 0 && (
        <EmptyState title="Nothing matches" body="Try a different filename, type or date." />
      )}

      {/* ------------------------------------------------------------- grid */}
      {shown.length > 0 && view === 'grid' && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {shown.map((m) => {
            const on = selected.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => open(m)}
                  aria-pressed={picking ? on : undefined}
                  className={`ad-card relative block w-full overflow-hidden text-left transition hover:border-slate-light ${
                    on ? 'ring-2 ring-navy ring-offset-2' : ''
                  }`}
                >
                  {picking && (
                    <span
                      className={`absolute left-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-md border transition ${
                        on ? 'border-navy bg-navy text-white' : 'border-adm-line bg-white/90 text-transparent'
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  )}
                  <img src={m.url} alt="" loading="lazy" className="aspect-square w-full bg-adm-soft object-cover" />
                  <span className="block border-t border-adm-line p-2.5">
                    <span className="block truncate text-[12px] font-medium text-adm-ink" title={m.filename || ''}>
                      {m.filename || `Image ${m.id}`}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-adm-mute">{fileSize(m.bytes)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------------------------- list */}
      {shown.length > 0 && view === 'list' && (
        <div className="ad-card overflow-hidden">
          <ul className="divide-y divide-adm-line">
            {shown.map((m) => (
              <li key={m.id} className={`flex items-center gap-3 px-4 py-2.5 transition hover:bg-adm-soft ${selected.has(m.id) ? 'bg-navy/5' : ''}`}>
                {picking && (
                  <Checkbox checked={selected.has(m.id)} onChange={() => toggle(m.id)} label={`Select ${m.filename || m.id}`} />
                )}
                <button type="button" onClick={() => open(m)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <img src={m.url} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg border border-adm-line bg-adm-soft object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-adm-ink">{m.filename || `Image ${m.id}`}</span>
                    <span className="block truncate text-[11.5px] text-adm-mute">{m.url}</span>
                  </span>
                  <span className="hidden w-16 shrink-0 text-[12px] text-adm-mute sm:block">{typeOf(m.mime)}</span>
                  <span className="hidden w-20 shrink-0 text-[12px] text-adm-mute sm:block">{fileSize(m.bytes)}</span>
                  <span className="hidden shrink-0 text-[12px] text-adm-mute md:block">{formatDateTime(m.created_at)}</span>
                </button>
                {!picking && (
                  <button
                    type="button"
                    onClick={() => removeMany([m.id])}
                    aria-label="Delete image"
                    className="shrink-0 rounded-md p-1.5 text-adm-mute transition hover:bg-rose-50 hover:text-sale"
                  >
                    <Close size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail && (
        <Detail item={detail} onClose={() => setDetail(null)} onCopy={copy} onDelete={() => removeMany([detail.id])} />
      )}

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
              ['File size', fileSize(item.bytes)],
              ['Dimensions', dims ? `${dims.w} × ${dims.h} px` : '—'],
              ['Type', typeOf(item.mime)],
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
