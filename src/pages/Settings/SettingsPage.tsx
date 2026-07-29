import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { PageHeader } from '../../components/kit';
import { useAuthStore } from '../../store/authStore';

export default function SettingsPage() {
  const { user, logout: storeLogout, setAuth, access_token, refresh_token, maharaj_ids } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/auth/profile', { name });
      if (user && access_token && refresh_token) {
        setAuth({ user: { ...user, name }, access_token, refresh_token, maharaj_ids });
      }
      setSuccess('Name updated successfully');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    navigate('/login');
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Settings" subtitle="Your account and language" back={false} />

      <div className="card mb-4">
        <h2 className="font-semibold text-navy-800 mb-4">Profile Information</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-500">Mobile</p>
          <p className="font-medium text-gray-800">{user?.mobile}</p>
        </div>
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label htmlFor="settin-display-name" className="label">Display Name</label>
            <input id="settin-display-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name" />
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {success && <p className="text-sm text-cta-600">{success}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Name'}
          </button>
        </form>
      </div>

      <div className="card mb-4">
        <h2 className="font-semibold text-navy-800 mb-2">Account</h2>
        <p className="text-sm text-gray-500 mb-4">
          You are logged in as a Maharaj/Mataji representative managing{' '}
          <strong>{maharaj_ids.length}</strong> profile(s).
        </p>
      </div>

      <div className="card border-red-100">
        <h2 className="font-semibold text-danger-500 mb-2">Sign Out</h2>
        <p className="text-sm text-gray-500 mb-4">
          You will be signed out of all sessions on this device.
        </p>
        <button onClick={handleLogout} className="btn-danger">Sign Out</button>
      </div>
    </div>
  );
}
