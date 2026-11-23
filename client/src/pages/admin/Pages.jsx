import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cell, EmptyState, Field, ListTable, Notice, RowActions, ScreenHeader, SubsubsubNav,
} from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Close } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';

/**
 * Pages built in the visual editor.
 *
 * The list is deliberately thin — a page's real content lives in the builder,
 * so everything here is about finding one and knowing whether it is live.
 */

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Address', className: 'hidden md:table-cell' },
  { key: 'status', label: 'Status', className: 'w-28' },
  { key: 'nav', label: 'In menu', className: 'hidden lg:table-cell w-24' },
  { key: 'updated', label: 'Last edited', className: 'hidden xl:table-cell w-44' },
];

/** The "new page" sheet. Only a name is needed; the rest happens in the editor. */
function NewPage({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const suggested = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCreated(await api.admin.createPage({ title: title.trim(), slug: slug.trim() || title.trim() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-adm-ink/45" />
      <form onSubmit={create} className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-adm-line px-4 py-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-adm-ink">New page</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-adm-mute hover:text-adm-ink">
            <Close size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error && <Notice tone="error">{error}</Notice>}

          <Field label="Page name" htmlFor="np-title" required>
            <input
              id="np-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lookbook"
              autoFocus
              className="ad-input"
            />
          </Field>

          <Field label="Address" htmlFor="np-slug" hint="Where it lives on the site. Leave empty to use the name.">
            <div className="flex items-center gap-1">
              <span className="text-[13px] text-adm-mute">/</span>
              <input
                id="np-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={suggested || 'lookbook'}
                className="ad-input font-mono"
              />
            </div>
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-adm-line px-4 py-3">
          <button type="button" onClick={onClose} className="ad-btn-ghost">Cancel</button>
          <button type="submit" disabled={busy || !title.trim()} className="ad-btn-primary">
            {busy ? 'Creating…' : 'Create and edit'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Pages() {
  const [rows, setRows] = useState(null);
  const [view, setView] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { success } = useToast();

  const load = () => api.admin.pages().then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const all = rows || [];
  const counts = useMemo(() => ({
    all: all.length,
    published: all.filter((p) => p.status === 'published').length,
    draft: all.filter((p) => p.status !== 'published').length,
  }), [all]);

  const visible = all.filter((p) => {
    if (view === 'published' && p.status !== 'published') return false;
    if (view === 'draft' && p.status === 'published') return false;
    if (search) {
      const hay = `${p.title} ${p.slug}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const remove = async (page) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete “${page.title}”? The page and its history go for good.`)) return;
    try {
      await api.admin.deletePage(page.id);
      success('Page deleted.');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleNav = async (page) => {
    try {
      await api.admin.savePage(page.id, { show_in_nav: !page.show_in_nav });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Seo title="Pages" noindex />
      <ScreenHeader title="Pages" count={counts.all} action="Add new" onAction={() => setCreating(true)}>
        <p className="text-[12.5px] leading-relaxed text-adm-mute">
          Pages you build by dragging blocks around. The shop's own pages — home, product, cart —
          are designed in code and edited under <Link to="/admin/content" className="text-navy hover:underline">Content</Link>.
        </p>
        {error && <div className="mt-3"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}
      </ScreenHeader>

      <SubsubsubNav
        views={[
          { value: '', label: 'All', count: counts.all },
          { value: 'published', label: 'Published', count: counts.published },
          { value: 'draft', label: 'Drafts', count: counts.draft },
        ]}
        current={view}
        onChange={setView}
      />

      {rows && !all.length ? (
        <EmptyState
          title="No pages yet"
          body="Build a lookbook, a campaign page, a size story — anything that is not one of the shop's built-in screens."
          action={<button type="button" onClick={() => setCreating(true)} className="ad-btn-primary">Add your first page</button>}
        />
      ) : (
        <ListTable
          columns={COLUMNS}
          rows={visible}
          loading={rows === null}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search pages"
          empty="No pages match."
          renderRow={(p) => (
            <>
              <Cell primary>
                <Link to={`/admin/pages/${p.id}/edit`} className="font-semibold text-navy hover:underline">
                  {p.title}
                </Link>
                <RowActions
                  actions={[
                    { label: 'Edit', to: `/admin/pages/${p.id}/edit` },
                    ...(p.status === 'published'
                      ? [{ label: 'View', to: `/${p.slug}`, external: true }]
                      : []),
                    { label: p.show_in_nav ? 'Remove from menu' : 'Add to menu', onClick: () => toggleNav(p) },
                    { label: 'Delete', onClick: () => remove(p), danger: true },
                  ]}
                />
              </Cell>
              <Cell className="hidden md:table-cell">
                <span className="font-mono text-[12px] text-adm-mute">/{p.slug}</span>
              </Cell>
              <Cell>
                <span className={`ad-chip ${p.status === 'published' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
                  {p.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </Cell>
              <Cell className="hidden lg:table-cell">
                <span className="text-[12px] text-adm-mute">{p.show_in_nav ? 'Yes' : '—'}</span>
              </Cell>
              <Cell className="hidden xl:table-cell">
                <span className="text-[12px] text-adm-mute">{formatDateTime(p.updated_at)}</span>
              </Cell>
            </>
          )}
        />
      )}

      {creating && (
        <NewPage
          onClose={() => setCreating(false)}
          onCreated={(page) => navigate(`/admin/pages/${page.id}/edit`)}
        />
      )}
    </>
  );
}
