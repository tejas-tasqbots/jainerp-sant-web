import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import type { ViharEntry } from '../../types';

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ViharPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ViharEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ expected_from: '', expected_to: '', place: '', city: '', state: '', notes: '' });

  useEffect(() => {
    if (!id) return;
    api.get(`/maharaj/${id}/vihar-plan`)
      .then((data: any) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const added = await api.post(`/maharaj/${id}/vihar-plan`, {
        place: form.place,
        city: form.city || undefined,
        state: form.state,
        expected_from: form.expected_from,
        expected_to: form.expected_to || undefined,
        notes: form.notes || undefined,
      }) as any;
      const newEntry: ViharEntry = { ...added, created_at: added.created_at ?? new Date().toISOString() };
      setEntries((prev) => [...prev, newEntry].sort((a, b) =>
        a.expected_from.localeCompare(b.expected_from)));
      setForm({ expected_from: '', expected_to: '', place: '', city: '', state: '', notes: '' });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!confirm('Delete this vihar entry?')) return;
    try {
      await api.delete(`/maharaj/${id}/vihar-plan/${entryId}`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (e) {
      alert(apiError(e));
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
        <h1 className="page-title">Vihar Plan</h1>
        <p className="page-subtitle">Journey / travel schedule visible to devotees</p>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">Add Stop</h2>
        <form onSubmit={addEntry} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Expected From *</label>
              <input className="input" type="date" value={form.expected_from}
                onChange={(e) => setForm((f) => ({ ...f, expected_from: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Expected To</label>
              <input className="input" type="date" value={form.expected_to}
                onChange={(e) => setForm((f) => ({ ...f, expected_to: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Place *</label>
              <input className="input" placeholder="Palitana" value={form.place}
                onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} required />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Palitana" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="label">State *</label>
              <input className="input" placeholder="Gujarat" value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Adding…' : 'Add Stop'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-800 mb-4">Upcoming Journey</h2>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && entries.length === 0 && <p className="text-sm text-gray-500">No vihar plan entries yet</p>}
        <div className="relative">
          {entries.length > 1 && (
            <div className="absolute left-2.5 top-4 bottom-4 w-0.5 bg-gray-200" />
          )}
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4">
                <div className="w-5 h-5 rounded-full bg-navy-600 flex-shrink-0 mt-0.5 relative z-10" />
                <div className="flex-1 card !py-3 !px-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        {entry.place}{entry.city && entry.city !== entry.place ? `, ${entry.city}` : ''}, {entry.state}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(entry.expected_from)}
                        {entry.expected_to && ` → ${formatDate(entry.expected_to)}`}
                      </p>
                      {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                    </div>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="text-gray-400 hover:text-danger-500 text-sm ml-2">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
