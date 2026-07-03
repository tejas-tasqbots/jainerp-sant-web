import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { LocationPicker } from '../../components/LocationPicker';
import { StateSelect, CitySelect } from '../../components/GeoSelect';
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
  const [proposals, setProposals] = useState<any[]>([]);
  const [acting, setActing] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/maharaj/${id}/location`)
      .then((data: any) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadProposals();
  }, [id]);

  function loadProposals() {
    if (!id) return;
    api.get(`/maharaj/${id}/location/proposals?status=pending`)
      .then((data: any) => setProposals(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  async function decideProposal(proposalId: string, action: 'approve' | 'reject') {
    setActing(proposalId);
    try {
      await api.patch(`/maharaj/${id}/location/proposals/${proposalId}/${action}`, {});
      setProposals((p) => p.filter((x) => x.id !== proposalId));
      if (action === 'approve') {
        // Approved proposal becomes the current location — refresh history.
        const data: any = await api.get(`/maharaj/${id}/location`);
        setHistory(Array.isArray(data) ? data : []);
        setNotice('Proposal approved — it is now your current location.');
      } else {
        setNotice('Proposal rejected.');
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setActing('');
    }
  }

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

      {/* Proposals from mandirs awaiting approval */}
      {proposals.length > 0 && (
        <div className="card mb-6 border-2 border-amber-200 bg-amber-50/50">
          <h2 className="font-semibold text-navy-800 mb-1">Location updates proposed by mandirs</h2>
          <p className="text-xs text-gray-500 mb-4">A mandir has reported a location for you. Approve to make it your current location, or reject.</p>
          <div className="space-y-3">
            {proposals.map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-amber-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.place}</p>
                    <p className="text-xs text-gray-500">{[p.city, p.state].filter(Boolean).join(', ')}</p>
                    {(p.from_date || p.to_date) && (
                      <p className="text-xs text-gray-400">{formatDate(p.from_date)} {p.to_date && `→ ${formatDate(p.to_date)}`}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Proposed by {p.tenant_name}{p.proposed_by_name ? ` · ${p.proposed_by_name}` : ''}</p>
                    {p.notes && <p className="text-xs text-gray-500 mt-1 italic">{p.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button disabled={acting === p.id} onClick={() => decideProposal(p.id, 'approve')} className="btn-primary text-xs px-3 py-1.5">
                    {acting === p.id ? '…' : 'Approve'}
                  </button>
                  <button disabled={acting === p.id} onClick={() => decideProposal(p.id, 'reject')} className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <label className="label">State *</label>
              <StateSelect value={form.state} onChange={(s) => setForm((f) => ({ ...f, state: s, city: '' }))} />
            </div>
            <div>
              <label className="label">City *</label>
              <CitySelect state={form.state} value={form.city} onChange={(c) => setForm((f) => ({ ...f, city: c }))} />
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
          <LocationPicker
            lat={form.lat ? Number(form.lat) : null}
            lng={form.lng ? Number(form.lng) : null}
            onChange={(la, ln) => setForm((f) => ({ ...f, lat: String(la), lng: String(ln) }))}
          />
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
