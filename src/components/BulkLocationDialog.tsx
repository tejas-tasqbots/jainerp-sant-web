import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api, { apiError } from '../lib/api';
import { displayName } from '../lib/ascetic';
import { StateSelect, CitySelect } from './GeoSelect';
import { LocationPicker } from './LocationPicker';
import type { MaharajProfile } from '../types';

interface BulkResult {
  updated: number;
  skipped: number;
  errors: Array<{ sant_id: string; code: string; message: string }>;
}

/**
 * Record one stay against several ascetics — a sangh travelling together.
 *
 * WHY THIS SCREEN EXISTS. Ascetics travel as a group: a Muni with four
 * shishyas and two Aryikas arrive in one town on one day and stay in one
 * place. One person usually represents all of them, and before this they had
 * to open seven profiles and retype the same place, city, dates and map pin
 * into each — the daily action this portal exists for, multiplied by the size
 * of the sangh. Every retype is a chance to put one member of a group in the
 * wrong town.
 *
 * PARTIAL SUCCESS IS SHOWN, NOT HIDDEN. The API attempts each profile
 * independently and reports which ones it could not update; this dialog stays
 * open on a partial result and names them, because "5 of 7 updated" with no
 * indication of which two is worse than an outright failure.
 */
export function BulkLocationDialog({
  profiles,
  onClose,
  onDone,
}: {
  profiles: MaharajProfile[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [partial, setPartial] = useState<BulkResult | null>(null);
  const [form, setForm] = useState({
    place: '', city: '', state: '', from_date: '', to_date: '',
    chaturmas: false, notes: '',
    lat: null as number | null, lng: null as number | null,
  });

  const nameOf = (id: string) =>
    displayName(profiles.find((p) => p.id === id), lang) || id.slice(0, 8);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (profiles.length === 0) { setError(t('sant.bulkNone')); return; }
    setSaving(true); setError(''); setPartial(null);
    try {
      const res = await api.post('/sant/locations/bulk', {
        sant_ids: profiles.map((p) => p.id),
        place: form.place,
        city: form.city,
        state: form.state,
        chaturmas: form.chaturmas,
        from_date: form.from_date || undefined,
        to_date: form.to_date || undefined,
        notes: form.notes || undefined,
        lat: form.lat ?? undefined,
        lng: form.lng ?? undefined,
      }) as BulkResult;

      if (res.skipped > 0) {
        // Deliberately does NOT close. The rep needs to see which profiles were
        // left behind and decide what to do about them.
        setPartial(res);
      } else {
        onDone();
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="card w-full max-w-2xl my-8">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-navy-800">{t('sant.bulkTitle')}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label={t('ui.cancel')}>×</button>
        </div>
        <p className="text-xs text-slate-500 mb-3">{t('sant.bulkHelp')}</p>

        {/* Who this is about, spelled out. A bulk action whose targets are only
            a count is one the rep has to trust blindly. */}
        <div className="mb-4 rounded-lg bg-navy-50 border border-navy-100 p-3">
          <p className="text-xs font-medium text-navy-900 mb-1">
            {t('sant.selectedCount', { count: profiles.length })}
          </p>
          <p className="text-xs text-navy-700 leading-relaxed">
            {profiles.map((p) => displayName(p, lang)).join(' · ')}
          </p>
        </div>

        {partial && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900 mb-1">
              {t('sant.bulkPartial', { updated: partial.updated, skipped: partial.skipped })}
            </p>
            <ul className="text-xs text-amber-800 space-y-0.5">
              {partial.errors.map((err) => (
                <li key={err.sant_id}>{nameOf(err.sant_id)} — {err.message}</li>
              ))}
            </ul>
            <button onClick={onDone} className="mt-2 text-xs text-navy-700 hover:text-navy-900 underline">
              {t('ui.cancel')}
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="bulk-place" className="label">{t('ui.placeTempleReq')}</label>
            <input id="bulk-place" className="input" required value={form.place}
              onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('ui.state')}</label>
              <StateSelect value={form.state} onChange={(s) => setForm((f) => ({ ...f, state: s, city: '' }))} />
            </div>
            <div>
              <label className="label">{t('ui.city')}</label>
              <CitySelect state={form.state} value={form.city} onChange={(c) => setForm((f) => ({ ...f, city: c }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bulk-from" className="label">{t('ui.fromDate')}</label>
              <input id="bulk-from" type="date" className="input" value={form.from_date}
                onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="bulk-to" className="label">{t('ui.toDate')}</label>
              <input id="bulk-to" type="date" className="input" value={form.to_date}
                onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.chaturmas}
              onChange={(e) => setForm((f) => ({ ...f, chaturmas: e.target.checked }))} />
            {t('ui.chaturmasStay')}
          </label>
          <div>
            <label htmlFor="bulk-notes" className="label">{t('ui.notes')}</label>
            <textarea id="bulk-notes" className="input" rows={2} value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <LocationPicker lat={form.lat} lng={form.lng}
            onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || profiles.length === 0} className="btn-primary">
              {saving ? t('ui.saving') : t('ui.updateLocation')}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">{t('ui.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
