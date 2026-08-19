import { create } from 'zustand';
import api, { apiError } from '../lib/api';
import type { MaharajProfile } from '../types';

/**
 * The profiles this login represents — the set the rep switches between.
 *
 * It lives in a store rather than in each page because two consumers need the
 * same list at once (the sidebar switcher and the dashboard picker), and a
 * per-page fetch meant the sidebar re-requested `/sant/mine` on every
 * navigation. Deliberately NOT persisted: which profiles a rep represents can
 * be revoked between sessions, and a stale cached list would offer a profile
 * the API will refuse.
 */
interface ProfilesStore {
  profiles: MaharajProfile[];
  loading: boolean;
  /** True once a fetch has settled — distinguishes "empty" from "not asked". */
  loaded: boolean;
  error: string;
  load: (force?: boolean) => Promise<MaharajProfile[]>;
  reset: () => void;
}

/** Shared between concurrent callers so mounting sidebar + page fires one GET. */
let inflight: Promise<MaharajProfile[]> | null = null;

export const useProfilesStore = create<ProfilesStore>((set, get) => ({
  profiles: [],
  loading: false,
  loaded: false,
  error: '',

  load: (force = false) => {
    if (!force && get().loaded && !get().error) return Promise.resolve(get().profiles);
    if (inflight) return inflight;
    set({ loading: true, error: '' });
    inflight = api
      .get('/sant/mine')
      .then((data: any) => {
        const list: MaharajProfile[] = Array.isArray(data) ? data : [];
        set({ profiles: list, loaded: true, loading: false, error: '' });
        return list;
      })
      .catch((e) => {
        set({ error: apiError(e), loading: false, loaded: true });
        return [] as MaharajProfile[];
      })
      .finally(() => { inflight = null; });
    return inflight;
  },

  reset: () => {
    inflight = null;
    set({ profiles: [], loading: false, loaded: false, error: '' });
  },
}));
