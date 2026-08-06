import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { ASCETIC_TYPES, SECTS, subSectsFor } from '../../lib/ascetic'
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function NewProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate();
  const { setAuth, user, access_token, refresh_token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // One profile per login — if this account already has one, send them to it.
  useEffect(() => {
    api.get('/sant/mine')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        if (list.length >= 1) navigate(`/profiles/${list[0].id}`, { replace: true });
      })
      .catch(() => {});
  }, [navigate]);

  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'muni',
    sect: '',
    sub_sect: '',
    samuday: '',
    diksha_year: '',
    guru_name: '',
    bio: '',
    languages: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const langs = form.languages.split(',').map((l) => l.trim()).filter(Boolean);
      const res = await api.post('/sant', {
        name: form.name,
        type: form.type,
        samuday: form.samuday,
        // The form has always had a Sampradaya picker but never sent it, so
        // every profile registered here arrived with sect NULL and landed on
        // the super admin's "sect not set" backfill list. `|| undefined`
        // because the DTO validates against the two sects — '' would 400.
        sect: form.sect || undefined,
        sub_sect: form.sub_sect || undefined,
        diksha_year: form.diksha_year ? parseInt(form.diksha_year) : undefined,
        guru_name: form.guru_name || undefined,
        bio: form.bio || undefined,
        languages: langs.length ? langs : undefined,
      }) as any;
      // Refresh auth to pick up the new maharaj_id (refresh response includes sant_ids)
      if (user && access_token && refresh_token) {
        try {
          const refreshed = await api.post('/auth/refresh', { refresh_token }) as any;
          setAuth({
            user: { ...user, sant_ids: refreshed.sant_ids ?? [] },
            access_token: refreshed.access_token ?? access_token,
            refresh_token,
            sant_ids: refreshed.sant_ids ?? [],
          });
        } catch {}
      }
      navigate(`/profiles/${res.id}`);
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          ← Back
        </button>
        <h1 className="page-title">{t('ui.registerNewProfile')}</h1>
        <p className="page-subtitle">{t('ui.verifyNote')}</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newpro-full-name" className="label">{t('ui.fullNameReq')}</label>
            <input id="newpro-full-name" className="input" placeholder="Acharya Shri Yashovijayji" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="newpro-type" className="label">{t('ui.typeReq')}</label>
            <select id="newpro-type" className="input" value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {ASCETIC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.title} · {t.rank}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="newpro-samuday-community" className="label">{t('ui.samudayReq')}</label>
            <input id="newpro-samuday-community" className="input" placeholder="e.g. Oswal, Porwal, Agarwal" value={form.samuday}
              onChange={(e) => setForm((f) => ({ ...f, samuday: e.target.value }))} required />
          </div>
          <div>
            {/* Sect is a separate field from samuday: sampradaya vs community. */}
            <label htmlFor="newpro-sect-sampradaya" className="label">{t('ui.sect')}</label>
            <select id="newpro-sect-sampradaya" className="input" value={form.sect ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, sect: e.target.value, sub_sect: '' }))}>
              <option value="">—</option>
              {SECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {/* Panth/gaccha, offered only once a sect is chosen — the lists differ
              by tradition. Free text on the server by design, so the common
              options are a convenience, not the whole set. */}
          {form.sect && (
            <div>
              <label htmlFor="newpro-sub-sect" className="label">{t('ui.panthGaccha')}</label>
              <select id="newpro-sub-sect" className="input" value={form.sub_sect ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, sub_sect: e.target.value }))}>
                <option value="">—</option>
                {subSectsFor(form.sect).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="newpro-diksha-year" className="label">{t('ui.dikshaYear')}</label>
              <input id="newpro-diksha-year" className="input" type="number" min={1900} max={2025} placeholder="e.g. 1998"
                value={form.diksha_year}
                onChange={(e) => setForm((f) => ({ ...f, diksha_year: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="newpro-guru-name" className="label">{t('ui.guruName')}</label>
              <input id="newpro-guru-name" className="input" placeholder={t('ui.guruNamePh')} value={form.guru_name}
                onChange={(e) => setForm((f) => ({ ...f, guru_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="newpro-bio" className="label">Bio</label>
            <textarea id="newpro-bio" className="input" rows={3} placeholder={t('ui.briefDescPh')} value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="newpro-languages-comma-separate" className="label">{t('ui.languagesCsv')}</label>
            <input id="newpro-languages-comma-separate" className="input" placeholder="gujarati, hindi, sanskrit" value={form.languages}
              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-outline">{t('ui.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
