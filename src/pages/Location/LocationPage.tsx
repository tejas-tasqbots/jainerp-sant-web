import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import type { Location } from '../../types';

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LocationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    place: '', city: '', state: '',
    from_date: '', to_date: '', chaturmas: false, notes: '',
    lat: '', lng: '',
  });

  useEffect(() => {
    if (!id) return;
    api.get(`/maharaj/${id}/location`)
      .then((data: any) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        place: form.place, city: form.city, state: form.state,
        chaturmas: form.chaturmas,
        from_date: form.from_date || undefined,
        to_date: form.to_date || undefined,
        notes: form.notes || undefined,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      };
      const added = await api.put(`/maharaj/${id}/location`, payload) as any;
      const newLoc: import('../../types').Location = { ...added, is_current: true, created_at: new Date().toISOString() };
      setHistory((h) => [newLoc, ...h.map((l) => ({ ...l, is_current: false }))]);
      setNotice(`Location updated — ${added.followers_notified ?? 0} follower(s) notified`);
      setForm({ place: '', city: '', state: '', from_date: '', to_date: '', chaturmas: false, notes: '', lat: '', lng: '' });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
        <h1 className="page-title">Update Location</h1>
        <p className="page-subtitle">Setting a new location notifies all followers</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">Set Current Location</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Place / Temple Name *</label>
            <input className="input" placeholder="Shantinath Jain Mandir" value={form.place}
              onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City *</label>
              <input className="input" placeholder="Ahmedabad" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
            </div>
            <div>
              <label className="label">State *</label>
              <input className="input" placeholder="Gujarat" value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">From Date</label>
              <input className="input" type="date" value={form.from_date}
                onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">To Date</label>
              <input className="input" type="date" value={form.to_date}
                onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="chaturmas" className="rounded" checked={form.chaturmas}
              onChange={(e) => setForm((f) => ({ ...f, chaturmas: e.target.checked }))} />
            <label htmlFor="chaturmas" className="text-sm text-gray-700">Chaturmas Stay</label>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input className="input" type="number" step="any" placeholder="23.0225" value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input className="input" type="number" step="any" placeholder="72.5714" value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </div>
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {notice && <p className="text-sm text-cta-600">{notice}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5">
            {saving ? 'Updating…' : 'Update Location'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="font-semibold text-navy-800 mb-4">Location History</h2>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {history.length === 0 && !loading && <p className="text-sm text-gray-500">No location history yet</p>}
        <div className="space-y-3">
          {history.map((loc) => (
            <div key={loc.id} className={`flex items-start gap-3 p-3 rounded-lg ${loc.is_current ? 'bg-navy-50 border border-navy-200' : 'bg-gray-50'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${loc.is_current ? 'bg-navy-600' : 'bg-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">{loc.place}</p>
                <p className="text-xs text-gray-500">{loc.city}, {loc.state}</p>
                {(loc.from_date || loc.to_date) && (
                  <p className="text-xs text-gray-400">{formatDate(loc.from_date)} {loc.to_date && `→ ${formatDate(loc.to_date)}`}</p>
                )}
                {loc.chaturmas && <span className="badge-accent mt-1">Chaturmas</span>}
              </div>
              {loc.is_current && <span className="ml-auto badge-navy text-xs">Current</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
