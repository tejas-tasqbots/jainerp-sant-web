import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import type { Follower } from '../../types';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FollowersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/maharaj/${id}/followers/count`) as Promise<any>,
      api.get(`/maharaj/${id}/followers`) as Promise<any>,
    ])
      .then(([countData, listData]) => {
        setCount(countData?.followers_count ?? null);
        setFollowers(Array.isArray(listData) ? listData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Back</button>
        <h1 className="page-title">Followers</h1>
        {count !== null && (
          <p className="page-subtitle">{count} devotees following this profile</p>
        )}
      </div>

      <div className="card">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-navy-300 border-t-navy-700 rounded-full animate-spin" />
          </div>
        )}
        {!loading && followers.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No followers yet</p>
        )}
        <div className="space-y-2">
          {followers.map((f) => (
            <div key={f.devotee_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {f.name?.[0]?.toUpperCase() ?? f.mobile[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{f.name ?? 'Devotee'}</p>
                <p className="text-xs text-gray-400">{f.mobile}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(f.followed_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
