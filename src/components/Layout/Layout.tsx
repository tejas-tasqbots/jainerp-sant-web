import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

/**
 * The sidebar is a fixed 256px rail on desktop. On a phone that rail stayed put
 * while `ml-64` pushed the content off-screen, so every page scrolled ~250px
 * sideways. Below `lg` it is now an off-canvas drawer behind a hamburger, and
 * the main column drops its left margin.
 */
export default function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Tapping a link should close the drawer, not leave it covering the page.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Scrim — only while the drawer is open, and only on small screens. */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <main className="flex-1 lg:ml-64 min-h-screen min-w-0">
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() => setNavOpen(v => !v)}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            className="p-1.5 -ml-1.5 rounded text-slate-600 hover:bg-slate-100"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-navy-900 text-sm">JainERP™</span>
        </div>

        {/* Centred, readable measure. Pages previously used `max-w-2xl` and hugged
            the left edge, leaving half a 1440px screen empty. */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
