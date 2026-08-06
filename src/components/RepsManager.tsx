import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import api, { apiError } from '../lib/api';
import { isValidPhone, PhoneInput } from './PhoneInput';

interface CoRep { id: string; mobile: string; name?: string | null; linked: boolean }
interface RepsData {
  primary: { mobile: string; name?: string | null } | null;
  co_reps: CoRep[];
}

/**
 * Manage the mobile numbers that can log in and co-manage this one profile.
 * One profile per login, but a profile can be shared by several people
 * (family / shishyas / office bearers) — each with their own mobile.
 */
export function RepsManager({ maharajId }: { maharajId: string }) {
  const { t } = useTranslation()
  const [data, setData] = useState<RepsData | null>(null);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api.get(`/sant/${maharajId}/reps`)
      .then((d: any) => setData(d))
      .catch((e) => setError(apiError(e)));
  }
  useEffect(load, [maharajId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidPhone(mobile)) { setError('Enter a valid mobile number'); return; }
    setBusy(true); setError('');
    try {
      await api.post(`/sant/${maharajId}/reps`, { mobile, name: name || undefined });
      setMobile(''); setName('');
      load();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(repId: string) {
    if (!confirm('Remove this representative? They will lose access to this profile.')) return;
    try {
      await api.delete(`/sant/${maharajId}/reps/${repId}`);
      load();
    } catch (e) {
      setError(apiError(e));
    }
  }

  return (
    <div className="card mb-6">
      <h3 className="font-semibold text-navy-800 mb-1">{t('ui.representatives')}</h3>
      <p className="text-xs text-gray-500 mb-4">
        People who can log in with their own mobile number and manage this profile. There is one profile —
        these are additional logins that share it.
      </p>

      <div className="space-y-2 mb-4">
        {data?.primary && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-navy-50 border border-navy-100">
            <div className="w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">
              {(data.primary.name || 'P')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{data.primary.name || 'Primary representative'}</p>
              <p className="text-xs text-gray-500">{data.primary.mobile}</p>
            </div>
            <span className="badge-navy text-[10px]">{t('ui.primary')}</span>
          </div>
        )}
        {data?.co_reps.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 text-xs font-bold flex items-center justify-center">
              {(r.name || r.mobile.replace('+', ''))[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{r.name || 'Co-representative'}</p>
              <p className="text-xs text-gray-500">{r.mobile} {r.linked ? '' : '· invited (not logged in yet)'}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-xs text-red-500 hover:text-red-700">{t('ui.remove')}</button>
          </div>
        ))}
        {data && data.co_reps.length === 0 && (
          <p className="text-xs text-gray-400 px-1">{t('ui.noCoReps')}</p>
        )}
      </div>

      <form onSubmit={add} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="label">{t('ui.nameOpt')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shishya name" />
        </div>
        <div className="flex-1">
          <label className="label">{t('ui.mobileNumber')}</label>
          <PhoneInput value={mobile} onChange={setMobile} />
        </div>
        <button type="submit" disabled={busy} className="btn-primary whitespace-nowrap">{busy ? 'Adding…' : 'Add Rep'}</button>
      </form>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
