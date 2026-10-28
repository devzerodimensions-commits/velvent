/**
 * The admin panel's furniture.
 *
 * One card shape, one table, one field row, one notice — every screen is built
 * from these so the panel reads as a single piece of software rather than a
 * dozen pages that happen to share a palette. Cards are white and rounded on a
 * grey canvas; the only strong colour is the navy a primary action is drawn in.
 */
import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Close, Search } from './Icons';
import { ADMIN_STATUS_LABEL, STATUS_TONE } from '../lib/format';

/* ------------------------------------------------------------------ screen */

/** The page heading: title, a count, an inline primary action, then notices. */
export function ScreenHeader({ title, action, actionTo, onAction, count, children }) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-[22px] font-semibold leading-tight text-adm-ink sm:text-[26px]">
            {title}
          </h1>
          {count != null && (
            <span className="ad-chip bg-adm-soft text-adm-mute">{count} {count === 1 ? 'item' : 'items'}</span>
          )}
        </div>
        {action && actionTo && <Link to={actionTo} className="ad-btn-primary">{action}</Link>}
        {action && onAction && <button type="button" onClick={onAction} className="ad-btn-primary">{action}</button>}
      </div>
      {children && <div className="mt-3.5">{children}</div>}
    </div>
  );
}

export function Notice({ tone = 'info', children, onDismiss }) {
  const tones = {
    success: 'bg-ok-soft text-ok',
    error: 'bg-rose-50 text-sale',
    warning: 'bg-warn-soft text-warn',
    info: 'bg-info-soft text-info',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] ${tones[tone]}`}
    >
      <div className="flex-1 leading-relaxed [&_a]:font-semibold [&_a]:underline">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss this notice" className="-mr-1 -mt-0.5 p-1 opacity-60 transition hover:opacity-100">
          <Close size={15} />
        </button>
      )}
    </div>
  );
}

/** The filter views above a list — "All 12 · Published 9 · Draft 3". */
export function SubsubsubNav({ views, current, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-adm-line bg-white p-1">
      {views.map((v) => {
        const on = current === v.value;
        return (
          <button
            key={v.value ?? 'all'}
            type="button"
            onClick={() => onChange(v.value)}
            className={`rounded-lg px-3 py-1.5 text-[12.5px] transition ${
              on ? 'bg-navy font-semibold text-white' : 'text-adm-mute hover:bg-adm-soft hover:text-adm-ink'
            }`}
          >
            {v.label}
            <span className={on ? 'ml-1.5 text-white/60' : 'ml-1.5 text-slate-light'}>{v.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- list table */

const TableCtx = createContext(null);

/**
 * The panel's one table.
 *
 * `rows` are the objects to render, `rowKey` pulls each one's id, and
 * `columns` describes the headings. Selection, the bulk-action bar, search and
 * pagination are handled here so each screen only writes its own cells.
 */
export function ListTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  renderRow,
  bulkActions = [],
  onBulkAction,
  search,
  onSearch,
  searchPlaceholder = 'Search',
  filters,
  page = 1,
  pages = 1,
  total,
  onPage,
  empty = 'Nothing here yet.',
  loading = false,
}) {
  const [selected, setSelected] = useState(() => new Set());
  const [bulk, setBulk] = useState('');
  const [term, setTerm] = useState(search || '');

  // Rows change under us when a filter or page changes; a stale selection would
  // apply a bulk action to something no longer on screen.
  const ids = useMemo(() => rows.map(rowKey), [rows, rowKey]);
  useEffect(() => { setSelected(new Set()); }, [ids.join(',')]);

  const allOn = ids.length > 0 && ids.every((id) => selected.has(id));
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(ids));
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectable = bulkActions.length > 0;

  const applyBulk = async () => {
    if (!bulk || selected.size === 0) return;
    await onBulkAction?.(bulk, [...selected]);
    setSelected(new Set());
    setBulk('');
  };

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <TableCtx.Provider value={{ selected, toggle, selectable }}>
      <div className="min-w-0 space-y-3">
        {/* -------------------------------------------------- tools above */}
        {(onSearch || filters || selectable) && (
          <div className="flex flex-wrap items-center gap-2">
            {selectable && (
              <>
                <label className="sr-only" htmlFor="bulk-action">Bulk action</label>
                <select id="bulk-action" value={bulk} onChange={(e) => setBulk(e.target.value)} className="ad-select">
                  <option value="">Bulk actions</option>
                  {bulkActions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={applyBulk}
                  disabled={!bulk || selected.size === 0}
                  className="ad-btn-ghost"
                >
                  Apply{selected.size > 0 ? ` (${selected.size})` : ''}
                </button>
              </>
            )}
            {filters}

            {onSearch && (
              <form className="ml-auto flex gap-2" onSubmit={(e) => { e.preventDefault(); onSearch(term); }}>
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="ad-input w-full pl-9 sm:w-64"
                  />
                </div>
                <button type="submit" className="ad-btn-ghost">Search</button>
              </form>
            )}
          </div>
        )}

        {/* ------------------------------------------------------- the table */}
        <div className="ad-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-adm-line bg-adm-soft">
                  {selectable && (
                    <th scope="col" className="w-10 px-4 py-3">
                      <Checkbox checked={allOn} onChange={toggleAll} label="Select all" />
                    </th>
                  )}
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute ${c.className || ''}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-adm-line">
                {loading && (
                  <tr><td colSpan={colCount} className="px-4 py-14 text-center text-[13px] text-adm-mute">Loading…</td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={colCount} className="px-4 py-14 text-center text-[13px] text-adm-mute">{empty}</td></tr>
                )}
                {!loading && rows.map((row, i) => (
                  <tr key={rowKey(row)} className="group align-middle transition-colors hover:bg-adm-soft">
                    {selectable && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(rowKey(row))}
                          onChange={() => toggle(rowKey(row))}
                          label={`Select row ${i + 1}`}
                        />
                      </td>
                    )}
                    {renderRow(row)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(total != null || pages > 1) && (
            <div className="flex items-center justify-between gap-3 border-t border-adm-line px-4 py-2.5">
              <span className="text-[12px] text-adm-mute">
                {selected.size > 0 ? `${selected.size} selected` : total != null ? `${total} ${total === 1 ? 'item' : 'items'}` : ''}
              </span>
              {pages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => onPage?.(page - 1)} disabled={page <= 1} aria-label="Previous page" className="ad-page-btn disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="px-1 text-[12px] text-adm-mute">{page} of {pages}</span>
                  <button type="button" onClick={() => onPage?.(page + 1)} disabled={page >= pages} aria-label="Next page" className="ad-page-btn disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TableCtx.Provider>
  );
}

export const useListTable = () => useContext(TableCtx);

/** A table cell. `primary` gives the bold first column that carries row actions. */
export function Cell({ children, className = '', primary = false }) {
  return (
    <td className={`px-4 py-3 text-[13px] ${primary ? 'text-adm-ink' : 'text-adm-mute'} ${className}`}>
      {children}
    </td>
  );
}

/**
 * Hover-revealed row links. They stay visible on touch devices and whenever the
 * row has keyboard focus, so they are never unreachable.
 */
export function RowActions({ actions }) {
  const live = actions.filter(Boolean);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[12px] opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      {live.map((a) => (
        a.to ? (
          <Link key={a.label} to={a.to} className={a.danger ? 'text-sale hover:underline' : 'text-adm-mute hover:text-navy hover:underline'}>
            {a.label}
          </Link>
        ) : (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={a.danger ? 'text-sale hover:underline' : 'text-adm-mute hover:text-navy hover:underline'}
          >
            {a.label}
          </button>
        )
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- form pieces */

export function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-slate-light bg-white text-white transition peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-4 peer-focus-visible:ring-navy/20 peer-disabled:opacity-40"
      >
        {checked && <Check size={12} />}
      </span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

/** A labelled field row: label above on narrow screens, beside on wide ones. */
export function Field({ label, hint, htmlFor, children, required = false }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[170px_1fr] sm:items-start sm:gap-5">
      <label htmlFor={htmlFor} className="ad-label pt-2.5">
        {label}{required && <span className="text-sale"> *</span>}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-[11.5px] leading-relaxed text-adm-mute">{hint}</p>}
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  return (
    <span className={`ad-chip ${STATUS_TONE[status] || 'bg-adm-soft text-adm-mute'}`}>
      {ADMIN_STATUS_LABEL[status] || status}
    </span>
  );
}

/* ----------------------------------------------------------------- panels */

/** A titled card. Collapsible, because long edit screens need to be foldable. */
export function MetaBox({ title, children, actions, defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`ad-card ${className}`}>
      <header className="flex items-center justify-between gap-3 border-b border-adm-line px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={id}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink"
          >
            <ChevronDown size={16} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </header>
      {open && <div id={id} className="p-4 sm:p-5">{children}</div>}
    </section>
  );
}

/** A card with a tab rail down its left side. */
export function TabbedMetaBox({ title, tabs, children, actions }) {
  const [active, setActive] = useState(tabs[0]?.key);
  return (
    <section className="ad-card overflow-hidden">
      <header className="flex items-center justify-between border-b border-adm-line px-4 py-3">
        <h2 className="text-[13.5px] font-semibold text-adm-ink">{title}</h2>
        {actions}
      </header>
      <div className="grid sm:grid-cols-[180px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-adm-line bg-adm-soft p-2 sm:flex-col sm:gap-0.5 sm:border-b-0 sm:border-r">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-[12.5px] transition ${
                active === t.key ? 'bg-white font-semibold text-navy shadow-sm' : 'text-adm-mute hover:text-adm-ink'
              }`}
            >
              {t.Icon && <t.Icon size={15} />} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 sm:p-5">{children(active)}</div>
      </div>
    </section>
  );
}

/** The save card in the right rail. */
export function PublishBox({ children, onSave, saving, saveLabel = 'Save', onDelete, deleteLabel = 'Delete' }) {
  return (
    <section className="ad-card overflow-hidden">
      {children && <div className="space-y-2 border-b border-adm-line p-4 text-[12.5px] leading-relaxed text-adm-mute">{children}</div>}
      <div className="flex items-center justify-between gap-3 bg-adm-soft px-4 py-3">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-[12px] font-medium text-sale transition hover:underline">
            {deleteLabel}
          </button>
        ) : <span />}
        <button type="button" onClick={onSave} disabled={saving} className="ad-btn-primary">
          {saving ? 'Saving…' : saveLabel}
        </button>
      </div>
    </section>
  );
}

/** The two-column edit screen: content left, side cards right. */
export function EditLayout({ main, side }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">{main}</div>
      <div className="space-y-5">{side}</div>
    </div>
  );
}

/** An empty state with room for a call to action. */
export function EmptyState({ title, body, action }) {
  return (
    <div className="ad-card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-[15px] font-semibold text-adm-ink">{title}</p>
      {body && <p className="max-w-sm text-[13px] leading-relaxed text-adm-mute">{body}</p>}
      {action}
    </div>
  );
}
