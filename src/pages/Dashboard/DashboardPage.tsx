import { useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { asceticTitle, sectLabel } from '../../lib/ascetic';
import { useAuthStore } from '../../store/authStore';
import { useProfilesStore } from '../../store/profilesStore';
import { ErrorPanel, Loading } from '../../components/kit';
import type { MaharajProfile } from '../../types';

/** "Maharaj Ji · Digambar · Khandelwal" — enough to tell two profiles apart. */
function subtitle(p: MaharajProfile): string {
  return [p.type_display ?? asceticTitle(p.type), sectLabel(p.sect), p.samuday]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' · ');
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { profiles, loading, loaded, error, load } = useProfilesStore();

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // One profile is the common case, and a picker with a single card in it is
    // just an extra click — so go straight in. With more than one, DO NOT
    // redirect: this page is the only way to reach the others. It used to
    // redirect on `length >= 1`, which stranded a rep on whichever profile
    // sorted first and made the rest of theirs unreachable.
    if (loaded && profiles.length === 1) {
      navigate(`/profiles/${profiles[0].id}`, { replace: true });
    }
  }, [loaded, profiles, navigate]);

  if (loading && !loaded) return <Loading label="Loading your profiles…" />;
  if (error) return <ErrorPanel message={error} />;

  // The redirect above is on its way; don't flash the picker at them.
  if (profiles.length === 1) return null;

  if (profiles.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Welcome{user?.name ? `, ${user.name}` : ''} 🙏</h1>
          <p className="page-subtitle">{t('ui.setupProfile')}</p>
        </div>
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
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('ui.chooseProfile')}</h1>
        <p className="page-subtitle">{t('ui.chooseProfileHelp', { count: profiles.length })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((p) => (
          <Link
            key={p.id}
            to={`/profiles/${p.id}`}
            className="card p-4 flex items-start gap-3 hover:border-navy-300 hover:shadow-sm transition-all"
          >
            {(p.photo_base64 || p.photo_url) ? (
              <img src={p.photo_base64 || p.photo_url} alt=""
                className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center justify-center flex-shrink-0">
                {p.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900 truncate">{p.name}</span>
              <span className="block text-xs text-slate-500 mt-0.5 truncate">{subtitle(p)}</span>
              <span className="mt-2 flex items-center gap-2">
                {p.verified
                  ? <span className="badge-green text-[10px]">✓ Verified</span>
                  : <span className="badge-gray text-[10px]">{t('ui.pendingVerification')}</span>}
                <span className="text-[11px] text-slate-400">
                  {p.followers_count ?? 0} {p.followers_count === 1 ? 'follower' : 'followers'}
                </span>
              </span>
            </span>
          </Link>
        ))}

        {/* A rep who represents several may well be asked to register another. */}
        <Link
          to="/profiles/new"
          className="card p-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500
                     border-dashed hover:border-navy-300 hover:text-navy-800 transition-all"
        >
          <Plus size={16} />
          {t('nav.addSant')}
        </Link>
      </div>
    </div>
  );
}
