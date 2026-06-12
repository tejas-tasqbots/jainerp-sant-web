import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MaharajRepUser } from '../types';

interface AuthStore {
  user: MaharajRepUser | null;
  access_token: string | null;
  refresh_token: string | null;
  maharaj_ids: string[];
  setAuth: (data: { user: MaharajRepUser; access_token: string; refresh_token: string; maharaj_ids: string[] }) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      maharaj_ids: [],
      setAuth: ({ user, access_token, refresh_token, maharaj_ids }) =>
        set({ user, access_token, refresh_token, maharaj_ids }),
      setTokens: (access_token, refresh_token) => set({ access_token, refresh_token }),
      logout: () => set({ user: null, access_token: null, refresh_token: null, maharaj_ids: [] }),
    }),
    { name: 'jainerp-maharaj-auth' },
  ),
);
