/**
 * The page document, and every operation that changes it.
 *
 * A page is a tree three levels deep, which is the structure Elementor uses
 * and the reason its layouts behave predictably:
 *
 *   section  →  column  →  widget
 *
 * A section is a full-width horizontal band. It holds columns side by side.
 * A column holds a stack of widgets. Nothing nests deeper than that, and that
 * limit is a feature: it is what stops a page turning into a tangle nobody
 * can edit a month later.
 *
 * Every function here returns a new document rather than changing the one it
 * was given. That is what makes undo a matter of keeping the old object
 * instead of replaying anything.
 */

/** Short, collision-proof enough for ids inside one page. */
export const uid = () => Math.random().toString(36).slice(2, 10);

export const BLANK_PAGE = { sections: [] };

/* ------------------------------------------------------------- responsive

   A responsive setting is stored as { d, t, m } — desktop, tablet, mobile —
   and the narrower sizes inherit from the wider ones when they are empty.
   Setting only `d` means "the same everywhere", which is what most settings
   are, so the common case stays small. */

export const DEVICES = ['d', 't', 'm'];

export const DEVICE_LABEL = { d: 'Desktop', t: 'Tablet', m: 'Mobile' };

/** The value in force on one device, following the inheritance chain. */
export function resolve(value, device = 'd') {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) return value;
  if (!('d' in value || 't' in value || 'm' in value)) return value;
  if (device === 'm') return value.m ?? value.t ?? value.d;
  if (device === 't') return value.t ?? value.d;
  return value.d;
}

/** Writes one device's value without disturbing the other two. */
export function setDevice(value, device, next) {
  const base = (value && typeof value === 'object' && !Array.isArray(value)
    && ('d' in value || 't' in value || 'm' in value)) ? value : { d: value };
  const out = { ...base, [device]: next };
  /* An empty override is removed rather than stored, so the value falls back
     to the wider device instead of pinning an empty string. */
  if (next === '' || next === undefined || next === null) delete out[device];
  return out;
}

/* ------------------------------------------------------------------ nodes */

export const newWidget = (type, settings = {}) => ({ id: uid(), kind: 'widget', type, settings });

export const newColumn = (widgets = []) => ({ id: uid(), kind: 'column', width: null, settings: {}, widgets });

export const newSection = (columnCount = 1) => ({
  id: uid(),
  kind: 'section',
  settings: {},
  columns: Array.from({ length: columnCount }, () => newColumn()),
});

/* ---------------------------------------------------------------- reading */

/** Every node in the tree, flat, each with the ids of its ancestors. */
export function walk(doc) {
  const out = [];
  (doc.sections || []).forEach((section, si) => {
    out.push({ node: section, kind: 'section', path: { si } });
    (section.columns || []).forEach((column, ci) => {
      out.push({ node: column, kind: 'column', path: { si, ci }, sectionId: section.id });
      (column.widgets || []).forEach((widget, wi) => {
        out.push({
          node: widget,
          kind: 'widget',
          path: { si, ci, wi },
          sectionId: section.id,
          columnId: column.id,
        });
      });
    });
  });
  return out;
}

export const findNode = (doc, id) => walk(doc).find((e) => e.node.id === id) || null;

/* --------------------------------------------------------------- writing */

/** Replaces one node's settings (or any other own field) by id. */
export function patchNode(doc, id, patch) {
  const apply = (node) => ({ ...node, ...patch });
  return {
    ...doc,
    sections: (doc.sections || []).map((s) => {
      if (s.id === id) return apply(s);
      return {
        ...s,
        columns: (s.columns || []).map((c) => {
          if (c.id === id) return apply(c);
          return { ...c, widgets: (c.widgets || []).map((w) => (w.id === id ? apply(w) : w)) };
        }),
      };
    }),
  };
}

/** Merges into a node's settings object, leaving the rest of it alone. */
export const patchSettings = (doc, id, settingsPatch) => {
  const found = findNode(doc, id);
  if (!found) return doc;
  return patchNode(doc, id, { settings: { ...(found.node.settings || {}), ...settingsPatch } });
};

/** Takes a node out of the tree. Returns the document and the node removed. */
export function removeNode(doc, id) {
  let removed = null;
  const sections = [];

  for (const section of doc.sections || []) {
    if (section.id === id) { removed = section; continue; }

    const columns = [];
    for (const column of section.columns || []) {
      if (column.id === id) { removed = column; continue; }

      const widgets = (column.widgets || []).filter((w) => {
        if (w.id !== id) return true;
        removed = w;
        return false;
      });
      columns.push({ ...column, widgets });
    }

    /* A section with no columns left has nothing to hold and nothing to show,
       so it goes too rather than leaving an invisible empty band behind. */
    if (!columns.length) continue;
    sections.push({ ...section, columns });
  }

  return { doc: { ...doc, sections }, removed };
}

/**
 * Where something can be dropped.
 *
 *   { kind: 'widget',  columnId, index }   between widgets in a column
 *   { kind: 'column',  sectionId, index }  between columns in a section
 *   { kind: 'section', index }             between sections on the page
 */
export function insertNode(doc, node, target) {
  const sections = [...(doc.sections || [])];

  if (target.kind === 'section') {
    const at = Math.max(0, Math.min(target.index, sections.length));
    /* A loose widget dropped on the page gets a section and column of its own,
       which is what Elementor does and what someone dragging there means. */
    const section = node.kind === 'section' ? node
      : newSection(1);
    if (node.kind !== 'section') {
      section.columns[0].widgets = node.kind === 'widget' ? [node] : [];
      if (node.kind === 'column') section.columns = [node];
    }
    sections.splice(at, 0, section);
    return { ...doc, sections };
  }

  return {
    ...doc,
    sections: sections.map((section) => {
      if (target.kind === 'column' && section.id === target.sectionId) {
        const columns = [...(section.columns || [])];
        const at = Math.max(0, Math.min(target.index, columns.length));
        const column = node.kind === 'column' ? node : newColumn(node.kind === 'widget' ? [node] : []);
        columns.splice(at, 0, column);
        return { ...section, columns };
      }

      if (target.kind === 'widget') {
        return {
          ...section,
          columns: (section.columns || []).map((column) => {
            if (column.id !== target.columnId) return column;
            const widgets = [...(column.widgets || [])];
            const at = Math.max(0, Math.min(target.index, widgets.length));
            widgets.splice(at, 0, node);
            return { ...column, widgets };
          }),
        };
      }

      return section;
    }),
  };
}

/**
 * Moving an existing node.
 *
 * The node is removed first and the target index corrected afterwards: taking
 * something out of a list shifts everything after it down one, so a drop
 * meant for position 4 would otherwise land at 3 when the item came from
 * earlier in the same list.
 */
export function moveNode(doc, id, target) {
  const before = findNode(doc, id);
  if (!before) return doc;

  /* Dropping a section inside itself, or a column into its own section's
     child, would detach a branch from the tree. */
  if (before.kind === 'section' && target.kind !== 'section') {
    const owner = findNode(doc, target.kind === 'column' ? target.sectionId : target.columnId);
    if (owner && (owner.sectionId === id || owner.node.id === id)) return doc;
  }
  if (before.kind === 'column' && target.kind === 'widget') {
    const col = findNode(doc, target.columnId);
    if (col && col.node.id === id) return doc;
  }

  let adjusted = target;
  if (target.kind === 'widget' && before.kind === 'widget'
      && before.columnId === target.columnId && before.path.wi < target.index) {
    adjusted = { ...target, index: target.index - 1 };
  }
  if (target.kind === 'column' && before.kind === 'column'
      && before.sectionId === target.sectionId && before.path.ci < target.index) {
    adjusted = { ...target, index: target.index - 1 };
  }
  if (target.kind === 'section' && before.kind === 'section' && before.path.si < target.index) {
    adjusted = { ...target, index: target.index - 1 };
  }

  const { doc: without, removed } = removeNode(doc, id);
  if (!removed) return doc;

  /* Removing may have taken an emptied section with it, which shifts the
     section indices the drop was measured against. */
  if (adjusted.kind === 'section' && without.sections.length < (doc.sections || []).length) {
    adjusted = { ...adjusted, index: Math.min(adjusted.index, without.sections.length) };
  }
  if (adjusted.kind !== 'section' && !findNode(without, adjusted.sectionId || adjusted.columnId)) {
    return doc; // the place we were dropping into no longer exists
  }

  return insertNode(without, removed, adjusted);
}

/** A copy of a node and everything under it, with fresh ids throughout. */
export function cloneNode(node) {
  if (node.kind === 'widget') return { ...node, id: uid(), settings: { ...node.settings } };
  if (node.kind === 'column') {
    return {
      ...node,
      id: uid(),
      settings: { ...node.settings },
      widgets: (node.widgets || []).map(cloneNode),
    };
  }
  return {
    ...node,
    id: uid(),
    settings: { ...node.settings },
    columns: (node.columns || []).map(cloneNode),
  };
}

/** Duplicates a node directly after itself. */
export function duplicateNode(doc, id) {
  const found = findNode(doc, id);
  if (!found) return doc;
  const copy = cloneNode(found.node);

  if (found.kind === 'widget') {
    return insertNode(doc, copy, { kind: 'widget', columnId: found.columnId, index: found.path.wi + 1 });
  }
  if (found.kind === 'column') {
    return insertNode(doc, copy, { kind: 'column', sectionId: found.sectionId, index: found.path.ci + 1 });
  }
  return insertNode(doc, copy, { kind: 'section', index: found.path.si + 1 });
}

/**
 * Guards a document read from the database.
 *
 * Content is stored as JSON, and a page written by an older version of the
 * editor — or by hand — must never be able to crash the storefront. Anything
 * unrecognised is dropped rather than rendered.
 */
export function normalise(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.sections)) return BLANK_PAGE;
  return {
    sections: raw.sections.filter(Boolean).map((s) => ({
      id: s.id || uid(),
      kind: 'section',
      settings: s.settings && typeof s.settings === 'object' ? s.settings : {},
      columns: (Array.isArray(s.columns) ? s.columns : []).filter(Boolean).map((c) => ({
        id: c.id || uid(),
        kind: 'column',
        width: c.width ?? null,
        settings: c.settings && typeof c.settings === 'object' ? c.settings : {},
        widgets: (Array.isArray(c.widgets) ? c.widgets : []).filter((w) => w && w.type).map((w) => ({
          id: w.id || uid(),
          kind: 'widget',
          type: String(w.type),
          settings: w.settings && typeof w.settings === 'object' ? w.settings : {},
        })),
      })),
    })),
  };
}
