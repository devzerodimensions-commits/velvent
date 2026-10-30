import { useEffect, useState } from 'react';
import { Close, Menu } from '../../components/Icons';
import { Notice } from '../../components/adminUi';
import { useToast } from '../../store/toast';

/**
 * Putting a list in the order the shop should show it.
 *
 * Dragging is the obvious gesture, so it is here — but it is never the only
 * one. A drag needs a pointer, sight of the screen and a steady hand, and the
 * person arranging a shop's window display may be doing it on a laptop
 * trackpad at the end of a long day. Every row therefore also has plain
 * up/down buttons that work with a keyboard, a screen reader and one finger.
 *
 * Nothing saves until Save is pressed: a list being rearranged passes through
 * orders nobody wants, and each of those would otherwise be a write and a
 * moment where the live shop showed it.
 */
export default function Reorder({ items, label = 'items', onSave, onClose }) {
  const [list, setList] = useState(items);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { success } = useToast();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const move = (from, to) => {
    if (to < 0 || to >= list.length) return;
    setList((prev) => {
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  };

  const changed = list.some((row, i) => row.id !== items[i]?.id);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(list.map((row) => row.id));
      success(`Order saved — this is how shoppers now see the ${label}.`);
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button type="button" aria-label="Close" onClick={() => onClose(false)} className="fixed inset-0 cursor-default bg-adm-ink/50" />

      <div role="dialog" aria-modal="true" aria-label={`Reorder ${label}`} className="ad-card relative w-full max-w-xl overflow-hidden">
        <header className="flex items-center justify-between border-b border-adm-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-adm-ink">Reorder {label}</h2>
          <button type="button" onClick={() => onClose(false)} aria-label="Close" className="rounded-md p-1 text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink">
            <Close size={18} />
          </button>
        </header>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {error && <div className="mb-4"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}

          <p className="mb-3 text-[12px] leading-relaxed text-adm-mute">
            Drag a row, or use the arrows. This is the order the shop lists them in.
          </p>

          <ol className="space-y-1.5">
            {list.map((row, i) => (
              <li
                key={row.id}
                draggable
                onDragStart={() => setDragging(i)}
                onDragEnter={() => setOver(i)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={() => {
                  if (dragging !== null && over !== null && dragging !== over) move(dragging, over);
                  setDragging(null);
                  setOver(null);
                }}
                className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 transition ${
                  dragging === i ? 'opacity-40' : ''
                } ${over === i && dragging !== null && dragging !== i ? 'border-navy' : 'border-adm-line'}`}
              >
                <Menu size={16} className="shrink-0 cursor-grab text-slate-light" aria-hidden />

                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-adm-soft text-[11px] font-bold text-adm-mute">
                  {i + 1}
                </span>

                {row.image && (
                  <img src={row.image} alt="" className="h-9 w-9 shrink-0 rounded border border-adm-line bg-adm-soft object-cover" />
                )}

                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-adm-ink">{row.name}</span>

                <span className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    aria-label={`Move ${row.name} up`}
                    className="rounded-md px-2 py-1 text-[11px] text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink disabled:opacity-25"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === list.length - 1}
                    aria-label={`Move ${row.name} down`}
                    className="rounded-md px-2 py-1 text-[11px] text-adm-mute transition hover:bg-adm-soft hover:text-adm-ink disabled:opacity-25"
                  >
                    ▼
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-adm-line bg-adm-soft px-5 py-3">
          <span className="text-[12.5px] text-adm-mute">
            {changed ? 'Order changed' : 'Unchanged'}
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => onClose(false)} className="ad-btn-ghost">Cancel</button>
            <button type="button" onClick={save} disabled={saving || !changed} className="ad-btn-primary">
              {saving ? 'Saving…' : 'Save order'}
            </button>
          </span>
        </footer>
      </div>
    </div>
  );
}
