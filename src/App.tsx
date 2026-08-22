import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { useAuthStore } from './store/authStore';
import BroadcastPage from './pages/Broadcast/BroadcastPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import EventsPage from './pages/Events/EventsPage';
import FollowersPage from './pages/Followers/FollowersPage';
import LoginPage from './pages/Login/LoginPage';
import LocationPage from './pages/Location/LocationPage';
import ProfileDetailPage from './pages/Profile/ProfileDetailPage';
import RequirementsPage from './pages/Requirements/RequirementsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ViharPage from './pages/Vihar/ViharPage';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.access_token);
  return token ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.access_token);
  return !token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<DashboardPage />} />
        {/* `profiles/new` is gone: Sadhu-Sadhvi profiles are created by the
            JainERP team (migration 044) and representatives are invited to them.
            This redirect is NOT redundant with the catch-all below — `:id`
            matches the literal segment "new" first, so without it an old
            bookmark rendered the profile page with id="new", which asked the
            API for /sant/new and got a 400 from the UUID pipe. A stale
            bookmark has to land on the dashboard, which explains who to ask. */}
        <Route path="profiles/new" element={<Navigate to="/" replace />} />
        <Route path="profiles/:id" element={<ProfileDetailPage />} />
        <Route path="profiles/:id/location" element={<LocationPage />} />
        <Route path="profiles/:id/vihar" element={<ViharPage />} />
        <Route path="profiles/:id/requirements" element={<RequirementsPage />} />
        <Route path="profiles/:id/events" element={<EventsPage />} />
        <Route path="profiles/:id/broadcast" element={<BroadcastPage />} />
        <Route path="profiles/:id/followers" element={<FollowersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
