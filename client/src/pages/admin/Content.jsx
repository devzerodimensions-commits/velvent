import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MetaBox, Notice, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Check, ChevronRight, Refresh } from '../../components/Icons';
import FieldSet from './ContentFields';
import { SECTIONS, SECTION_BY_KEY } from '../../content';
import { mergeContent } from '../../lib/content';
import { api } from '../../lib/api';
import { useContentRefresh } from '../../store/content';
import { useToast } from '../../store/toast';
import { formatDateTime } from '../../lib/format';

/**
 * Editing the store's standing copy.
 *
 * Both screens work off the same registry the storefront reads, so what an
 * admin sees is exactly the set of fields the pages actually use — there is no
 * second list to keep in step.
 */

/** Where each section shows up on the site, so "Header" is not just a word. */
const PREVIEW = {
  brand: '/', header: '/', footer: '/', home: '/', about: '/about',
  contact: '/contact', faq: '/faq', shipping: '/shipping',
  returns: '/returns', privacy: '/privacy', terms: '/terms',
};

/* --------------------------------------------------------------- the index */

export function ContentIndex() {
  const [saved, setSaved] = useState([]);

  useEffect(() => { api.admin.content().then(setSaved).catch(() => setSaved([])); }, []);

  const editedAt = Object.fromEntries(saved.map((r) => [r.key, r.updated_at]));
  const groups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <>
      <Seo title="Content" noindex />
      <ScreenHeader title="Content">
        <p className="max-w-2xl text-[13px] leading-relaxed text-adm-mute">
          Every word and image on the store outside of products and categories. Changes go live the
          moment you save — nothing needs deploying.
        </p>
      </ScreenHeader>

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-adm-mute">{group}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SECTIONS.filter((s) => s.group === group).map((s) => (
                <li key={s.key}>
                  <Link
                    to={`/admin/content/${s.key}`}
                    className="ad-card group flex h-full flex-col p-4 transition hover:border-slate-light hover:shadow-pop"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-adm-ink">{s.label}</span>
                      <ChevronRight size={16} className="shrink-0 text-slate-light transition group-hover:translate-x-0.5 group-hover:text-navy" />
                    </span>
                    <span className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-adm-mute">{s.blurb}</span>
                    <span className="mt-3 flex items-center gap-1.5">
                      {editedAt[s.key] ? (
                        <span className="ad-chip bg-ok-soft text-ok"><Check size={11} /> Edited</span>
                      ) : (
                        <span className="ad-chip bg-adm-soft text-adm-mute">Default text</span>
                      )}
                      {editedAt[s.key] && (
                        <span className="text-[11px] text-adm-mute">{formatDateTime(editedAt[s.key])}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------- one section */

export default function ContentEditor() {
  const { key } = useParams();
  const section = SECTION_BY_KEY[key];

  const [value, setValue] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const loaded = useRef(null);

  const refreshSite = useContentRefresh();
  const { success } = useToast();

  /* The form always opens on the full merged value — defaults with whatever was
     saved on top — so every field has something in it and saving one field can
     never blank the rest. */
  useEffect(() => {
    if (!section) return undefined;
    let alive = true;
    setValue(null);
    setDirty(false);
    api.admin.content()
      .then((rows) => {
        if (!alive) return;
        const row = rows.find((r) => r.key === key);
        const merged = mergeContent(section.defaults, row?.value);
        loaded.current = JSON.stringify(merged);
        setSavedAt(row?.updated_at || null);
        setValue(merged);
      })
      .catch(() => {
        if (!alive) return;
        loaded.current = JSON.stringify(section.defaults);
        setValue(section.defaults);
      });
    return () => { alive = false; };
  }, [key, section]);

  const edit = (next) => {
    setValue(next);
    setDirty(JSON.stringify(next) !== loaded.current);
  };

  /* Leaving with unsaved edits is almost always a mistake, not a decision. */
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!section) {
    return (
      <>
        <ScreenHeader title="Content" />
        <Notice tone="error">That content section does not exist.</Notice>
      </>
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const row = await api.admin.saveContent(key, value);
      loaded.current = JSON.stringify(value);
      setSavedAt(row.updated_at);
      setDirty(false);
      await refreshSite();
      success(`${section.label} saved — it is live on the site now.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm(`Put ${section.label} back to the built-in text? Your edits here will be lost.`)) return;
    setSaving(true);
    try {
      await api.admin.resetContent(key);
      loaded.current = JSON.stringify(section.defaults);
      setValue(section.defaults);
      setSavedAt(null);
      setDirty(false);
      await refreshSite();
      success(`${section.label} is back to the built-in text.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Seo title={section.label} noindex />

      <div className="mb-4 flex items-center gap-1.5 text-[12.5px] text-adm-mute">
        <Link to="/admin/content" className="hover:text-navy hover:underline">Content</Link>
        <ChevronRight size={14} />
        <span className="text-adm-ink">{section.label}</span>
      </div>

      <ScreenHeader title={section.label}>
        <p className="max-w-2xl text-[13px] leading-relaxed text-adm-mute">{section.blurb}</p>
      </ScreenHeader>

      {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

      {value === null ? (
        <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>
      ) : (
        <>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="ad-card p-5 sm:p-6">
              <FieldSet fields={section.fields} value={value} onChange={edit} path={key} />
            </div>

            <div className="space-y-5 xl:sticky xl:top-20">
              <div className="ad-card overflow-hidden">
                <div className="space-y-2 p-4 text-[12.5px] leading-relaxed text-adm-mute">
                  <p>
                    {savedAt
                      ? <>Last edited {formatDateTime(savedAt)}.</>
                      : <>Showing the built-in text. Nothing has been edited here yet.</>}
                  </p>
                  {PREVIEW[key] && (
                    <a href={PREVIEW[key]} target="_blank" rel="noreferrer" className="inline-block font-medium text-navy hover:underline">
                      See this page on the store →
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 bg-adm-soft px-4 py-3">
                  {savedAt ? (
                    <button type="button" onClick={reset} className="flex items-center gap-1.5 text-[12px] font-medium text-sale transition hover:underline">
                      <Refresh size={13} /> Reset
                    </button>
                  ) : <span />}
                  <button type="button" onClick={save} disabled={saving || !dirty} className="ad-btn-primary">
                    {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                  </button>
                </div>
              </div>

              <MetaBox title="Writing tips" defaultOpen={false}>
                <ul className="space-y-3 text-[11.5px] leading-relaxed text-adm-mute">
                  <li>
                    <strong className="text-adm-ink">Links.</strong> Write
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">[Track Order](/track-order)</code>
                    {' '}and it becomes a link.
                  </li>
                  <li>
                    <strong className="text-adm-ink">Live values.</strong> Write
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">{'{fee}'}</code>,
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">{'{freeAbove}'}</code>,
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">{'{returnDays}'}</code>,
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">{'{phone}'}</code> or
                    {' '}<code className="rounded bg-adm-soft px-1 py-0.5">{'{email}'}</code> and the
                    current setting fills in — so a policy always quotes what checkout really charges.
                  </li>
                  <li>
                    <strong className="text-adm-ink">Images.</strong> Upload a file, pick one from the
                    library, or paste a path like <code className="rounded bg-adm-soft px-1 py-0.5">/products/photo.jpg</code>.
                  </li>
                </ul>
              </MetaBox>
            </div>
          </div>

          {/* A save bar that follows you down a long form. */}
          {dirty && (
            <div className="sticky bottom-4 z-40 mt-5 xl:hidden">
              <div className="flex items-center gap-3 rounded-xl bg-navy px-4 py-3 text-white shadow-pop">
                <span className="text-[12.5px]">Unsaved changes</span>
                <button type="button" onClick={save} disabled={saving} className="ml-auto rounded-lg bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
