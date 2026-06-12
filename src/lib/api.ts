import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().access_token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const store = useAuthStore.getState();
      if (store.refresh_token) {
        if (!refreshing) {
          refreshing = axios
            .post('/api/auth/refresh', { refresh_token: store.refresh_token })
            .then((r) => {
              const at = r.data?.data?.access_token ?? r.data?.access_token;
              store.setTokens(at, store.refresh_token!);
              return at;
            })
            .finally(() => { refreshing = null; });
        }
        try {
          const at = await refreshing;
          original.headers.Authorization = `Bearer ${at}`;
          return api(original);
        } catch {
          store.logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  },
);

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data;
    return d?.error?.message ?? d?.message ?? err.message;
  }
  return String(err);
}

export default api;
