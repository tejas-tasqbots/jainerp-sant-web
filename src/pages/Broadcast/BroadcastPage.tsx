import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { PageHeader } from '../../components/kit';
import type { Broadcast } from '../../types';

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BroadcastPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', link: '' });

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}/broadcast`)
      .then((data: any) => setBroadcasts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    setSent('');
    try {
      const res = await api.post(`/sant/${id}/broadcast`, {
        title: form.title,
        message: form.message,
        type: form.type,
        link: form.link || undefined,
      }) as any;
      setSent(`Broadcast sent to ${res.notified_count} followers`);
      setBroadcasts((prev) => [{
        id: res.broadcast_id, title: form.title, message: form.message,
        type: form.type, link: form.link || undefined, created_at: new Date().toISOString(),
      }, ...prev]);
      setForm({ title: '', message: '', type: 'announcement', link: '' });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('ui.broadcast')} subtitle={t('ui.broadcastHelp')} />

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.newBroadcast')}</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="broadc-title" className="label">{t('ui.titleReq')}</label>
            <input id="broadc-title" className="input" placeholder={t('ui.broadcastTitlePh')} value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="broadc-message" className="label">{t('ui.messageReq')}</label>
            <textarea id="broadc-message" className="input" rows={4} placeholder={t('ui.broadcastBodyPh')} value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="broadc-type" className="label">Type</label>
              <select id="broadc-type" className="input" value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="announcement">{t('ui.announcement')}</option>
                <option value="event">{t('ui.event')}</option>
                <option value="location">{t('ui.locationUpdate')}</option>
                <option value="general">{t('ui.general')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="broadc-link-optional" className="label">{t('ui.linkOpt')}</label>
              <input id="broadc-link-optional" className="input" placeholder="https://…" value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {sent && <p className="text-sm text-cta-600">{sent}</p>}
          <button type="submit" disabled={sending} className="btn-brand w-full py-2.5">
            {sending ? 'Sending…' : '📢 Send Broadcast'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.recentBroadcasts')}</h2>
        {loading && <p className="text-sm text-gray-500">{t('ui.loading')}</p>}
        {!loading && broadcasts.length === 0 && <p className="text-sm text-gray-500">{t('ui.noBroadcasts')}</p>}
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <div key={b.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <p className="font-medium text-sm text-gray-800">{b.title}</p>
                <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{timeAgo(b.created_at)}</span>
              </div>
              <p className="text-xs text-gray-600">{b.message}</p>
              <span className="badge-navy mt-2 text-[10px]">{b.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
