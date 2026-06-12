import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function NewProfilePage() {
  const navigate = useNavigate();
  const { setAuth, user, access_token, refresh_token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'maharaj',
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
      const res = await api.post('/maharaj', {
        name: form.name,
        type: form.type,
        samuday: form.samuday,
        diksha_year: form.diksha_year ? parseInt(form.diksha_year) : undefined,
        guru_name: form.guru_name || undefined,
        bio: form.bio || undefined,
        languages: langs.length ? langs : undefined,
      }) as any;
      // Refresh auth to pick up the new maharaj_id (refresh response includes maharaj_ids)
      if (user && access_token && refresh_token) {
        try {
          const refreshed = await api.post('/auth/refresh', { refresh_token }) as any;
          setAuth({
            user: { ...user, maharaj_ids: refreshed.maharaj_ids ?? [] },
            access_token: refreshed.access_token ?? access_token,
            refresh_token,
            maharaj_ids: refreshed.maharaj_ids ?? [],
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
        <h1 className="page-title">Register New Profile</h1>
        <p className="page-subtitle">Profiles require Super Admin verification before going public</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Acharya Shri Yashovijayji" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="maharaj">Maharaj</option>
              <option value="mataji">Mataji</option>
            </select>
          </div>
          <div>
            <label className="label">Samuday / Sect *</label>
            <input className="input" placeholder="e.g. Tapagachha, Shvetambar" value={form.samuday}
              onChange={(e) => setForm((f) => ({ ...f, samuday: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Diksha Year</label>
              <input className="input" type="number" min={1900} max={2025} placeholder="e.g. 1998"
                value={form.diksha_year}
                onChange={(e) => setForm((f) => ({ ...f, diksha_year: e.target.value }))} />
            </div>
            <div>
              <label className="label">Guru Name</label>
              <input className="input" placeholder="Guru's name" value={form.guru_name}
                onChange={(e) => setForm((f) => ({ ...f, guru_name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} placeholder="Brief description…" value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <div>
            <label className="label">Languages (comma-separated)</label>
            <input className="input" placeholder="gujarati, hindi, sanskrit" value={form.languages}
              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
