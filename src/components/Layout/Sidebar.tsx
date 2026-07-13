import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const navGroups = [
  {
    label: 'My Profiles',
    links: [
      { to: '/', label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/settings', label: 'Settings', exact: false },
    ],
  },
];

export default function Sidebar() {
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    navigate('/login');
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-800 shadow-lg">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-navy-900 font-bold text-base">
          ॐ
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">JainERP™</p>
          <p className="text-white/60 text-xs mt-0.5">Maharaj Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((grp) => (
          <div key={grp.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
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
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() ?? user?.mobile?.[0] ?? 'R'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name ?? 'Representative'}</p>
            <p className="text-white/50 text-xs truncate">{user?.mobile}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
