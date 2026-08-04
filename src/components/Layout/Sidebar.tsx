import { useTranslation } from 'react-i18next'
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { LanguageSwitcher } from '../LanguageSwitcher';

export default function Sidebar({ open = false }: { open?: boolean }) {
  const { t } = useTranslation();
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const navGroups = [
    {
      label: t('nav.myProfiles'),
      links: [
        { to: '/', label: t('nav.dashboard'), exact: true },
      ],
    },
    {
      label: t('nav.account'),
      links: [
        { to: '/settings', label: t('nav.settings'), exact: false },
      ],
    },
  ];

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
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
        <p className="text-xs text-slate-400 mt-1">{t('nav.portal')}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((grp) => (
          <div key={grp.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {grp.label}
            </p>
            <ul className="space-y-0.5">
              {grp.links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.exact}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? user?.mobile?.[0] ?? 'R'}
          </div>
          <div className="min-w-0">
            <p className="text-navy-900 text-sm font-medium truncate">{user?.name ?? 'Representative'}</p>
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
