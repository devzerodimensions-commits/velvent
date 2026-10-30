import { useEffect, useState } from 'react';
import { Cell, EmptyState, ListTable, Notice, RowActions, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDateTime, inr } from '../../lib/format';
import { useContent } from '../../store/content';
import { downloadCsv, stampedName } from '../../lib/csv';
import { useToast } from '../../store/toast';

const COLUMNS = [
  { key: 'who', label: 'Shopper' },
  { key: 'items', label: 'In the bag' },
  { key: 'value', label: 'Value', className: 'w-28' },
  { key: 'when', label: 'Last seen', className: 'hidden md:table-cell w-40' },
];

/**
 * Checkouts that were started and never finished.
 *
 * A row appears once a shopper has typed a usable email into checkout, and
 * disappears the moment their order is placed — so everything here is someone
 * who got close and stopped. The shop has their number, so the useful action
 * is a message, and the WhatsApp link opens one already addressed.
 *
 * Rows clear themselves after 60 days. These are contact details of people
 * who did not buy, and keeping them indefinitely is not something to leave to
 * whether anyone remembers to tidy up.
 */
export default function Abandoned() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const brand = useContent('brand');
  const { success } = useToast();

  const load = () => api.admin.abandoned().then(setRows).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  const remove = async (row) => {
    if (!window.confirm(`Remove ${row.email} from this list?`)) return;
    try {
      await api.admin.deleteAbandoned(row.id);
      setRows((list) => list.filter((r) => r.id !== row.id));
      success('Removed.');
    } catch (err) {
      setError(err.message);
    }
  };

  /** A message that already says what it is about, so nobody writes it twice. */
  const whatsappLink = (row) => {
    const digits = String(row.phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const withCode = digits.length === 10 ? `91${digits}` : digits;
    const first = (row.name || '').trim().split(' ')[0];
    const text = `Hi${first ? ` ${first}` : ''}, this is ${brand.name}. You left a few pieces in your bag — can we help with sizes or anything else?`;
    return `https://wa.me/${withCode}?text=${encodeURIComponent(text)}`;
  };

  const exportCsv = () => downloadCsv(stampedName('velvent-abandoned'), rows || [], [
    ['Name', (r) => r.name || ''],
    ['Email', (r) => r.email],
    ['Phone', (r) => r.phone || ''],
    ['Value', (r) => Number(r.subtotal)],
    ['Items', (r) => (r.items || []).map((i) => `${i.name} (${i.color}/${i.size}) x${i.quantity}`).join(' | ')],
    ['Past orders', (r) => r.past_orders],
    ['Last seen', (r) => formatDateTime(r.updated_at)],
  ]);

  return (
    <>
      <Seo title="Abandoned carts" noindex />

      <ScreenHeader
        title="Abandoned carts"
        count={rows?.length}
        action={rows?.length ? 'Export CSV' : undefined}
        onAction={rows?.length ? exportCsv : undefined}
      >
        <p className="max-w-2xl text-[13px] leading-relaxed text-adm-mute">
          Shoppers who reached checkout, gave an email and did not finish. A row disappears by
          itself when their order arrives, and the list clears after 60 days.
        </p>
        {error && <div className="mt-3"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}
      </ScreenHeader>

      {rows && rows.length === 0 ? (
        <EmptyState
          title="Nothing abandoned"
          body="When someone gets as far as entering their email at checkout and stops, they will show up here."
        />
      ) : (
        <ListTable
          columns={COLUMNS}
          rows={rows || []}
          loading={rows === null}
          total={rows?.length}
          renderRow={(r) => {
            const wa = whatsappLink(r);
            return (
              <>
                <Cell primary>
                  <span className="font-semibold text-adm-ink">{r.name || 'Not given'}</span>
                  {r.past_orders > 0 && (
                    <span className="ml-2 ad-chip bg-ok-soft text-ok">
                      {r.past_orders} past order{r.past_orders === 1 ? '' : 's'}
                    </span>
                  )}
                  <span className="block break-all text-[11.5px] text-adm-mute">{r.email}</span>
                  {r.phone && <span className="block text-[11.5px] text-adm-mute">{r.phone}</span>}
                  <RowActions
                    actions={[
                      wa && { label: 'WhatsApp', to: wa },
                      { label: `Email ${r.email}`, to: `mailto:${r.email}` },
                      { label: 'Remove', onClick: () => remove(r), danger: true },
                    ]}
                  />
                </Cell>
                <Cell>
                  <ul className="space-y-0.5 text-[12px]">
                    {(r.items || []).map((i, n) => (
                      <li key={n}>
                        {i.name} <span className="text-adm-mute">{i.color} / {i.size} × {i.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </Cell>
                <Cell><span className="font-semibold text-adm-ink">{inr(r.subtotal)}</span></Cell>
                <Cell className="hidden md:table-cell">{formatDateTime(r.updated_at)}</Cell>
              </>
            );
          }}
        />
      )}
    </>
  );
}
