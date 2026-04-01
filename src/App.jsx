import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import WelcomePage from './auth/WelcomePage';
import LoginPage from './auth/LoginPage';
import HomePage from './components/HomePage';
import SiteDashboard from './components/SiteDashboard';
import SettingsPage from './components/SettingsPage';
import SearchPage from './components/SearchPage';
import FavoritesPage from './components/FavoritesPage';
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
import ContestantList from './modules/contestants/ContestantList';
import ContestantDetail from './modules/contestants/ContestantDetail';

function AppRoutes() {
  const { loading, hasSeenWelcome, dismissWelcome, sites } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-0">
        <div className="w-8 h-8 border-2 border-vc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show welcome/onboarding on first visit (no sites connected, hasn't dismissed)
  if (!hasSeenWelcome && sites.length === 0) {
    return <WelcomePage onDismiss={dismissWelcome} />;
  }

  // Always show app shell — no auth wall. Homepage is sparse when no sites connected.
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/site/:siteId" element={<SiteDashboard />} />

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

        {/* Contestants (rodeo) */}
        <Route path="/contestants" element={<ContestantList />} />
        <Route path="/contestants/:id" element={<ContestantDetail />} />

        {/* Taxonomies */}
        <Route path="/genres" element={<GenreList />} />
        <Route path="/stages" element={<StageList />} />

        {/* Nav routes */}
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/add-site" element={<AddSitePage />} />
        <Route path="/login" element={<LoginPage />} />

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
