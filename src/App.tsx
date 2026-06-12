import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { useAuthStore } from './store/authStore';
import BroadcastPage from './pages/Broadcast/BroadcastPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FollowersPage from './pages/Followers/FollowersPage';
import LoginPage from './pages/Login/LoginPage';
import LocationPage from './pages/Location/LocationPage';
import NewProfilePage from './pages/Profile/NewProfilePage';
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
        <Route path="profiles/new" element={<NewProfilePage />} />
        <Route path="profiles/:id" element={<ProfileDetailPage />} />
        <Route path="profiles/:id/location" element={<LocationPage />} />
        <Route path="profiles/:id/vihar" element={<ViharPage />} />
        <Route path="profiles/:id/requirements" element={<RequirementsPage />} />
        <Route path="profiles/:id/broadcast" element={<BroadcastPage />} />
        <Route path="profiles/:id/followers" element={<FollowersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
