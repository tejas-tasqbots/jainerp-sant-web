import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { asceticTitle, displayName, secondaryName, sectLabel } from '../../lib/ascetic';
import { useAuthStore } from '../../store/authStore';
import { useProfilesStore } from '../../store/profilesStore';
import { ErrorPanel, Loading } from '../../components/kit';
import { BulkLocationDialog } from '../../components/BulkLocationDialog';
import type { MaharajProfile } from '../../types';

/** "Maharaj Ji · Digambar · Khandelwal" — enough to tell two profiles apart. */
function subtitle(p: MaharajProfile, lang: string): string {
  return [p.type_display ?? asceticTitle(p.type, lang), sectLabel(p.sect, lang), p.samuday]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' · ');
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language;
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { profiles, loading, loaded, error, load } = useProfilesStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => { load(); }, [load]);

  /**
   * A memorial has no current location, so it can never be part of a bulk
   * update. Excluded from the selectable set rather than offered and then
   * rejected by the API — the rep would have no way to tell which of eight
   * profiles the error was about.
   */
  const selectable = useMemo(
    () => profiles.filter((p) => !p.samadhi_date && !p.is_samadhistha),
    [profiles],
  );

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

  if (loading && !loaded) return <Loading label={t('ui.loading')} />;
  if (error) return <ErrorPanel message={error} />;

  // The redirect above is on its way; don't flash the picker at them.
  if (profiles.length === 1) return null;

  /**
   * Nothing assigned yet.
   *
   * This used to be a "Register your Sadhu-Sadhvi profile" call to action.
   * Profiles are created by the JainERP team now (migration 044), so the honest
   * screen explains who to ask and what will happen — a Register button that
   * 403s would be worse than no button at all.
   */
  if (profiles.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">{t('ui.welcome', { defaultValue: 'Welcome' })}{user?.name ? `, ${user.name}` : ''} 🙏</h1>
        </div>
        <div className="card text-center py-16 max-w-lg mx-auto">
          <div className="text-5xl mb-4">🕉️</div>
          <h2 className="text-lg font-semibold text-navy-800 mb-2">{t('sant.noProfilesTitle')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{t('sant.noProfilesHelp')}</p>
        </div>
      </div>
    );
  }

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('ui.chooseProfile')}</h1>
        <p className="page-subtitle">{t('ui.chooseProfileHelp', { count: profiles.length })}</p>
      </div>

      {/* Bulk location — the sangh travelling together (migration 044).
          Offered only when there is more than one to select, because with a
          single profile the ordinary Update Location page is simply better. */}
      {selectable.length > 1 && (
        <div className="card mb-4 p-3 flex flex-wrap items-center gap-3">
          <MapPin size={16} className="text-navy-700" />
          <span className="text-sm text-navy-900 font-medium">{t('sant.bulkTitle')}</span>
          <span className="text-xs text-slate-500 flex-1 min-w-[12rem]">{t('sant.bulkHelp')}</span>
          <button
            type="button"
            className="text-xs text-navy-700 hover:text-navy-900"
            onClick={() => setSelected(selected.length === selectable.length ? [] : selectable.map((p) => p.id))}
          >
            {selected.length === selectable.length ? t('sant.clearSelection') : t('sant.selectAll')}
          </button>
          <button
            type="button"
            className="btn-primary text-xs py-1.5"
            disabled={selected.length === 0}
            onClick={() => setBulkOpen(true)}
          >
            {t('sant.bulkUpdate')}
            {selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((p) => {
          const isSamadhistha = !!(p.samadhi_date || p.is_samadhistha);
          const second = secondaryName(p, lang);
          return (
            <div
              key={p.id}
              className="card p-4 flex items-start gap-3 hover:border-navy-300 hover:shadow-sm transition-all"
            >
              {/* The checkbox is OUTSIDE the link: a rep selecting profiles for a
                  bulk update must not be navigated away mid-selection. */}
              {selectable.length > 1 && !isSamadhistha && (
                <input
                  type="checkbox"
                  className="mt-1 flex-shrink-0"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  aria-label={t('sant.selectedCount', { count: 1 }) + ` — ${displayName(p, lang)}`}
                />
              )}
              <Link to={`/profiles/${p.id}`} className="flex items-start gap-3 min-w-0 flex-1">
                {(p.photo_base64 || p.photo_url) ? (
                  <img src={p.photo_base64 || p.photo_url} alt=""
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <span className="w-11 h-11 rounded-full bg-navy-100 text-navy-800 font-bold flex items-center justify-center flex-shrink-0">
                    {displayName(p, lang)[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy-900 truncate">
                    {displayName(p, lang)}
                  </span>
                  {/* The other script, when there is one and it differs. A
                      devotee searching in Hindi and a rep reading in English
                      are looking at the same ascetic; showing both is what
                      makes that obvious. */}
                  {second && (
                    <span className="block text-xs text-slate-400 truncate">{second}</span>
                  )}
                  <span className="block text-xs text-slate-500 mt-0.5 truncate">{subtitle(p, lang)}</span>
                  <span className="mt-2 flex items-center gap-2 flex-wrap">
                    {isSamadhistha
                      ? <span className="badge-gray text-[10px]">{t('sant.samadhistha')}</span>
                      : p.verified
                        ? <span className="badge-green text-[10px]">✓ {t('ui.verified', { defaultValue: 'Verified' })}</span>
                        : <span className="badge-gray text-[10px]">{t('ui.pendingVerification')}</span>}
                    <span className="text-[11px] text-slate-400">
                      {t('ui.followersCount', {
                        count: p.followers_count ?? 0,
                        defaultValue: '{{count}} followers',
                      })}
                    </span>
                  </span>
                </span>
              </Link>
            </div>
          );
        })}
      </div>

      {bulkOpen && (
        <BulkLocationDialog
          profiles={selectable.filter((p) => selected.includes(p.id))}
          onClose={() => setBulkOpen(false)}
          onDone={() => { setBulkOpen(false); setSelected([]); load(); }}
        />
      )}
    </div>
  );
}
