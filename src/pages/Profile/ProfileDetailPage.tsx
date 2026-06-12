import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import type { MaharajProfile } from '../../types';

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    api.get(`/maharaj/${id}`)
      .then((data: any) => {
        setProfile(data);
        setForm({ name: data.name, type: data.type, samuday: data.samuday,
          diksha_year: data.diksha_year, guru_name: data.guru_name, bio: data.bio });
      })
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/maharaj/${id}`, form);
      setProfile((p) => p ? { ...p, ...form } as MaharajProfile : p);
      setEditing(false);
    } catch (e) {
      alert(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post(`/maharaj/${id}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as any;
      setProfile((p) => p ? { ...p, photo_url: res.photo_url } : p);
    } catch (e) {
      alert(apiError(e));
    } finally {
      setPhotoUploading(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="card bg-red-50 text-red-600">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
        <div className="flex items-center justify-between">
          <h1 className="page-title">{profile.name}</h1>
          <button onClick={() => setEditing((v) => !v)} className="btn-outline">
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-navy-800 to-navy-600 p-6 text-white">
        <div className="flex items-start gap-5">
          <div className="relative">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
                {profile.name[0]}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent-500 rounded-full flex items-center justify-center text-navy-900 text-xs font-bold hover:bg-accent-600"
              title="Change photo"
            >
              {photoUploading ? '…' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
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
            <p className="text-white/80 text-sm">{profile.samuday} · {profile.type === 'maharaj' ? 'Maharaj' : 'Mataji'}</p>
            {profile.diksha_year && <p className="text-white/60 text-xs mt-0.5">Diksha {profile.diksha_year}</p>}
            <p className="text-white/60 text-xs mt-0.5">{profile.followers_count} followers</p>
          </div>
        </div>
        {profile.bio && <p className="mt-4 text-sm text-white/70">{profile.bio}</p>}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Update Location', to: `/profiles/${id}/location` },
          { label: 'Vihar Plan', to: `/profiles/${id}/vihar` },
          { label: 'Requirements', to: `/profiles/${id}/requirements` },
          { label: 'Broadcast', to: `/profiles/${id}/broadcast` },
          { label: 'Followers', to: `/profiles/${id}/followers` },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="btn-outline text-sm py-2 text-center">{a.label}</Link>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card mb-6">
          <h3 className="font-semibold text-navy-800 mb-4">Edit Profile</h3>
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type ?? 'maharaj'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                  <option value="maharaj">Maharaj</option>
                  <option value="mataji">Mataji</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Samuday</label>
                <input className="input" value={form.samuday ?? ''} onChange={(e) => setForm((f) => ({ ...f, samuday: e.target.value }))} />
              </div>
              <div>
                <label className="label">Diksha Year</label>
                <input className="input" type="number" value={form.diksha_year ?? ''} onChange={(e) => setForm((f) => ({ ...f, diksha_year: parseInt(e.target.value) || undefined }))} />
              </div>
            </div>
            <div>
              <label className="label">Guru Name</label>
              <input className="input" value={form.guru_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, guru_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="input" rows={3} value={form.bio ?? ''} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
