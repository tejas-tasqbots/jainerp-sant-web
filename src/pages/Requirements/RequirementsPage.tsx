import { useEffect, useState } from 'react';
import { StateSelect, CitySelect } from '../../components/GeoSelect';
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { PageHeader, useToast } from '../../components/kit';
import { almsLabel } from '../../lib/ascetic';
import type { Requirement } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  open: 'badge-red',
  in_progress: 'badge-accent',
  fulfilled: 'badge-green',
};

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  chuka: { label: 'Chuka', icon: '🍛' },
  gochari: { label: 'Gochari', icon: '🥣' },
  medical: { label: 'Medical', icon: '💊' },
  stay: { label: 'Stay', icon: '🏠' },
  travel_support: { label: 'Travel Support', icon: '🚶' },
  other: { label: 'Other', icon: '📌' },
};

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RequirementsPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>();
  // Alms terminology depends on the profile's sect (Aahar Charya vs Gochari).
  const [sect, setSect] = useState<string | null>(null);
  const [items, setItems] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [notice, setNotice] = useState('');
  /** Drives the city dropdown only — a requirement stores just the city. */
  const [cityState, setCityState] = useState('');
  const [form, setForm] = useState({
    type: 'chuka', description: '', needed_on: '', city: '',
    visibility: 'followers_and_temples',
  });

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}`).then((p: any) => setSect(p?.sect ?? null)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}/requirements`)
      .then((data: any) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function addRequirement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const added = await api.post(`/sant/${id}/requirements`, {
        type: form.type,
        description: form.description,
        needed_on: form.needed_on || undefined,
        city: form.city || undefined,
        visibility: form.visibility,
      }) as any;
      const newItem: Requirement = {
        id: added.id, type: form.type as Requirement['type'], description: form.description,
        needed_on: form.needed_on || undefined, city: form.city || undefined,
        visibility: form.visibility, status: 'open', created_at: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      if (added.notified > 0) setNotice(`Requirement posted — ${added.notified} follower(s) notified`);
      toast.show(added.notified > 0
        ? `Requirement posted — ${added.notified} follower(s) notified.`
        : 'Requirement posted.');
      setForm({ type: 'chuka', description: '', needed_on: '', city: '', visibility: 'followers_and_temples' });
      setCityState('');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(reqId: string, status: string) {
    try {
      await api.patch(`/sant/${id}/requirements/${reqId}`, { status });
      setItems((prev) => prev.map((r) => r.id === reqId ? { ...r, status: status as any } : r));
      toast.show(`Marked as ${status}.`);
    } catch (e) {
      toast.show(apiError(e), 'bad');
    }
  }

  async function deleteReq(reqId: string) {
    if (!confirm('Delete this requirement?')) return;
    try {
      await api.delete(`/sant/${id}/requirements/${reqId}`);
      setItems((prev) => prev.filter((r) => r.id !== reqId));
      toast.show('Requirement deleted.');
    } catch (e) {
      toast.show(apiError(e), 'bad');
    }
  }

  return (
    <div>
      {toast.node}
      <PageHeader title={t('ui.requirements')} subtitle={t('ui.requirementsHelp')} />

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.postRequirement')}</h2>
        <form onSubmit={addRequirement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="requir-type" className="label">{t('ui.typeReq')}</label>
              <select id="requir-type" className="input" value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([val, t]) => (
                  <option key={val} value={val}>{almsLabel(val, sect) || t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="requir-needed-on" className="label">{t('ui.neededOn')}</label>
              <input id="requir-needed-on" className="input" type="date" value={form.needed_on}
                onChange={(e) => setForm((f) => ({ ...f, needed_on: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="requir-description" className="label">{t('ui.descriptionReq')}</label>
            <textarea id="requir-description" className="input" rows={2} required
              placeholder="e.g. Chuka required for 4 sadhus on 14 June, Adajan area"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* The API stores only `city` on a requirement, so `state` here is
                  a picker for the city list rather than something submitted —
                  which is why it is local state, not part of the form body. */}
              <label className="label">{t('ui.state')}</label>
              <StateSelect value={cityState} onChange={(v) => {
                setCityState(v);
                setForm((f) => ({ ...f, city: '' }));
              }} />
            </div>
            <div>
              <label className="label">{t('ui.city')}</label>
              <CitySelect state={cityState} value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
            </div>
            <div>
              <label htmlFor="requir-visibility" className="label">{t('ui.visibility')}</label>
              <select id="requir-visibility" className="input" value={form.visibility}
                onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}>
                <option value="followers_and_temples">{t('ui.followersTemples')}</option>
                <option value="temples_only">{t('ui.templesOnly')}</option>
                <option value="private">{t('ui.private')}</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {notice && <p className="text-sm text-cta-600">{notice}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Posting…' : 'Post Requirement'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.allRequirements')}<span className="ml-2 text-sm font-normal text-gray-500">({items.length})</span>
        </h2>
        {loading && <p className="text-sm text-gray-500">{t('ui.loading')}</p>}
        {!loading && items.length === 0 && <p className="text-sm text-gray-500">{t('ui.noRequirements')}</p>}
        <div className="space-y-3">
          {items.map((req) => (
            <div key={req.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl mt-0.5">{TYPE_LABELS[req.type]?.icon ?? '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-gray-800">{almsLabel(req.type, sect) || TYPE_LABELS[req.type]?.label || req.type}</p>
                  <span className={`${STATUS_COLORS[req.status]} text-[10px]`}>{req.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-600 mb-1">{req.description}</p>
                <p className="text-xs text-gray-400">
                  {req.needed_on && <>Needed on {formatDate(req.needed_on)}</>}
                  {req.city && <> · {req.city}</>}
                  {req.fulfilled_by && <> · Fulfilled by {req.fulfilled_by}</>}
                </p>
                <div className="flex gap-2 mt-2">
                  {req.status !== 'fulfilled' && (
                    <select
                      value={req.status}
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                      aria-label={t('ui.changeReqStatus')} title={t('ui.changeReqStatus')} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">{t('ui.inProgress')}</option>
                      <option value="fulfilled">{t('ui.fulfilled')}</option>
                    </select>
                  )}
                  <button onClick={() => deleteReq(req.id)} className="text-xs text-gray-400 hover:text-danger-500">{t('ui.delete')}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
