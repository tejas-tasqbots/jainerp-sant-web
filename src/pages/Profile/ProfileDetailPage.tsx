import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { almsLabel, ASCETIC_TYPES, asceticTitle, padsForType, SECTS, subSectsFor } from '../../lib/ascetic'
import { Link, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { compressImage } from '../../lib/imageCompress';
import { RepsManager } from '../../components/RepsManager';
import { PublicProfileEditor } from '../../components/PublicProfileEditor';
import { CalendarDays, ClipboardList, MapPin, Megaphone, Route, Users } from 'lucide-react';
import { ErrorPanel, Loading, PageHeader, useToast } from '../../components/kit';
import type { MaharajProfile } from '../../types';

export default function ProfileDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<MaharajProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<MaharajProfile>>({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}`)
      .then((data: any) => {
        setProfile(data);
        // Every editable field must be seeded here. A field rendered by the
        // form but missing from this list opens blank even when the profile
        // holds a value, which reads to the rep as data loss (DEF-SANT-03).
        setForm({ name: data.name, type: data.type, pad: data.pad ?? 'none',
          samuday: data.samuday,
          sect: data.sect, sub_sect: data.sub_sect,
          diksha_year: data.diksha_year, guru_name: data.guru_name, bio: data.bio,
          about: data.about, diksha_place: data.diksha_place, education: data.education,
          honours: data.honours, lineage: data.lineage,
          // <input type="date"> needs a bare YYYY-MM-DD; Postgres may send a
          // full timestamp, which the control silently rejects and shows empty.
          birth_date: data.birth_date?.slice(0, 10) ?? null,
          diksha_date: data.diksha_date?.slice(0, 10) ?? null,
          samadhi_date: data.samadhi_date?.slice(0, 10) ?? null,
          tithi_note: data.tithi_note });
      })
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // The whole form is sent, so an unset sect must be omitted rather than
      // sent as '' — the DTO validates against the two sects and would 400,
      // taking every other edit on the form down with it.
      const { sect, sub_sect, ...rest } = form;
      await api.patch(`/sant/${id}`, {
        ...rest,
        ...(sect ? { sect, sub_sect: sub_sect || undefined } : {}),
      });
      setProfile((p) => p ? { ...p, ...form } as MaharajProfile : p);
      setEditing(false);
      toast.show('Profile saved.');
    } catch (e) {
      // A toast, not an alert(): a browser dialog blocks the page and the rep
      // has to dismiss it before they can see which field the message is about.
      toast.show(apiError(e), 'bad');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Compress in the browser, then send a data: URI — the API stores it inline
   * rather than on disk, so photos survive redeploys and land in DB backups.
   * 800px/150KB per doc-v2/Images_And_Photos.md §5.2 (avatar + detail portrait).
   */
  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    try {
      const dataUri = await compressImage(file, { maxDim: 800, maxBytes: 150_000 });
      const res = await api.post(`/sant/${id}/photo`, { photo_base64: dataUri }) as any;
      setProfile((p) => p ? { ...p, photo_base64: res.photo_base64 } : p);
      toast.show('Photo updated.');
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setPhotoUploading(false);
    }
  }

  async function removePhoto() {
    if (!confirm('Remove this photo?')) return;
    setPhotoUploading(true);
    try {
      await api.delete(`/sant/${id}/photo`);
      setProfile((p) => p ? { ...p, photo_base64: undefined, photo_url: undefined } : p);
      toast.show('Photo removed.');
    } catch (e) {
      toast.show(apiError(e), 'bad');
    } finally {
      setPhotoUploading(false);
    }
  }

  if (loading) return <Loading label="Loading your profile…" />;
  if (error) return <ErrorPanel message={error} />;
  if (!profile) return null;

  return (
    <div>
      {toast.node}
      {/* The name lives in the hero below, so the page heading names the SCREEN
          instead of repeating it. */}
      <PageHeader
        title={t('ui.myProfile')}
        subtitle={t('ui.whatDevoteesSee')}
        back={false}
        actions={
          <button onClick={() => setEditing((v) => !v)} className="btn-outline">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        }
      />

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-navy-900 to-navy-700 p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative">
            {/* Inline photo wins over an external URL — matches the API read order. */}
            {(profile.photo_base64 || profile.photo_url) ? (
              <img src={profile.photo_base64 || profile.photo_url} alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                {profile.name[0]}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-cta rounded-full flex items-center justify-center text-white text-xs font-bold hover:bg-cta-hover"
              title={t('ui.changePhoto')}
            >
              {photoUploading ? '…' : '📷'}
            </button>
            {(profile.photo_base64 || profile.photo_url) && (
              <button
                onClick={removePhoto}
                disabled={photoUploading}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white/90 text-red-600 rounded-full flex items-center justify-center text-xs font-bold hover:bg-white"
                title={t('ui.removePhoto')}
              >
                ×
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" aria-label={t('ui.choosePhoto')} className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              {profile.verified ? (
                <span className="badge-green text-xs">✓ Verified</span>
              ) : (
                <span className="bg-yellow-400/20 text-yellow-200 badge text-xs">{t('ui.pendingVerification')}</span>
              )}
            </div>
            <p className="text-white/80 text-sm">{profile.samuday} · {profile.type_display ?? asceticTitle(profile.type)}</p>
            {profile.diksha_year && <p className="text-white/60 text-xs mt-0.5">Diksha {profile.diksha_year}</p>}
            <p className="text-white/60 text-xs mt-0.5">
              {profile.followers_count} {profile.followers_count === 1 ? 'follower' : 'followers'}
            </p>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-sm text-white/70">{profile.bio}</p>}
      </div>

      {/* Quick actions — icon + one line of "what this is for", so a rep opening
          the portal for the first time doesn't have to guess what "Vihar Plan"
          or "Requirements" will do. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Update Location', hint: 'Where you are staying now', to: `/profiles/${id}/location`, Icon: MapPin },
          { label: 'Vihar Plan', hint: 'Places you are travelling to', to: `/profiles/${id}/vihar`, Icon: Route },
          // The alms word follows the profile's sect, as it does on the
          // Requirements page itself and in the app: this tile was hardcoded to
          // the Digambara "Aahar", so a Shwetambar Sadhvi's own dashboard used
          // the other tradition's term for the round she walks.
          { label: 'Requirements', hint: `${almsLabel('gochari', profile.sect)}, medical and other needs`, to: `/profiles/${id}/requirements`, Icon: ClipboardList },
          { label: 'Events', hint: 'Pravachan, panchkalyanak and other programmes', to: `/profiles/${id}/events`, Icon: CalendarDays },
          { label: 'Broadcast', hint: 'Send a message to followers', to: `/profiles/${id}/broadcast`, Icon: Megaphone },
          { label: 'Followers', hint: `${profile.followers_count ?? 0} following you`, to: `/profiles/${id}/followers`, Icon: Users },
        ].map(({ label, hint, to, Icon }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 flex items-start gap-3 hover:border-navy-300 hover:shadow-sm transition-all group"
          >
            <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0 group-hover:bg-navy-100 transition-colors">
              <Icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy-900">{label}</span>
              <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card mb-6">
          <h3 className="font-semibold text-navy-800 mb-4">{t('ui.editProfile')}</h3>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-name" className="label">Name</label>
                <input id="profil-name" className="input" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-type" className="label">Type</label>
                {/* Changing the rank clears a post the new rank cannot hold —
                    otherwise the form silently carries e.g. Ganini onto a Muni
                    and the save 400s with PAD_TYPE_MISMATCH on an edit the rep
                    never made. */}
                <select id="profil-type" className="input" value={form.type ?? 'muni'} onChange={(e) => setForm((f) => {
                  const type = e.target.value as MaharajProfile['type'];
                  const allowed = padsForType(type).some((p) => p.value === (f.pad ?? 'none'));
                  return { ...f, type, pad: allowed ? f.pad : 'none' };
                })}>
                  {ASCETIC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.title} · {t.rank}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-samuday" className="label">{t('ui.samuday')}</label>
                <input id="profil-samuday" className="input" value={form.samuday ?? ''} onChange={(e) => setForm((f) => ({ ...f, samuday: e.target.value }))} />
              </div>
              {/* Post held (migration 039) — separate from the rank above, and
                  the reason the directory can answer "every Acharya". The list
                  is narrowed to the posts THIS rank may hold, so the rep never
                  meets the API's PAD_TYPE_MISMATCH by guessing. */}
              <div>
                <label htmlFor="profil-pad" className="label">{t('ui.pad')}</label>
                <select id="profil-pad" className="input" value={form.pad ?? 'none'}
                  onChange={(e) => setForm((f) => ({ ...f, pad: e.target.value as MaharajProfile['pad'] }))}>
                  {padsForType(form.type).map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Anniversary dates (migration 039). `diksha_year` stays the
                authoritative field when only the year is known — most
                historical records have no more than that, and inventing a day
                to fill a date would be fabricating record. */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="profil-diksha-year" className="label">{t('ui.dikshaYear')}</label>
                <input id="profil-diksha-year" className="input" type="number" value={form.diksha_year ?? ''} onChange={(e) => setForm((f) => ({ ...f, diksha_year: parseInt(e.target.value) || undefined }))} />
              </div>
              <div>
                <label htmlFor="profil-birth-date" className="label">{t('ui.birthDate')}</label>
                <input id="profil-birth-date" className="input" type="date" value={form.birth_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value || null }))} />
              </div>
              <div>
                <label htmlFor="profil-diksha-date" className="label">{t('ui.dikshaDate')}</label>
                <input id="profil-diksha-date" className="input" type="date" value={form.diksha_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, diksha_date: e.target.value || null }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-tithi-note" className="label">{t('ui.tithiNote')}</label>
                {/* Free text: observance follows the tithi, not the Gregorian
                    anniversary, and tithi→date varies by panchang and region. */}
                <input id="profil-tithi-note" className="input" value={form.tithi_note ?? ''}
                  placeholder={t('ui.tithiNotePh')}
                  onChange={(e) => setForm((f) => ({ ...f, tithi_note: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-samadhi-date" className="label">{t('ui.samadhiDate')}</label>
                <input id="profil-samadhi-date" className="input" type="date" value={form.samadhi_date ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, samadhi_date: e.target.value || null }))} />
                <p className="mt-1 text-[11px] text-slate-400">{t('ui.samadhiHint')}</p>
              </div>
            </div>
            {/* Sampradaya is editable here, not only at registration: a rep who
                skipped it (or picked wrong) had no way to correct it, and it is
                what the sant directory will filter on. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-sect" className="label">{t('ui.sect')}</label>
                <select id="profil-sect" className="input" value={form.sect ?? ''}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    sect: (e.target.value || undefined) as MaharajProfile['sect'],
                    sub_sect: undefined,
                  }))}>
                  <option value="">—</option>
                  {SECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {form.sect && (
                <div>
                  <label htmlFor="profil-sub-sect" className="label">{t('ui.panthGaccha')}</label>
                  <select id="profil-sub-sect" className="input" value={form.sub_sect ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, sub_sect: e.target.value || undefined }))}>
                    <option value="">—</option>
                    {subSectsFor(form.sect).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="profil-guru-name" className="label">{t('ui.guruName')}</label>
              <input id="profil-guru-name" className="input" value={form.guru_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, guru_name: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="profil-bio" className="label">Bio</label>
              <textarea id="profil-bio" className="input" rows={3} value={form.bio ?? ''} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            {/* Long-form public profile (migration 034). `bio` above is the one
                line that appears under the name; these are what a devotee reads
                on the profile page itself. None are identity fields, so unlike
                name/type they stay editable after verification. */}
            <div>
              <label htmlFor="profil-about" className="label">{t('ui.about')}</label>
              <textarea id="profil-about" className="input" rows={5} value={form.about ?? ''}
                placeholder={t('ui.lifeWorkPh')}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-diksha-place" className="label">{t('ui.dikshaPlace')}</label>
                <input id="profil-diksha-place" className="input" value={form.diksha_place ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, diksha_place: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-lineage" className="label">{t('ui.lineage')}</label>
                <input id="profil-lineage" className="input" value={form.lineage ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, lineage: e.target.value }))} />
              </div>
            </div>
            <div>
              <label htmlFor="profil-education" className="label">{t('ui.studyScholarship')}</label>
              <textarea id="profil-education" className="input" rows={2} value={form.education ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="profil-honours" className="label">{t('ui.titlesConferred')}</label>
              <textarea id="profil-honours" className="input" rows={2} value={form.honours ?? ''}
                placeholder={t('ui.titlesPh')}
                onChange={(e) => setForm((f) => ({ ...f, honours: e.target.value }))} />
              <p className="mt-1 text-xs text-slate-400">
                A conferred title is written here — it is never the canonical rank above.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline">{t('ui.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Co-representatives — multiple logins can share this one profile */}
      {id && <PublicProfileEditor profileId={id} />}
      {id && <RepsManager maharajId={id} />}
    </div>
  );
}
