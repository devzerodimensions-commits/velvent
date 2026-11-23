import {
  cloneElement, createContext, Fragment, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '../../components/ui';
import { ChevronLeft, Close, Grid } from '../../components/Icons';
import PageRender from '../../builder/Render';
import Control from '../../builder/controls';
import { WIDGET_LIST, widgetDef } from '../../builder/registry';
import { COLUMN_SCHEMA, SECTION_SCHEMA, WIDGET_COMMON } from '../../builder/schema';
import {
  BLANK_PAGE, DEVICE_LABEL, DEVICES, duplicateNode, findNode, insertNode,
  moveNode, newSection, newWidget, normalise, patchSettings, removeNode,
} from '../../builder/model';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';

/**
 * The page builder.
 *
 * Three parts: a panel on the left that is either the widget library or the
 * settings for whatever is selected, a canvas in the middle showing the real
 * page, and a bar across the top for device, history and saving.
 *
 * The canvas is not a preview. It is `PageRender` — the same component the
 * storefront uses — with handles drawn on top by cloning each element and
 * slipping an overlay inside it. Nothing is wrapped in an extra div, because
 * an extra div between a column and its flex row is the difference between a
 * layout that works and one that only works in the editor.
 *
 * Everything the editor's own pieces need travels by context rather than
 * closure. That is not tidiness: a drop zone rebuilt from a new function on
 * each render is a *different component type* to React, so it unmounts and
 * remounts mid-drag — and a remounted element under the cursor silently kills
 * the drag that was over it.
 */

const Ctx = createContext(null);

/* The starting points offered by "Add section", by column widths. */
const LAYOUTS = [
  { label: '1', widths: [null] },
  { label: '2', widths: [50, 50] },
  { label: '3', widths: [33.33, 33.33, 33.33] },
  { label: '4', widths: [25, 25, 25, 25] },
  { label: '⅓ ⅔', widths: [33.33, 66.66] },
  { label: '⅔ ⅓', widths: [66.66, 33.33] },
];

const KIND_LABEL = { section: 'Section', column: 'Column', widget: 'Widget' };

const sameTarget = (a, b) => a && b && JSON.stringify(a) === JSON.stringify(b);

/* ------------------------------------------------- editor pieces (stable) */

/**
 * A drop target drawn over the edge of an element.
 *
 * Absolutely positioned, and rendered only while something is being dragged.
 * Both of those matter: absolute keeps it out of the layout so the canvas
 * measures the same as the live page, and only-while-dragging means it never
 * sits between the client and the thing they are trying to click.
 */
function DropStrip({ target, place }) {
  const ctx = useContext(Ctx);
  if (!ctx?.dragging) return null;
  const active = sameTarget(ctx.dropAt, target);
  return (
    <span
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setDropAt(target); }}
      onDragLeave={() => ctx.clearDropAt(target)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); ctx.drop(target); }}
      className={`vb-strip vb-strip-${place}${active ? ' vb-strip-on' : ''}`}
      aria-hidden
    />
  );
}

/** The in-flow target used only where there is no element to hang one off:
    an empty page, and an empty column. */
function DropZone({ target }) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const active = sameTarget(ctx.dropAt, target);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setDropAt(target); }}
      onDragLeave={() => ctx.clearDropAt(target)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); ctx.drop(target); }}
      className={`vb-empty${active ? ' vb-drop-on' : ''}`}
    >
      Drag a section here
    </div>
  );
}

function Chrome({ node, kind }) {
  const ctx = useContext(Ctx);
  return (
    <span className={`vb-chrome vb-chrome-${kind}`} onClick={(e) => e.stopPropagation()}>
      <span
        draggable
        onDragStart={(e) => ctx.startDrag(e, { source: 'move', id: node.id })}
        onDragEnd={ctx.endDrag}
        title="Drag to move"
        className="vb-grip"
      >
        ⠿
      </span>
      <span className="vb-chrome-name">
        {kind === 'widget' ? (widgetDef(node.type)?.label || node.type) : KIND_LABEL[kind]}
      </span>
      <button type="button" title="Duplicate" onClick={() => ctx.duplicate(node.id)}>⧉</button>
      <button type="button" title="Delete" onClick={() => ctx.remove(node.id)}>×</button>
    </span>
  );
}

/* Which edges of each kind of element accept a drop. Columns sit side by
   side, so theirs are the left and right edges; the other two stack. */
const EDGES = {
  section: ['top', 'bottom'],
  column: ['left', 'right'],
  widget: ['top', 'bottom'],
};

/** Adds selection, hover and handles to a rendered element, without wrapping it. */
function Decorate({ node, kind, targets, children }) {
  const ctx = useContext(Ctx);
  const isSel = ctx.selected === node.id;
  const isHot = ctx.hovered === node.id;
  const [beforeEdge, afterEdge] = EDGES[kind];

  return cloneElement(children, {
    className: `${children.props.className} vb-editable vb-ed-${kind}${isSel ? ' vb-sel' : ''}${isHot ? ' vb-hot' : ''}`,
    onClick: (e) => { e.stopPropagation(); ctx.select(node.id); },
    onMouseOver: (e) => { e.stopPropagation(); ctx.setHovered(node.id); },
    onMouseOut: (e) => { e.stopPropagation(); ctx.unhover(node.id); },
    /* Keys here are not decoration. The body keeps the same key whether or
       not the handle is showing, so React reconciles the subtree in place —
       without that, every hover would remount the canvas under the cursor
       and cancel whatever drag was over it. */
    children: [
      (isSel || isHot) ? <Chrome key="__chrome" node={node} kind={kind} /> : null,
      targets ? <DropStrip key="__before" target={targets.before} place={beforeEdge} /> : null,
      targets ? <DropStrip key="__after" target={targets.after} place={afterEdge} /> : null,
      <Fragment key="__body">{children.props.children}</Fragment>,
    ],
  });
}

function EmptyColumn({ column }) {
  const ctx = useContext(Ctx);
  const target = { kind: 'widget', columnId: column.id, index: 0 };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); ctx.setDropAt(target); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); ctx.drop(target); }}
      className={`vb-empty${sameTarget(ctx.dropAt, target) ? ' vb-drop-on' : ''}`}
    >
      Drag a widget here
    </div>
  );
}

/* The one object handed to the renderer. Module-level, so its identity never
   changes and nothing inside the canvas remounts. */
const EDITOR_UI = {
  wrapSection: (n, c, t) => <Decorate node={n} kind="section" targets={t}>{c}</Decorate>,
  wrapColumn: (n, c, t) => <Decorate node={n} kind="column" targets={t}>{c}</Decorate>,
  wrapWidget: (n, c, t) => <Decorate node={n} kind="widget" targets={t}>{c}</Decorate>,
  DropZone,
  emptyColumn: (column) => <EmptyColumn key={column.id} column={column} />,
};

/* ------------------------------------------------------------- the screen */

export default function PageBuilder() {
  const { id } = useParams();
  const { success, error: toastError } = useToast();

  const [meta, setMeta] = useState(null);
  /* One state, so undo and redo can never disagree about where they are. */
  const [history, setHistory] = useState({ past: [], present: BLANK_PAGE, future: [] });
  const { past, present: doc, future } = history;
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [device, setDevice] = useState('d');
  const [tab, setTab] = useState('content');
  const [previewing, setPreviewing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dropAt, setDropAt] = useState(null);
  /* Drop targets exist only while a drag is in flight, so they can never sit
     between the client and something they meant to click. */
  const [dragging, setDragging] = useState(false);

  const drag = useRef(null);
  /* Only `save` reads this — it is asynchronous and fires from a click, so it
     needs the document as it stands rather than as it was when the handler
     was built. Every edit goes through `apply` instead. */
  const live = useRef(doc);
  live.current = doc;

  useEffect(() => {
    api.admin.page(id)
      .then((p) => { setMeta(p); setHistory({ past: [], present: normalise(p.content), future: [] }); })
      .catch((e) => toastError(e.message));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ history */

  /**
   * Every change to the page goes through here.
   *
   * Past, present and future are one piece of state, not three, and the
   * updater is pure — it is handed the current document and returns the next
   * one. The first version kept three separate states and called setState
   * from inside another setState's updater, which left redo doing nothing at
   * all: React may run an updater more than once or defer it, and the side
   * effects buried in those updaters did not survive that.
   */
  const apply = useCallback((fn) => {
    setHistory((h) => {
      const next = fn(h.present);
      if (next === h.present) return h;
      return { past: [...h.past.slice(-49), h.present], present: next, future: [] };
    });
    setDirty(true);
  }, []);

  const undo = useCallback(() => setHistory((h) => (h.past.length ? {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
  } : h)), []);

  const redo = useCallback(() => setHistory((h) => (h.future.length ? {
    past: [...h.past, h.present],
    present: h.future[0],
    future: h.future.slice(1),
  } : h)), []);

  /* --------------------------------------------------------------- save */

  const save = useCallback(async (status) => {
    setSaving(true);
    try {
      const saved = await api.admin.savePage(id, {
        content: live.current,
        ...(status ? { status } : {}),
      });
      setMeta(saved);
      setDirty(false);
      success(status === 'published' ? 'Page published.' : 'Saved.');
    } catch (e) {
      toastError(e.message);
    } finally {
      setSaving(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /* ---------------------------------------------------------- shortcuts */

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save(); return; }
      if (typing) return;
      if (e.key === 'Escape') { setSelected(null); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        apply((d) => removeNode(d, selected).doc);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, save, apply, selected]);

  /* ------------------------------------------------------------ context */

  const ctx = {
    selected,
    hovered,
    dropAt,
    dragging,
    select: (nodeId) => { setSelected(nodeId); setTab('content'); },
    setHovered,
    unhover: (nodeId) => setHovered((h) => (h === nodeId ? null : h)),
    setDropAt,
    clearDropAt: (t) => setDropAt((d) => (sameTarget(d, t) ? null : d)),

    startDrag: (e, payload) => {
      drag.current = payload;
      setDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      /* Firefox refuses to start a drag unless some data is set. */
      try { e.dataTransfer.setData('text/plain', payload.type || payload.id || 'vb'); } catch { /* ignore */ }
    },
    endDrag: () => { drag.current = null; setDragging(false); setDropAt(null); },

    drop: (target) => {
      const payload = drag.current;
      drag.current = null;
      setDragging(false);
      setDropAt(null);
      if (!payload) return;

      if (payload.source === 'new') {
        const def = widgetDef(payload.type);
        const node = newWidget(payload.type, { ...(def?.defaults || {}) });
        apply((d) => insertNode(d, node, target));
        setSelected(node.id);
        setTab('content');
        return;
      }
      apply((d) => moveNode(d, payload.id, target));
    },

    duplicate: (nodeId) => apply((d) => duplicateNode(d, nodeId)),
    remove: (nodeId) => {
      apply((d) => removeNode(d, nodeId).doc);
      setSelected((s) => (s === nodeId ? null : s));
    },
  };

  /* -------------------------------------------------------------- panel */

  const sel = selected ? findNode(doc, selected) : null;

  let schema = null;
  if (sel?.kind === 'section') schema = { ...SECTION_SCHEMA, content: SECTION_SCHEMA.layout, title: 'Section' };
  else if (sel?.kind === 'column') schema = { ...COLUMN_SCHEMA, content: COLUMN_SCHEMA.layout, title: 'Column' };
  else if (sel) {
    const def = widgetDef(sel.node.type);
    schema = {
      content: def?.content || [],
      style: [...(def?.style || []), ...WIDGET_COMMON.style],
      advanced: WIDGET_COMMON.advanced,
      title: def?.label || sel.node.type,
    };
  }

  const addSection = (widths) => {
    const section = newSection(widths.length);
    section.columns.forEach((c, i) => {
      if (widths[i] !== null) c.settings = { width: { d: widths[i] } };
    });
    apply((d) => insertNode(d, section, { kind: 'section', index: (d.sections || []).length }));
    setAdding(false);
    setSelected(section.id);
  };

  if (!meta) return <p className="p-10 text-center text-[13px] text-adm-mute">Loading the page…</p>;

  return (
    <Ctx.Provider value={ctx}>
      <div className="fixed inset-0 z-[90] flex bg-adm-soft">
        <Seo title={`Editing ${meta.title}`} noindex />

        {/* ---------------------------------------------------- left panel */}
        {!previewing && (
          <aside className="flex w-[320px] shrink-0 flex-col border-r border-adm-line bg-white">
            <div className="flex h-14 items-center gap-2 border-b border-adm-line px-3">
              {sel ? (
                <>
                  <button type="button" onClick={() => setSelected(null)} aria-label="Back to widgets" className="ad-btn-quiet px-1.5">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="flex-1 truncate text-[13px] font-bold text-adm-ink">{schema.title}</span>
                </>
              ) : (
                <>
                  <Grid size={17} className="text-adm-mute" />
                  <span className="flex-1 text-[13px] font-bold text-adm-ink">Widgets</span>
                </>
              )}
            </div>

            {sel ? (
              <>
                <div className="flex border-b border-adm-line">
                  {['content', 'style', 'advanced'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.07em] transition ${
                        tab === t ? 'border-b-2 border-navy text-navy' : 'text-adm-mute hover:text-adm-ink'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-3.5">
                  {(schema[tab] || []).map((field) => (
                    <Control
                      key={field.name}
                      field={field}
                      settings={sel.node.settings || {}}
                      device={device}
                      onDevice={setDevice}
                      onChange={(patch) => apply((d) => patchSettings(d, selected, patch))}
                    />
                  ))}
                  {!(schema[tab] || []).length && (
                    <p className="py-8 text-center text-[12px] text-adm-mute">Nothing to set here.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-3">
                <p className="mb-3 text-[11.5px] leading-relaxed text-adm-mute">
                  Drag any of these onto the page. Click something already there to change it.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {WIDGET_LIST.map((w) => (
                    <div
                      key={w.type}
                      draggable
                      onDragStart={(e) => ctx.startDrag(e, { source: 'new', type: w.type })}
                      onDragEnd={ctx.endDrag}
                      className="flex cursor-grab flex-col items-center gap-1.5 rounded-lg border border-adm-line bg-white px-2 py-3 text-center transition hover:border-navy hover:shadow-pop active:cursor-grabbing"
                    >
                      <span className="text-[17px] leading-none text-navy">{w.glyph}</span>
                      <span className="text-[10.5px] font-medium text-adm-ink">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* -------------------------------------------------------- canvas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-adm-line bg-white px-3">
            <Link to="/admin/pages" className="ad-btn-quiet px-1.5" title="All pages">
              <Close size={18} />
            </Link>
            <span className="min-w-0 truncate text-[13px] font-semibold text-adm-ink">{meta.title}</span>
            <span className={`ad-chip ${meta.status === 'published' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
              {meta.status === 'published' ? 'Live' : 'Draft'}
            </span>

            <span className="ml-auto flex items-center gap-1.5">
              <span className="mr-1 flex rounded-lg border border-adm-line p-0.5">
                {DEVICES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    title={DEVICE_LABEL[d]}
                    aria-pressed={device === d}
                    className={`rounded px-2 py-1 text-[11px] font-bold transition ${
                      device === d ? 'bg-navy text-white' : 'text-adm-mute hover:bg-adm-soft'
                    }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </span>

              <button type="button" onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)" className="ad-btn-ghost ad-btn-sm">↶</button>
              <button type="button" onClick={redo} disabled={!future.length} title="Redo (Ctrl+Shift+Z)" className="ad-btn-ghost ad-btn-sm">↷</button>
              <button type="button" onClick={() => { setPreviewing((p) => !p); setSelected(null); }} className="ad-btn-ghost ad-btn-sm">
                {previewing ? 'Edit' : 'Preview'}
              </button>
              <button type="button" onClick={() => save()} disabled={saving} className="ad-btn-ghost ad-btn-sm">
                {saving ? 'Saving…' : dirty ? 'Save draft' : 'Saved'}
              </button>
              <button type="button" onClick={() => save('published')} disabled={saving} className="ad-btn-primary ad-btn-sm">
                {meta.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </span>
          </header>

          <div className="flex-1 overflow-y-auto" onClick={() => setSelected(null)}>
            <div
              className={`mx-auto min-h-full bg-cream transition-[max-width] duration-200 ${
                device === 'm' ? 'max-w-[400px]' : device === 't' ? 'max-w-[780px]' : 'max-w-none'
              }`}
            >
              <PageRender
                doc={doc}
                device={device}
                mode="editor"
                ui={previewing ? undefined : EDITOR_UI}
                editing={!previewing}
              />

              {!previewing && (
                <div className="px-6 py-8 text-center">
                  {adding ? (
                    <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-adm-line bg-white p-3 shadow-pop">
                      <span className="text-[11.5px] font-semibold text-adm-mute">Columns:</span>
                      {LAYOUTS.map((l) => (
                        <button key={l.label} type="button" onClick={(e) => { e.stopPropagation(); addSection(l.widths); }} className="ad-btn-ghost ad-btn-sm min-w-[44px]">
                          {l.label}
                        </button>
                      ))}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setAdding(false); }} className="ad-btn-quiet px-1.5"><Close size={16} /></button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setAdding(true); }}
                      className="rounded-xl border-2 border-dashed border-navy/25 px-6 py-4 text-[12.5px] font-semibold text-navy transition hover:border-navy/60 hover:bg-white/50"
                    >
                      + Add a section
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
