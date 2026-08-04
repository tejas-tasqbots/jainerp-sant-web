import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SantRepUser } from '../types';

const STORAGE_KEY = 'jainerp-sant-auth';
/** Where the session lived before the maharaj → sant rename (2026-08-03). */
const LEGACY_STORAGE_KEY = 'jainerp-maharaj-auth';

interface AuthStore {
  user: SantRepUser | null;
  access_token: string | null;
  refresh_token: string | null;
  sant_ids: string[];
  setAuth: (data: { user: SantRepUser; access_token: string; refresh_token: string; sant_ids: string[] }) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      sant_ids: [],
      setAuth: ({ user, access_token, refresh_token, sant_ids }) =>
        set({ user, access_token, refresh_token, sant_ids }),
      setTokens: (access_token, refresh_token) => set({ access_token, refresh_token }),
      logout: () => set({ user: null, access_token: null, refresh_token: null, sant_ids: [] }),
    }),
    {
      name: STORAGE_KEY,
      /**
       * One-time migration off the pre-rename key.
       *
       * The store lived at `jainerp-maharaj-auth`. Renaming it outright would
       * sign out every rep who is currently signed in — a silent forced logout
       * on the release that only renamed a string. So on first read under the
       * new key we adopt whatever the old key holds and delete it; from then on
       * only the new key exists.
       *
       * Safe to delete this shim once no live client can still be carrying the
       * old key (a release or two).
       */
      migrate: (persisted) => persisted,
      storage: {
        getItem: (name) => {
          const current = localStorage.getItem(name);
          if (current) return JSON.parse(current);
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (!legacy) return null;
          localStorage.setItem(name, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return JSON.parse(legacy);
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => {
          localStorage.removeItem(name);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        },
      },
    },
  ),
);
