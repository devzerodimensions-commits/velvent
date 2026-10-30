import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, Notice, ScreenHeader, SubsubsubNav } from '../../components/adminUi';
import { Seo, Rating } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../store/toast';

/**
 * Reading reviews before shoppers do.
 *
 * Anyone can write one, under any name, about a product they have never
 * bought — so nothing is published until someone here has read it. A product's
 * star rating counts only what is approved, so hiding a review moves the
 * rating with it and a rejected one never touches it at all.
 */
export default function Reviews() {
  const [data, setData] = useState(null);
  const [view, setView] = useState('pending');
  const [error, setError] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { success } = useToast();

  const load = (status = view) => api.admin.reviews(status)
    .then(setData)
    .catch((err) => setError(err.message));

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [view]);

  const setStatus = async (review, status) => {
    setError(null);
    try {
      await api.admin.updateReview(review.id, { status });
      await load();
      success(
        status === 'approved' ? 'Published — it is on the product page now.'
          : status === 'spam' ? 'Marked as spam and hidden.'
            : 'Moved back to pending.',
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const saveReply = async (review) => {
    setError(null);
    try {
      await api.admin.updateReview(review.id, { reply: replyText });
      setReplyTo(null);
      setReplyText('');
      await load();
      success(replyText.trim() ? 'Reply saved.' : 'Reply removed.');
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (review) => {
    if (!window.confirm(`Delete this review from ${review.author}? This cannot be undone — marking it spam hides it and keeps the record.`)) return;
    setError(null);
    try {
      await api.admin.deleteReview(review.id);
      await load();
      success('Review deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  const counts = data?.counts || {};
  const views = [
    { value: 'pending', label: 'Pending', count: counts.pending || 0 },
    { value: 'approved', label: 'Published', count: counts.approved || 0 },
    { value: 'spam', label: 'Spam', count: counts.spam || 0 },
    { value: null, label: 'All', count: Object.values(counts).reduce((a, b) => a + b, 0) },
  ];

  const reviews = data?.reviews || [];

  return (
    <>
      <Seo title="Reviews" noindex />
      <ScreenHeader title="Reviews" count={reviews.length}>
        <p className="max-w-2xl text-[13px] leading-relaxed text-adm-mute">
          Nothing a customer writes appears on the store until it is published here. A product's
          star rating counts published reviews only.
        </p>
        {error && <div className="mt-3"><Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice></div>}
      </ScreenHeader>

      <SubsubsubNav views={views} current={view} onChange={setView} />

      {data === null && <p className="py-16 text-center text-[13px] text-adm-mute">Loading…</p>}

      {data && reviews.length === 0 && (
        <EmptyState
          title={view === 'pending' ? 'Nothing waiting' : 'Nothing here'}
          body={view === 'pending' ? 'New reviews will appear here for checking before they go live.' : 'Try another tab.'}
        />
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <article key={r.id} className="ad-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Rating value={r.rating} />
                  <span className="text-[13px] font-semibold text-adm-ink">{r.author}</span>
                  <span className={`ad-chip ${
                    r.status === 'approved' ? 'bg-ok-soft text-ok'
                      : r.status === 'spam' ? 'bg-rose-50 text-sale'
                        : 'bg-warn-soft text-warn'
                  }`}
                  >
                    {r.status === 'approved' ? 'Published' : r.status === 'spam' ? 'Spam' : 'Pending'}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-adm-mute">
                  {formatDateTime(r.created_at)} on{' '}
                  <Link to={`/product/${r.product_slug}`} target="_blank" rel="noreferrer" className="text-navy hover:underline">
                    {r.product_name}
                  </Link>
                </p>
              </div>
            </div>

            {r.title && <h3 className="mt-3 text-[13.5px] font-semibold text-adm-ink">{r.title}</h3>}
            {r.body && <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-adm-mute">{r.body}</p>}

            {r.reply && replyTo !== r.id && (
              <div className="mt-3 rounded-lg border-l-2 border-navy bg-adm-soft p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-adm-mute">Your reply</p>
                <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-adm-ink">{r.reply}</p>
              </div>
            )}

            {replyTo === r.id && (
              <div className="mt-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="This appears under the review on the product page, signed as the shop."
                  className="ad-textarea"
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => saveReply(r)} className="ad-btn-primary ad-btn-sm">Save reply</button>
                  <button type="button" onClick={() => setReplyTo(null)} className="ad-btn-ghost ad-btn-sm">Cancel</button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-adm-line pt-3">
              {r.status !== 'approved' && (
                <button type="button" onClick={() => setStatus(r, 'approved')} className="ad-btn-primary ad-btn-sm">Publish</button>
              )}
              {r.status === 'approved' && (
                <button type="button" onClick={() => setStatus(r, 'pending')} className="ad-btn-ghost ad-btn-sm">Unpublish</button>
              )}
              {r.status !== 'spam' && (
                <button type="button" onClick={() => setStatus(r, 'spam')} className="ad-btn-ghost ad-btn-sm">Spam</button>
              )}
              <button
                type="button"
                onClick={() => { setReplyTo(r.id); setReplyText(r.reply || ''); }}
                className="ad-btn-ghost ad-btn-sm"
              >
                {r.reply ? 'Edit reply' : 'Reply'}
              </button>
              <button type="button" onClick={() => remove(r)} className="ml-auto text-[12px] font-medium text-sale transition hover:underline">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
