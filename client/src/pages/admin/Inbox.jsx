import { useEffect, useMemo, useState } from 'react';
import { Seo } from '../../components/ui';
import { Cell, ListTable, Notice, RowActions, ScreenHeader, SubsubsubNav } from '../../components/wp';
import { api } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';

const MESSAGE_COLUMNS = [
  { key: 'from', label: 'From' },
  { key: 'subject', label: 'Subject', className: 'hidden md:table-cell' },
  { key: 'message', label: 'Message' },
  { key: 'date', label: 'Date', className: 'w-32' },
];

const SUBSCRIBER_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'date', label: 'Subscribed', className: 'w-36' },
];

export default function Inbox() {
  const [tab, setTab] = useState('messages');
  const [messages, setMessages] = useState(null);
  const [subscribers, setSubscribers] = useState(null);
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const load = () => {
    api.admin.messages().then(setMessages).catch((e) => setError(e.message));
    api.admin.subscribers().then(setSubscribers).catch(() => {});
  };
  useEffect(load, []);

  const unread = useMemo(() => (messages || []).filter((m) => !m.is_read).length, [messages]);

  const markRead = async (m) => {
    try {
      await api.admin.readMessage(m.id);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: true } : x)));
    } catch (err) { toastError(err.message); }
  };

  const runBulk = async (action, ids) => {
    if (action !== 'read') return;
    try {
      await Promise.all(ids.map((id) => api.admin.readMessage(id)));
      setNotice({ tone: 'success', text: `${ids.length} message${ids.length === 1 ? '' : 's'} marked as read.` });
      load();
    } catch (err) { toastError(err.message); }
  };

  const copyEmails = async () => {
    const list = (subscribers || []).map((s) => s.email).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      success(`${subscribers.length} email addresses copied.`);
    } catch {
      setNotice({ tone: 'error', text: 'This browser would not let the page copy to the clipboard. Select the column and copy it by hand.' });
    }
  };

  if (error) return <Notice tone="error">{error}</Notice>;

  return (
    <>
      <Seo title="Inbox" noindex />
      <ScreenHeader
        title="Inbox"
        action={tab === 'subscribers' && subscribers?.length ? 'Copy all addresses' : undefined}
        onAction={tab === 'subscribers' ? copyEmails : undefined}
      >
        {notice && <Notice tone={notice.tone} onDismiss={() => setNotice(null)}>{notice.text}</Notice>}
      </ScreenHeader>

      <SubsubsubNav
        current={tab}
        onChange={setTab}
        views={[
          { value: 'messages', label: 'Messages', count: unread ? `${unread} unread` : (messages?.length ?? 0) },
          { value: 'subscribers', label: 'Subscribers', count: subscribers?.length ?? 0 },
        ]}
      />

      {tab === 'messages' ? (
        <ListTable
          columns={MESSAGE_COLUMNS}
          rows={messages || []}
          loading={messages === null}
          bulkActions={[{ value: 'read', label: 'Mark as read' }]}
          onBulkAction={runBulk}
          total={messages?.length}
          empty="No messages yet."
          renderRow={(m) => (
            <>
              <Cell primary>
                <span className={m.is_read ? 'text-navy' : 'font-semibold text-navy'}>{m.name}</span>
                {!m.is_read && <span className="ml-2 bg-sale px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                <span className="block text-[11.5px] text-slate">{m.email}{m.phone ? ` · ${m.phone}` : ''}</span>
                <RowActions
                  actions={[
                    { label: open === m.id ? 'Hide' : 'Read', onClick: () => setOpen(open === m.id ? null : m.id) },
                    !m.is_read && { label: 'Mark as read', onClick: () => markRead(m) },
                    { label: 'Reply', to: `mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || 'Your enquiry')}` },
                  ]}
                />
              </Cell>
              <Cell className="hidden md:table-cell">{m.subject || '—'}</Cell>
              <Cell>
                <span className={open === m.id ? 'block whitespace-pre-wrap leading-relaxed' : 'line-clamp-1'}>
                  {m.message}
                </span>
              </Cell>
              <Cell>
                <span title={formatDateTime(m.created_at)}>{formatDate(m.created_at)}</span>
              </Cell>
            </>
          )}
        />
      ) : (
        <ListTable
          columns={SUBSCRIBER_COLUMNS}
          rows={subscribers || []}
          loading={subscribers === null}
          total={subscribers?.length}
          empty="Nobody has signed up yet."
          renderRow={(s) => (
            <>
              <Cell primary>
                <a href={`mailto:${s.email}`} className="text-navy hover:underline">{s.email}</a>
              </Cell>
              <Cell>{formatDate(s.created_at)}</Cell>
            </>
          )}
        />
      )}
    </>
  );
}
