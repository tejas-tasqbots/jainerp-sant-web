import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import api from '../../lib/api';
import { EmptyState, PageHeader, SkeletonList } from '../../components/kit';
import type { Follower } from '../../types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FollowersPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/sant/${id}/followers/count`) as Promise<any>,
      api.get(`/sant/${id}/followers`) as Promise<any>,
    ])
      .then(([countData, listData]) => {
        setCount(countData?.followers_count ?? null);
        setFollowers(Array.isArray(listData) ? listData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // A rep with a few hundred followers needs to find one; scrolling isn't a plan.
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return followers;
    return followers.filter(
      f => (f.name ?? '').toLowerCase().includes(term) || (f.mobile ?? '').includes(term),
    );
  }, [followers, q]);

  return (
    <div>
      <PageHeader
        title={t('ui.followers')}
        subtitle={
          count === null
            ? undefined
            // Pluralise properly — this read "1 devotees" before.
            : `${count} ${count === 1 ? 'devotee follows' : 'devotees follow'} this profile`
        }
      />

      {loading ? (
        <SkeletonList rows={4} />
      ) : followers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('ui.noFollowers')}
          hint="Devotees who follow this profile in the JainERP devotee app will appear here, with the date they started following."
        />
      ) : (
        <>
          {followers.length > 8 && (
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder={t('ui.searchFollowersPh')}
                value={q}
                onChange={e => setQ(e.target.value)}
                aria-label={t('ui.searchFollowers')}
              />
            </div>
          )}

          {shown.length === 0 ? (
            <EmptyState icon={Search} title={t('ui.noMatches')} hint={`Nothing matched “${q}”.`} />
          ) : (
            <ul className="card divide-y divide-slate-100 p-0 overflow-hidden">
              {shown.map(f => (
                <li key={f.devotee_id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {f.name?.[0]?.toUpperCase() ?? f.mobile?.[0] ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-900 truncate">{f.name ?? 'Devotee'}</p>
                    <p className="text-xs text-slate-400">{f.mobile}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(f.followed_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
