import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { MaharajProfile } from '../../types';

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<MaharajProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/sant/mine')
      .then((data: any) => {
        const list: MaharajProfile[] = Array.isArray(data) ? data : [];
        setProfiles(list);
        // One profile per login — go straight to it, no dashboard list.
        if (list.length >= 1) navigate(`/profiles/${list[0].id}`, { replace: true });
      })
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="card border-red-100 bg-red-50 text-sm text-red-600">{error}</div>;
  }

  // Only reached when the account has no profile yet.
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome{user?.name ? `, ${user.name}` : ''} 🙏</h1>
        <p className="page-subtitle">{t('ui.setupProfile')}</p>
      </div>
      {profiles.length === 0 && (
        <div className="card text-center py-16 max-w-lg mx-auto">
          <div className="text-5xl mb-4">🕉️</div>
          <h2 className="text-lg font-semibold text-navy-800 mb-2">{t('ui.createProfile')}</h2>
          <p className="text-sm text-gray-500 mb-6">
            {/* "Maharaj"/"Mataji" are honorifics for a Muni/Aryika specifically —
                they do not cover Kshullaks, Ailaks or Sadhvis, so they must not be
                used as the umbrella term here (see the 2026-08-03 sant rename). */}
            Register your Sadhu-Sadhvi profile. It becomes public to devotees once the Super Admin verifies it.
            You can later invite family or shishyas by their mobile number to help manage it.
          </p>
          <Link to="/profiles/new" className="btn-primary">{t('ui.registerProfile')}</Link>
        </div>
      )}
    </div>
  );
}
