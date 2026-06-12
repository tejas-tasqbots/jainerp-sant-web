import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import type { Broadcast } from '../../types';

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BroadcastPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [form, setForm] = useState({ title: '', message: '', type: 'announcement', link: '' });

  useEffect(() => {
    if (!id) return;
    api.get(`/maharaj/${id}/broadcast`)
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
      const res = await api.post(`/maharaj/${id}/broadcast`, {
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
    <div className="max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
        <h1 className="page-title">Broadcast</h1>
        <p className="page-subtitle">Send a message to all followers (max 5 per day)</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">New Broadcast</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Pravachan at Shantinath Mandir" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input" rows={4} placeholder="Join us for evening pravachan at 6PM. All are welcome." value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="announcement">Announcement</option>
                <option value="event">Event</option>
                <option value="location">Location Update</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="label">Link (optional)</label>
              <input className="input" placeholder="https://…" value={form.link}
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
        <h2 className="font-semibold text-navy-800 mb-4">Recent Broadcasts</h2>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && broadcasts.length === 0 && <p className="text-sm text-gray-500">No broadcasts sent yet</p>}
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
