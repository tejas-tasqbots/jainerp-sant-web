import { useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useProfilesStore } from '../../store/profilesStore';
import { asceticTitle, sectLabel } from '../../lib/ascetic';
import api from '../../lib/api';
import { LanguageSwitcher } from '../LanguageSwitcher';
import type { MaharajProfile } from '../../types';
import { ProfilePhoto } from '../ProfilePhoto';

/** Small round avatar for a profile row — inline photo wins, else the initial. */
function ProfileAvatar({ profile }: { profile: MaharajProfile }) {
  return (
    <ProfilePhoto
      src={profile.photo_base64 || profile.photo_url}
      name={profile.name}
      className="w-7 h-7 text-xs"
    />
  );
}

/** "Maharaj Ji · Digambar" — the same line the mobile switcher shows. */
function profileSubtitle(p: MaharajProfile): string {
  return [p.type_display ?? asceticTitle(p.type), sectLabel(p.sect)]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' · ');
}

export default function Sidebar({ open = false }: { open?: boolean }) {
  const { t } = useTranslation();
  const { user, logout: storeLogout } = useAuthStore();
  const { profiles, load, reset } = useProfilesStore();
  const navigate = useNavigate();

  // The switcher is this app's primary navigation, so the list loads with the
  // shell rather than with whichever page happens to need it.
  useEffect(() => { load(); }, [load]);

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    // Otherwise the next rep to sign in on this device sees the previous rep's
    // profiles in the switcher until /sant/mine returns.
    reset();
    navigate('/login');
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-200 shadow-lg
        transition-transform lg:translate-x-0 lg:shadow-none
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-200">
        <p className="text-xl font-bold tracking-tight leading-none">
          <span className="text-navy-900">Jain</span><span className="text-brand-red">ERP</span>
        </p>
        <p className="text-xs font-semibold text-slate-500 mt-1">{t('brand.portal')}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/*
          One row per profile this login represents. A rep can hold several — a
          shishya managing four Munis, a family managing a Sadhvi and her guru —
          and before this the app redirected into the first profile and offered
          no way back, so every other profile was unreachable.
        */}
        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {profiles.length > 1 ? t('nav.actingFor') : t('nav.myProfiles')}
          </p>
          <ul className="space-y-0.5">
            {profiles.map((p) => (
              <li key={p.id}>
                <NavLink
                  to={`/profiles/${p.id}`}
                  className={({ isActive }) =>
                    `sidebar-link gap-2.5 ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                  }
                >
                  <ProfileAvatar profile={p} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate leading-tight">{p.name}</span>
                    {profileSubtitle(p) && (
                      <span className="block truncate text-[10px] font-normal opacity-70 leading-tight">
                        {profileSubtitle(p)}
                      </span>
                    )}
                  </span>
                  {/* A profile still awaiting Super Admin verification is not
                      public yet; the dot says which one without a second line. */}
                  {!p.verified && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"
                      title={t('ui.pendingVerification')}
                    />
                  )}
                </NavLink>
              </li>
            ))}

            {/* Only useful once there is a set of profiles to come back to. */}
            {profiles.length > 1 && (
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `sidebar-link gap-2.5 ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                  }
                >
                  <LayoutGrid size={16} className="flex-shrink-0" />
                  {t('nav.allProfiles')}
                </NavLink>
              </li>
            )}

            {/*
              No "Add Sadhu-Sadhvi" entry. Profiles are created by the JainERP
              team and sangh representatives are invited to them (migration 044), so a
              link here would lead to a form whose only outcome is a 403. A rep
              who needs a new profile is told who to ask on the dashboard.
            */}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {t('nav.account')}
          </p>
          <ul className="space-y-0.5">
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-link gap-2.5 ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                }
              >
                <SettingsIcon size={16} className="flex-shrink-0" />
                {t('nav.settings')}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? user?.mobile?.[0] ?? 'R'}
          </div>
          <div className="min-w-0">
            <p className="text-navy-900 text-sm font-medium truncate">{user?.name ?? 'Sangh Representative'}</p>
            <p className="text-slate-400 text-xs truncate">{user?.mobile}</p>
          </div>
        </div>
        {/* Language is switchable after sign-in too, not only on the login
            screen — a rep who picked the wrong one was previously stuck. */}
        <div className="mb-2"><LanguageSwitcher /></div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-slate-500 hover:text-brand-red px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
}
