import { useEffect, useState } from 'react';
import { Alert, Seo, Spinner } from '../../components/ui';
import { Check, Mail } from '../../components/Icons';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';

export default function Inbox() {
  const [tab, setTab] = useState('messages');
  const [messages, setMessages] = useState(null);
  const [subscribers, setSubscribers] = useState(null);
  const [error, setError] = useState(null);
  const { success } = useToast();

  const load = () => {
    api.admin.messages().then(setMessages).catch((e) => setError(e.message));
    api.admin.subscribers().then(setSubscribers).catch(() => {});
  };
  useEffect(load, []);

  const markRead = async (m) => {
    await api.admin.readMessage(m.id);
    success('Marked as read.');
    load();
  };

  const copyEmails = async () => {
    const list = (subscribers || []).map((s) => s.email).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      success(`${subscribers.length} email addresses copied.`);
    } catch {
      setError('Could not copy to the clipboard in this browser.');
    }
  };

  if (error) return <Alert>{error}</Alert>;

  const unread = (messages || []).filter((m) => !m.is_read).length;

  return (
    <>
      <Seo title="Admin — Inbox" noindex />
      <h1 className="font-display text-xl font-semibold uppercase tracking-wider2 text-navy">Inbox</h1>

      <div className="mt-6 flex gap-1 border-b border-mist" role="tablist">
        {[
          ['messages', `Messages${unread ? ` (${unread})` : ''}`],
          ['subscribers', `Subscribers${subscribers ? ` (${subscribers.length})` : ''}`],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-3 text-[11.5px] font-semibold uppercase tracking-wider2 transition ${
              tab === key ? 'border-navy text-navy' : 'border-transparent text-slate hover:text-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'messages' && (
        !messages ? <div className="py-20 text-center"><Spinner className="text-navy" /></div>
          : messages.length === 0 ? <p className="mt-10 text-[13.5px] text-slate">No messages yet.</p>
            : (
              <ul className="mt-6 space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className={`border bg-white p-5 ${m.is_read ? 'border-mist' : 'border-navy'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-navy">
                          {m.subject}
                          {!m.is_read && <span className="ml-2.5 bg-navy px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-cream">New</span>}
                        </p>
                        <p className="mt-1 text-[12px] text-slate">
                          {m.name} · <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                          {m.phone && <> · <a href={`tel:${m.phone}`} className="underline">{m.phone}</a></>}
                        </p>
                      </div>
                      <span className="text-[11.5px] text-slate">{formatDateTime(m.created_at)}</span>
                    </div>
                    <p className="mt-3.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-slate">{m.message}</p>
                    <div className="mt-4 flex gap-2">
                      <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="btn-ghost btn-sm">
                        <Mail size={15} /> Reply
                      </a>
                      {!m.is_read && (
                        <button onClick={() => markRead(m)} className="btn-outline btn-sm"><Check size={15} /> Mark read</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
      )}

      {tab === 'subscribers' && (
        !subscribers ? <div className="py-20 text-center"><Spinner className="text-navy" /></div>
          : subscribers.length === 0 ? <p className="mt-10 text-[13.5px] text-slate">No newsletter subscribers yet.</p>
            : (
              <>
                <button onClick={copyEmails} className="btn-outline btn-sm mt-6">Copy all addresses</button>
                <ul className="mt-5 divide-y divide-mist border border-mist bg-white">
                  {subscribers.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3 text-[13px]">
                      <a href={`mailto:${s.email}`} className="text-navy hover:underline">{s.email}</a>
                      <span className="text-[11.5px] text-slate">{formatDateTime(s.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )
      )}
    </>
  );
}
