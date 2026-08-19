import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { PageHeader } from '../../components/kit';
import { useAuthStore } from '../../store/authStore';
import { useProfilesStore } from '../../store/profilesStore';

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, logout: storeLogout, setAuth, access_token, refresh_token, sant_ids } = useAuthStore();
  const { profiles, reset: resetProfiles } = useProfilesStore();
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
        setAuth({ user: { ...user, name }, access_token, refresh_token, sant_ids });
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
    resetProfiles();
    navigate('/login');
  }

  return (
    <div className="max-w-lg">
      <PageHeader title={t('ui.settings')} subtitle={t('ui.settingsHelp')} back={false} />

      <div className="card mb-4">
        <h2 className="font-semibold text-navy-800 mb-4">{t('ui.profileInformation')}</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-500">{t('ui.mobile')}</p>
          <p className="font-medium text-gray-800">{user?.mobile}</p>
        </div>
        <form onSubmit={handleNameUpdate} className="space-y-4">
          <div>
            <label htmlFor="settin-display-name" className="label">{t('ui.displayName')}</label>
            <input id="settin-display-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('ui.enterYourName')} />
          </div>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          {success && <p className="text-sm text-cta-600">{success}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Name'}
          </button>
        </form>
      </div>

      <div className="card mb-4">
        <h2 className="font-semibold text-navy-800 mb-2">{t('ui.account')}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {/* The live list, not `sant_ids`: that is a snapshot taken at login,
              so a profile registered or shared with this rep mid-session made
              this line disagree with the switcher standing next to it. */}
          You are logged in as a Sadhu-Sadhvi representative managing{' '}
          <strong>{profiles.length || sant_ids.length}</strong> profile(s).
        </p>
        {profiles.length > 1 && (
          <p className="text-sm text-gray-500 mb-4">
            {t('ui.switchHint')}
          </p>
        )}
      </div>

      <div className="card border-red-100">
        <h2 className="font-semibold text-danger-500 mb-2">{t('ui.signOut')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('ui.signOutAll')}</p>
        <button onClick={handleLogout} className="btn-danger">{t('ui.signOut')}</button>
      </div>
    </div>
  );
}
