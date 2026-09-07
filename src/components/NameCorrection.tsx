import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api, { apiError } from '../lib/api';
import { useToast } from './kit';
import type { MaharajProfile } from '../types';

interface ChangeRequest {
  id: string;
  field: string;
  current_value: string | null;
  requested_value: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  requested_at: string;
  review_note?: string | null;
}

/**
 * The fields this card offers a "Request a correction" button for.
 *
 * Deliberately still four, even though the queue now holds two dozen. The rest
 * are edited on the profile form above, which files its own requests on save —
 * offering a second, one-field-at-a-time path to the same thing would be two
 * ways to do one job, and the slower one.
 *
 * These four keep their own button because they are shown READ-ONLY in the
 * hero and have no field on the form to type into.
 */
const FIELDS = [
  { key: 'name_en', labelKey: 'sant.nameEn' },
  { key: 'name_hi', labelKey: 'sant.nameHi' },
  { key: 'samuday', labelKey: 'ui.samuday' },
  { key: 'guru_name', labelKey: 'ui.guruName' },
] as const;

/**
 * How to name a field in the pending / decided lists.
 *
 * The lists render whatever the queue returns, which since 2026-09 is any of
 * the profile's columns — so without this a representative reads
 * "name_before_diksha → …" and "sub_sect → …" in the app, which is the
 * database talking rather than the product.
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  name_en: 'Name (English)',
  name_hi: 'Name (Hindi)',
  type: 'Rank',
  pad: 'Post held',
  sect: 'Sect',
  sub_sect: 'Gaccha / panth',
  samuday: 'Samuday',
  guru_name: 'Guru',
  lineage: 'Lineage',
  diksha_year: 'Diksha year',
  diksha_date: 'Diksha date',
  diksha_place: 'Diksha place',
  birth_date: 'Birth date',
  tithi_note: 'Tithi',
  name_before_diksha: 'Name before diksha',
  fathers_name: "Father's name",
  mothers_name: "Mother's name",
  education: 'Study',
  honours: 'Conferred titles',
  bio: 'Short bio',
  about: 'About',
  languages: 'Languages',
  samadhi_date: 'Samadhi date',
  photo: 'Photograph',
};

const fieldLabel = (key: string) => FIELD_LABELS[key] ?? key;

/**
 * The name, in both scripts, and the way to get it corrected.
 *
 * WHY THE NAME IS NOT AN EDIT BOX. Devotees follow a specific Maharaj Saheb by
 * name — it is what appears beside every vihar update and broadcast. Letting a
 * sangh representative silently rename a profile would let a following built under
 * one identity be pointed at another, so the name belongs to the Super Admin
 * and a correction is reviewed before it goes live (migration 044).
 *
 * WHY THIS SCREEN EXISTS ANYWAY. "You cannot change this" on its own produces a
 * support call. The sangh representative is usually the one person who knows the
 * correct Devanagari spelling, so they type it here, it is reviewed, and what
 * gets applied is exactly the value that was read.
 */
export function NameCorrection({
  profileId,
  profile,
}: {
  profileId: string;
  profile: MaharajProfile;
  /** Called after a request is filed, so the parent can refresh if it wants to. */
  onChanged?: () => void;
}) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [openField, setOpenField] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const load = useCallback(() => {
    api.get(`/sant/${profileId}/change-requests`)
      .then((d: any) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => { /* the read-only names above are still useful without this */ });
  }, [profileId]);
  useEffect(load, [load]);

  const pending = requests.filter((r) => r.status === 'pending');
  const pendingFor = (field: string) => pending.find((r) => r.field === field);

  function currentValue(field: string): string {
    const v = (profile as unknown as Record<string, unknown>)[field];
    return typeof v === 'string' ? v : '';
  }

  function openFor(field: string) {
    setOpenField(field);
    // Seeded with what is on file, so a one-character fix is a one-character
    // edit rather than retyping a long name from scratch.
    setValue(currentValue(field));
    setReason('');
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!openField) return;
    if (!value.trim()) { setError(t('reps.invalidMobile', { defaultValue: 'Enter a value' })); return; }
    setBusy(true); setError('');
    try {
      await api.post(`/sant/${profileId}/change-requests`, {
        field: openField,
        requested_value: value.trim(),
        reason: reason.trim() || undefined,
      });
      setOpenField(null);
      load();
      toast.show(t('sant.correctionSent'));
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(req: ChangeRequest) {
    try {
      await api.delete(`/sant/${profileId}/change-requests/${req.id}`);
      load();
    } catch (e) {
      toast.show(apiError(e), 'bad');
    }
  }

  return (
    <div className="card mb-6">
      {toast.node}
      <h3 className="font-semibold text-navy-800 mb-1">{t('sant.nameLockedTitle')}</h3>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{t('sant.nameLockedHelp')}</p>

      <div className="space-y-2">
        {FIELDS.map((f) => {
          const open = pendingFor(f.key);
          const current = currentValue(f.key);
          return (
            <div key={f.key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{t(f.labelKey)}</p>
                <p className={`text-sm ${current ? 'text-gray-800 font-medium' : 'text-slate-400 italic'}`}>
                  {current || t('sant.notRecorded')}
                </p>
                {open && (
                  <p className="text-xs text-amber-700 mt-1">
                    {t('sant.pendingCorrections')}: <strong>{open.requested_value}</strong>
                  </p>
                )}
              </div>
              {open ? (
                <button onClick={() => withdraw(open)} className="text-xs text-slate-500 hover:text-slate-700">
                  {t('reps.withdraw')}
                </button>
              ) : (
                <button onClick={() => openFor(f.key)} className="text-xs text-navy-700 hover:text-navy-900 whitespace-nowrap">
                  {t('sant.requestCorrection')}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {openField && (
        <form onSubmit={submit} className="mt-4 rounded-lg border border-navy-100 bg-navy-50 p-3 space-y-3">
          <p className="text-xs font-semibold text-navy-900">
            {t('sant.correctionFor', {
              field: FIELDS.some((f) => f.key === openField)
                ? t(FIELDS.find((f) => f.key === openField)!.labelKey)
                : fieldLabel(openField),
            })}
          </p>
          <div>
            <label htmlFor="correction-value" className="label">{t('sant.correctValue')}</label>
            <input id="correction-value" className="input" value={value}
              onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <div>
            <label htmlFor="correction-reason" className="label">{t('sant.correctionReason')}</label>
            <input id="correction-reason" className="input" value={reason}
              onChange={(e) => setReason(e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary text-xs py-1.5">
              {busy ? t('reps.working') : t('sant.requestCorrection')}
            </button>
            <button type="button" onClick={() => setOpenField(null)} className="btn-outline text-xs py-1.5">
              {t('ui.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* ── EVERYTHING AWAITING REVIEW ──────────────────────────────────────
          The four rows above show pending corrections for their OWN field.
          Since the profile form started filing requests too, most of what a
          representative is waiting on is not one of those four — and with no
          list of it, saving the form produced a toast and then, as far as the
          app showed, nothing at all. That reads as a change that did not
          happen, and the second thing a representative does about it is submit
          it again. */}
      {requests.some((r) => r.status === 'pending'
        && !FIELDS.some((f) => f.key === r.field)) && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="mb-1.5 text-xs font-semibold text-amber-900">
            {t('sant.awaitingApproval')}
          </p>
          <div className="space-y-1">
            {requests
              .filter((r) => r.status === 'pending' && !FIELDS.some((f) => f.key === r.field))
              .map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3">
                  <p className="min-w-0 text-xs text-amber-900">
                    {fieldLabel(r.field)} →{' '}
                    <strong className="break-words">{r.requested_value}</strong>
                  </p>
                  <button
                    onClick={() => withdraw(r)}
                    className="whitespace-nowrap text-xs text-amber-700 hover:text-amber-900"
                  >
                    {t('reps.withdraw')}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Decided requests, so a rejection with a reason is visible rather than
          the request simply disappearing from the list. */}
      {requests.some((r) => r.status !== 'pending') && (
        <div className="mt-4 space-y-1">
          {requests.filter((r) => r.status !== 'pending').slice(0, 5).map((r) => (
            <p key={r.id} className="text-xs text-slate-500">
              {fieldLabel(r.field)} → <strong>{r.requested_value}</strong> · {r.status}
              {r.review_note ? ` — ${r.review_note}` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
