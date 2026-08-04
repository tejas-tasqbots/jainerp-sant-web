import { useEffect, useRef, useState } from 'react';
import { ASCETIC_TYPES, asceticTitle, SECTS, subSectsFor } from '../../lib/ascetic'
import { Link, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { compressImage } from '../../lib/imageCompress';
import { RepsManager } from '../../components/RepsManager';
import { PublicProfileEditor } from '../../components/PublicProfileEditor';
import { ClipboardList, MapPin, Megaphone, Route, Users } from 'lucide-react';
import { ErrorPanel, Loading, PageHeader } from '../../components/kit';
import type { MaharajProfile } from '../../types';

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<MaharajProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<MaharajProfile>>({});
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/sant/${id}`)
      .then((data: any) => {
        setProfile(data);
        setForm({ name: data.name, type: data.type, samuday: data.samuday,
          sect: data.sect, sub_sect: data.sub_sect,
          diksha_year: data.diksha_year, guru_name: data.guru_name, bio: data.bio,
          about: data.about, diksha_place: data.diksha_place, education: data.education,
          honours: data.honours, lineage: data.lineage });
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
    } catch (e) {
      alert(apiError(e));
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
    } catch (e) {
      alert(apiError(e));
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
    } catch (e) {
      alert(apiError(e));
    } finally {
      setPhotoUploading(false);
    }
  }

  if (loading) return <Loading label="Loading your profile…" />;
  if (error) return <ErrorPanel message={error} />;
  if (!profile) return null;

  return (
    <div>
      {/* The name lives in the hero below, so the page heading names the SCREEN
          instead of repeating it. */}
      <PageHeader
        title="My Profile"
        subtitle="What devotees see about you in the JainERP app"
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
              title="Change photo"
            >
              {photoUploading ? '…' : '📷'}
            </button>
            {(profile.photo_base64 || profile.photo_url) && (
              <button
                onClick={removePhoto}
                disabled={photoUploading}
                className="absolute -top-1 -right-1 w-6 h-6 bg-white/90 text-red-600 rounded-full flex items-center justify-center text-xs font-bold hover:bg-white"
                title="Remove photo"
              >
                ×
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" aria-label="Choose a profile photo" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{profile.name}</h2>
              {profile.verified ? (
                <span className="badge-green text-xs">✓ Verified</span>
              ) : (
                <span className="bg-yellow-400/20 text-yellow-200 badge text-xs">Pending Verification</span>
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
          { label: 'Requirements', hint: 'Aahar, medical and other needs', to: `/profiles/${id}/requirements`, Icon: ClipboardList },
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
          <h3 className="font-semibold text-navy-800 mb-4">Edit Profile</h3>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-name" className="label">Name</label>
                <input id="profil-name" className="input" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-type" className="label">Type</label>
                <select id="profil-type" className="input" value={form.type ?? 'muni'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                  {ASCETIC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.title} · {t.rank}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-samuday" className="label">Samuday</label>
                <input id="profil-samuday" className="input" value={form.samuday ?? ''} onChange={(e) => setForm((f) => ({ ...f, samuday: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-diksha-year" className="label">Diksha Year</label>
                <input id="profil-diksha-year" className="input" type="number" value={form.diksha_year ?? ''} onChange={(e) => setForm((f) => ({ ...f, diksha_year: parseInt(e.target.value) || undefined }))} />
              </div>
            </div>
            {/* Sampradaya is editable here, not only at registration: a rep who
                skipped it (or picked wrong) had no way to correct it, and it is
                what the sant directory will filter on. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-sect" className="label">Sect (sampradaya)</label>
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
                  <label htmlFor="profil-sub-sect" className="label">Panth / Gaccha</label>
                  <select id="profil-sub-sect" className="input" value={form.sub_sect ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, sub_sect: e.target.value || undefined }))}>
                    <option value="">—</option>
                    {subSectsFor(form.sect).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="profil-guru-name" className="label">Guru Name</label>
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
              <label htmlFor="profil-about" className="label">About</label>
              <textarea id="profil-about" className="input" rows={5} value={form.about ?? ''}
                placeholder="Their life, their work, what they are known for…"
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="profil-diksha-place" className="label">Diksha place</label>
                <input id="profil-diksha-place" className="input" value={form.diksha_place ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, diksha_place: e.target.value }))} />
              </div>
              <div>
                <label htmlFor="profil-lineage" className="label">Lineage / parampara</label>
                <input id="profil-lineage" className="input" value={form.lineage ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, lineage: e.target.value }))} />
              </div>
            </div>
            <div>
              <label htmlFor="profil-education" className="label">Study & scholarship</label>
              <textarea id="profil-education" className="input" rows={2} value={form.education ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="profil-honours" className="label">Titles conferred</label>
              <textarea id="profil-honours" className="input" rows={2} value={form.honours ?? ''}
                placeholder="Upadhyay, Acharya…"
                onChange={(e) => setForm((f) => ({ ...f, honours: e.target.value }))} />
              <p className="mt-1 text-xs text-slate-400">
                A conferred title is written here — it is never the canonical rank above.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
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
