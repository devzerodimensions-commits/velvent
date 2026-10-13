/**
 * WooCommerce-shaped admin primitives.
 *
 * These reproduce the WordPress admin's furniture — the list table with its
 * bulk-action bar and hover row actions, the postbox/metabox, the publish box,
 * dismissible notices — because that is the layout a WooCommerce shopkeeper
 * already knows. The palette stays VELVENT's navy and cream rather than
 * WordPress grey and blue.
 */
import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Close, Search } from './Icons';
import { ADMIN_STATUS_LABEL, STATUS_TONE } from '../lib/format';

/* ------------------------------------------------------------------ screen */

/** The `.wrap` heading: title, inline "Add New", then any notices. */
export function ScreenHeader({ title, action, actionTo, onAction, count, children }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-[23px] font-normal leading-tight text-navy">{title}</h1>
        {action && actionTo && (
          <Link to={actionTo} className="wp-btn-secondary">{action}</Link>
        )}
        {action && onAction && (
          <button type="button" onClick={onAction} className="wp-btn-secondary">{action}</button>
        )}
        {count != null && (
          <span className="text-[13px] text-slate">{count} {count === 1 ? 'item' : 'items'}</span>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** A dismissible admin notice. `tone` follows WordPress: success/error/warning/info. */
export function Notice({ tone = 'info', children, onDismiss }) {
  const tones = {
    success: 'border-l-emerald-600 bg-emerald-50/70',
    error: 'border-l-sale bg-rose-50/70',
    warning: 'border-l-amber-500 bg-amber-50/70',
    info: 'border-l-navy bg-cream/60',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`relative flex items-start gap-3 border border-mist border-l-4 px-4 py-3 text-[13px] text-navy ${tones[tone]}`}
    >
      <p className="flex-1 leading-relaxed">{children}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss this notice"
          className="-mr-1 -mt-1 p-1 text-slate transition hover:text-navy"
        >
          <Close size={15} />
        </button>
      )}
    </div>
  );
}

/** The status views above a list table — "All (12) | Published (9) | Draft (3)". */
export function SubsubsubNav({ views, current, onChange }) {
  return (
    <ul className="mb-2 flex flex-wrap items-center gap-x-1 text-[13px] text-slate">
      {views.map((v, i) => (
        <li key={v.value ?? 'all'} className="flex items-center">
          <button
            type="button"
            onClick={() => onChange(v.value)}
            className={`transition hover:text-navy ${current === v.value ? 'font-semibold text-navy' : 'text-navy/70'}`}
          >
            {v.label} <span className="text-slate">({v.count})</span>
          </button>
          {i < views.length - 1 && <span className="px-2 text-mist">|</span>}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- list table */

const TableCtx = createContext(null);

/**
 * A WordPress list table.
 *
 * `rows` are the objects to render, `rowKey` pulls each one's id, and
 * `columns` describes the headings. Selection, the bulk-action bar and
 * pagination are all handled here so each screen only writes its cells.
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
  empty = 'No items found.',
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

  const nav = (position) => (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        {selectable && (
          <>
            <label className="sr-only" htmlFor={`bulk-${position}`}>Bulk action</label>
            <select
              id={`bulk-${position}`}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              className="wp-select"
            >
              <option value="">Bulk actions</option>
              {bulkActions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <button
              type="button"
              onClick={applyBulk}
              disabled={!bulk || selected.size === 0}
              className="wp-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </>
        )}
        {position === 'top' && filters}
      </div>

      <div className="flex items-center gap-3">
        {selected.size > 0 && (
          <span className="text-[12px] text-slate">{selected.size} selected</span>
        )}
        {total != null && (
          <span className="text-[12px] text-slate">{total} {total === 1 ? 'item' : 'items'}</span>
        )}
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPage?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="wp-page-btn disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 text-[12px] text-slate">{page} of {pages}</span>
            <button
              type="button"
              onClick={() => onPage?.(page + 1)}
              disabled={page >= pages}
              aria-label="Next page"
              className="wp-page-btn disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <TableCtx.Provider value={{ selected, toggle, selectable }}>
      {/* One wrapper, so a ListTable stays a single item inside a grid or flex parent. */}
      <div className="min-w-0">
      {onSearch && (
        <form
          className="mb-2 flex justify-end gap-2"
          onSubmit={(e) => { e.preventDefault(); onSearch(term); }}
        >
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="wp-input w-56 pl-8"
            />
          </div>
          <button type="submit" className="wp-btn-secondary">Search</button>
        </form>
      )}

      {nav('top')}

      <div className="overflow-x-auto border border-mist bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-mist bg-cream/50">
              {selectable && (
                <th scope="col" className="w-10 px-3 py-2.5">
                  <Checkbox checked={allOn} onChange={toggleAll} label="Select all" />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-3 py-2.5 text-[12px] font-semibold text-navy ${c.className || ''}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-10 text-center text-[13px] text-slate">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-10 text-center text-[13px] text-slate">{empty}</td></tr>
            )}
            {!loading && rows.map((row, i) => (
              <tr
                key={rowKey(row)}
                className={`group border-b border-mist/70 align-middle transition-colors last:border-0 hover:bg-cream/40 ${i % 2 ? 'bg-cream/20' : 'bg-white'}`}
              >
                {selectable && (
                  <td className="px-3 py-2.5">
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

      {nav('bottom')}
      </div>
    </TableCtx.Provider>
  );
}

export const useListTable = () => useContext(TableCtx);

/** A table cell. `primary` gives the bold first column that carries row actions. */
export function Cell({ children, className = '', primary = false }) {
  return (
    <td className={`px-3 py-2.5 text-[13px] ${primary ? 'text-navy' : 'text-slate'} ${className}`}>
      {children}
    </td>
  );
}

/**
 * WordPress's hover-revealed row links. They stay visible on touch devices and
 * whenever the row has keyboard focus, so they are never unreachable.
 */
export function RowActions({ actions }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[12px] opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      {actions.filter(Boolean).map((a, i) => (
        <span key={a.label} className="flex items-center">
          {a.to ? (
            <Link to={a.to} className={a.danger ? 'text-sale hover:underline' : 'text-slate hover:text-navy hover:underline'}>{a.label}</Link>
          ) : (
            <button
              type="button"
              onClick={a.onClick}
              className={a.danger ? 'text-sale hover:underline' : 'text-slate hover:text-navy hover:underline'}
            >
              {a.label}
            </button>
          )}
          {i < actions.filter(Boolean).length - 1 && <span className="px-1.5 text-mist">|</span>}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- form pieces */

export function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center border border-slate-light bg-white text-cream transition peer-checked:border-navy peer-checked:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-1 peer-disabled:opacity-40"
      >
        {checked && <Check size={11} />}
      </span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

/** A labelled row, the way WordPress lays out metabox fields. */
export function Field({ label, hint, htmlFor, children, required = false }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[150px_1fr] sm:items-start sm:gap-4">
      <label htmlFor={htmlFor} className="pt-2 text-[12.5px] font-semibold text-navy">
        {label}{required && <span className="text-sale"> *</span>}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1 text-[11.5px] leading-relaxed text-slate">{hint}</p>}
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap px-2 py-1 text-[11px] font-semibold ${STATUS_TONE[status] || 'bg-mist/60 text-slate'}`}>
      {ADMIN_STATUS_LABEL[status] || status}
    </span>
  );
}

/* -------------------------------------------------------------- metaboxes */

/** A WordPress postbox: titled panel that collapses when its handle is clicked. */
export function MetaBox({ title, children, actions, defaultOpen = true, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`border border-mist bg-white ${className}`}>
      <header className="flex items-center justify-between border-b border-mist px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-navy">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={id}
            aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            className="p-1 text-slate transition hover:text-navy"
          >
            <ChevronDown size={16} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
          </button>
        </div>
      </header>
      {open && <div id={id} className="p-4">{children}</div>}
    </section>
  );
}

/**
 * The "Product data" metabox: a vertical tab rail beside a panel, exactly as
 * WooCommerce arranges General / Inventory / Shipping / Variations.
 */
export function TabbedMetaBox({ title, tabs, children, actions }) {
  const [active, setActive] = useState(tabs[0]?.key);
  return (
    <section className="border border-mist bg-white">
      <header className="flex items-center justify-between border-b border-mist px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-navy">{title}</h2>
        {actions}
      </header>
      <div className="grid sm:grid-cols-[170px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-mist bg-cream/40 p-2 sm:flex-col sm:gap-0 sm:border-b-0 sm:border-r sm:p-0 sm:py-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-[12.5px] transition ${
                active === t.key
                  ? 'bg-white font-semibold text-navy sm:-mr-px sm:border-r-2 sm:border-navy'
                  : 'text-slate hover:text-navy'
              }`}
            >
              {t.Icon && <t.Icon size={14} />} {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4">{children(active)}</div>
      </div>
    </section>
  );
}

/** The right-rail Publish box. */
export function PublishBox({ children, onSave, saving, saveLabel = 'Publish', onDelete, deleteLabel = 'Move to Trash' }) {
  return (
    <section className="border border-mist bg-white">
      <header className="border-b border-mist px-4 py-2.5">
        <h2 className="text-[13px] font-semibold text-navy">Publish</h2>
      </header>
      {children && <div className="space-y-3 border-b border-mist p-4 text-[12.5px] text-slate">{children}</div>}
      <footer className="flex items-center justify-between gap-3 bg-cream/40 px-4 py-3">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-[12px] text-sale transition hover:underline">
            {deleteLabel}
          </button>
        ) : <span />}
        <button type="button" onClick={onSave} disabled={saving} className="wp-btn-primary">
          {saving ? 'Saving…' : saveLabel}
        </button>
      </footer>
    </section>
  );
}

/** The two-column edit screen: main content left, metaboxes right. */
export function EditLayout({ main, side }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">{main}</div>
      <div className="space-y-4">{side}</div>
    </div>
  );
}
