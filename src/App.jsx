import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginScreen from './auth/LoginScreen';
import Layout from './components/Layout';
import TileGrid from './components/TileGrid';
import SettingsPage from './components/SettingsPage';
import AddSitePage from './sites/AddSitePage';

// Modules
import ArtistList from './modules/artists/ArtistList';
import ArtistDetail from './modules/artists/ArtistDetail';
import LineupList from './modules/lineup/LineupList';
import LineupDetail from './modules/lineup/LineupDetail';
import SponsorList from './modules/sponsors/SponsorList';
import SponsorDetail from './modules/sponsors/SponsorDetail';
import EventList from './modules/events/EventList';
import EventDetail from './modules/events/EventDetail';
import StylesView from './modules/styles/StylesView';
import ConfidentialView from './modules/confidential/ConfidentialView';
import GenreList from './modules/genres/GenreList';
import StageList from './modules/stages/StageList';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TileGrid />} />

        {/* Artists */}
        <Route path="/artists" element={<ArtistList />} />
        <Route path="/artists/:id" element={<ArtistDetail />} />

        {/* Lineup */}
        <Route path="/lineup" element={<LineupList />} />
        <Route path="/lineup/:id" element={<LineupDetail />} />

        {/* Sponsors */}
        <Route path="/sponsors" element={<SponsorList />} />
        <Route path="/sponsors/:id" element={<SponsorDetail />} />

        {/* Events */}
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* Styles */}
        <Route path="/styles" element={<StylesView />} />

        {/* Confidentiality */}
        <Route path="/confidential" element={<ConfidentialView />} />

        {/* Taxonomies */}
        <Route path="/genres" element={<GenreList />} />
        <Route path="/stages" element={<StageList />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/add-site" element={<AddSitePage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
