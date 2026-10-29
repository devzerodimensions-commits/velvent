import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notice, ScreenHeader } from '../../components/adminUi';
import { Seo } from '../../components/ui';
import { Check, Close, Upload } from '../../components/Icons';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast';
import { UPLOAD_HINT, UPLOAD_TYPES, fileSize } from './media/shared';

/**
 * Uploading, on a page of its own.
 *
 * One large target rather than a button tucked into a toolbar, and a queue
 * underneath: every file is listed with what happened to it. Files are checked
 * for type and size here as well as on the server, so a 10 MB photo is refused
 * instantly with a reason rather than after the upload has crawled up and been
 * rejected.
 */
export default function MediaUpload() {
  const [queue, setQueue] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { success } = useToast();

  /* Only the type is worth refusing before converting. A 20 MB PNG becomes a
     few hundred kilobytes of WebP, so judging the original size here would
     turn away files that upload perfectly well. */
  const reject = (file) => (
    UPLOAD_TYPES.includes(file.type) ? null : 'Not a JPG, PNG, WEBP or AVIF'
  );

  const send = async (files) => {
    const list = [...files];
    if (!list.length) return;

    const started = list.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      size: file.size,
      file,
      state: reject(file) ? 'error' : 'waiting',
      message: reject(file),
    }));

    setQueue((q) => [...started, ...q]);
    setBusy(true);

    for (const item of started) {
      if (item.state === 'error') continue;
      setQueue((q) => q.map((x) => (x.key === item.key ? { ...x, state: 'uploading' } : x)));
      try {
        const { url } = await api.admin.upload(item.file);
        setQueue((q) => q.map((x) => (x.key === item.key ? { ...x, state: 'done', url } : x)));
      } catch (err) {
        setQueue((q) => q.map((x) => (x.key === item.key ? { ...x, state: 'error', message: err.message } : x)));
      }
    }

    setBusy(false);
    const ok = started.filter((s) => s.state !== 'error').length;
    if (ok > 0) success(ok === 1 ? 'Image uploaded.' : `${ok} images uploaded.`);
  };

  const pick = (e) => {
    const { files } = e.target;
    e.target.value = '';
    send(files);
  };

  /* The drop target is the whole page, not just the dashed box — aiming at a
     rectangle is a thing people miss. */
  useEffect(() => {
    let depth = 0;
    const over = (e) => e.preventDefault();
    const enter = (e) => {
      if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
      depth += 1;
      setDragging(true);
    };
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    const drop = (e) => {
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (e.dataTransfer?.files?.length) send(e.dataTransfer.files);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  const done = queue.filter((q) => q.state === 'done').length;
  const failed = queue.filter((q) => q.state === 'error').length;

  return (
    <>
      <Seo title="Add Media File" noindex />

      <div className="mb-4 flex items-center gap-1.5 text-[12.5px] text-adm-mute">
        <Link to="/admin/media" className="hover:text-navy hover:underline">Media</Link>
        <span>›</span>
        <span className="text-adm-ink">Add Media File</span>
      </div>

      <ScreenHeader title="Add Media File" action="Back to library" actionTo="/admin/media" />

      <div
        className={`ad-card flex flex-col items-center justify-center gap-4 border-2 border-dashed px-6 py-20 text-center transition ${
          dragging ? 'border-navy bg-navy/5' : 'border-adm-line'
        }`}
      >
        <Upload size={28} className="text-adm-mute" />
        <p className="font-heading text-[19px] font-semibold text-adm-ink">Drop files to upload</p>
        <p className="text-[12.5px] text-adm-mute">or</p>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="ad-btn-primary">
          {busy ? 'Uploading…' : 'Select Files'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={pick} className="hidden" />
        <p className="text-[12px] text-adm-mute">
          {UPLOAD_HINT}
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-5">
          <div className="mb-2.5 flex flex-wrap items-center gap-3">
            <h2 className="text-[13.5px] font-semibold text-adm-ink">
              {queue.length} file{queue.length === 1 ? '' : 's'}
            </h2>
            {done > 0 && <span className="ad-chip bg-ok-soft text-ok">{done} uploaded</span>}
            {failed > 0 && <span className="ad-chip bg-rose-50 text-sale">{failed} failed</span>}
            <button type="button" onClick={() => setQueue([])} className="ad-btn-quiet ad-btn-sm ml-auto">
              Clear list
            </button>
            {done > 0 && (
              <button type="button" onClick={() => navigate('/admin/media')} className="ad-btn-ghost ad-btn-sm">
                Go to library
              </button>
            )}
          </div>

          <div className="ad-card overflow-hidden">
            <ul className="divide-y divide-adm-line">
              {queue.map((item) => (
                <li key={item.key} className="flex items-center gap-3 px-4 py-2.5">
                  {item.url
                    ? <img src={item.url} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-adm-line object-cover" />
                    : <span className="h-10 w-10 shrink-0 rounded-lg border border-adm-line bg-adm-soft" />}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-adm-ink">{item.name}</span>
                    <span className="block text-[11.5px] text-adm-mute">
                      {fileSize(item.size)}{item.message ? ` · ${item.message}` : ''}
                    </span>
                  </span>

                  {item.state === 'done' && <span className="ad-chip shrink-0 bg-ok-soft text-ok"><Check size={11} /> Done</span>}
                  {item.state === 'uploading' && <span className="ad-chip shrink-0 bg-info-soft text-info">Uploading…</span>}
                  {item.state === 'waiting' && <span className="ad-chip shrink-0 bg-adm-soft text-adm-mute">Waiting</span>}
                  {item.state === 'error' && <span className="ad-chip shrink-0 bg-rose-50 text-sale"><Close size={11} /> Failed</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {failed > 0 && (
        <div className="mt-4">
          <Notice tone="warning">
            Some files were not uploaded. Images must be JPG, PNG, WEBP or AVIF.
          </Notice>
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[90] grid place-items-center bg-navy/70 p-8">
          <p className="rounded-2xl border-2 border-dashed border-white/60 px-10 py-14 text-center font-heading text-[20px] font-semibold text-white">
            Drop to upload
          </p>
        </div>
      )}
    </>
  );
}
