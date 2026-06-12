import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { MaharajProfile } from '../../types';

function AvatarInitials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-12 h-12 text-lg' : 'w-8 h-8 text-sm';
  return (
    <div className={`${sz} rounded-full bg-navy-100 text-navy-700 font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function DashboardPage() {
  const { user, maharaj_ids } = useAuthStore();
  const [profiles, setProfiles] = useState<MaharajProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/maharaj/mine')
      .then((data: any) => setProfiles(Array.isArray(data) ? data : []))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="page-subtitle">
            {maharaj_ids.length > 0
              ? `Managing ${maharaj_ids.length} profile${maharaj_ids.length !== 1 ? 's' : ''}`
              : 'No profiles yet — register your first one below'}
          </p>
        </div>
        <Link to="/profiles/new" className="btn-primary">
          + Add Profile
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="card border-red-100 bg-red-50 text-sm text-red-600">{error}</div>
      )}

      {!loading && profiles.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🕉️</div>
          <h2 className="text-lg font-semibold text-navy-800 mb-2">No profiles yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Register a Maharaj or Mataji profile to get started. Profiles need Super Admin verification before becoming public.
          </p>
          <Link to="/profiles/new" className="btn-primary">Register Profile</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((p) => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.name}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <AvatarInitials name={p.name} size="lg" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-navy-800 truncate">{p.name}</h2>
                  {p.verified ? (
                    <span className="badge-green text-[10px]">Verified</span>
                  ) : (
                    <span className="badge-gray text-[10px]">Pending</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{p.samuday}</p>
                <p className="text-xs text-gray-400 capitalize">{p.type}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>{p.followers_count} followers</span>
              {p.current_city && <span>📍 {p.current_city}, {p.current_state}</span>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link to={`/profiles/${p.id}`} className="btn-primary text-xs py-1.5">Manage</Link>
              <Link to={`/profiles/${p.id}/broadcast`} className="btn-outline text-xs py-1.5">Broadcast</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
