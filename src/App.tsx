import { ServerSyncStatus } from './components/ServerSyncStatus';
import { UserPreferenceSync } from './components/UserPreferenceSync';
import { SiteAppearance } from './components/SiteAppearance';
import { MobileNavigation } from './components/MobileNavigation';
import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './app/ProtectedRoute';
import { AppLayout } from './app/AppLayout';
import { DashboardRouteSkeleton, MarketingRouteSkeleton } from './components/RouteSkeleton';
import { useVisitLog } from './hooks/useVisitLog';
import { UnauthorizedPage, NotFoundPage } from './pages/UtilityPages';
import type { UserRole } from './types';

const PublicRoomsPage = lazy(async () => ({ default: (await import('./pages/PublicRoomsPage')).PublicRoomsPage }));
const ContactPage = lazy(async () => ({ default: (await import('./pages/ContactPage')).ContactPage }));
const MyStayPage = lazy(async () => ({ default: (await import('./pages/MyStayPage')).MyStayPage }));
const RoomDetailsPage = lazy(async () => ({ default: (await import('./pages/RoomDetailsPage')).RoomDetailsPage }));
const LandingPage = lazy(async () => ({ default: (await import('./pages/LandingPage')).LandingPage }));
const LoginPage = lazy(async () => ({ default: (await import('./pages/LoginPage')).LoginPage }));
const DashboardPage = lazy(async () => ({ default: (await import('./pages/DashboardPage')).DashboardPage }));
const RoomsPage = lazy(async () => ({ default: (await import('./pages/RoomsPage')).RoomsPage }));
const GuestsPage = lazy(async () => ({ default: (await import('./pages/GuestsPage')).GuestsPage }));
const BookingsPage = lazy(async () => ({ default: (await import('./pages/BookingsPage')).BookingsPage }));
const FinancePage = lazy(async () => ({ default: (await import('./pages/FinancePage')).FinancePage }));
const ReportsPage = lazy(async () => ({ default: (await import('./pages/ReportsPage')).ReportsPage }));
const SettingsPage = lazy(async () => ({ default: (await import('./pages/SettingsPage')).SettingsPage }));
const ProfilePage = lazy(async () => ({ default: (await import('./pages/ProfilePage')).ProfilePage }));
const UsersPage = lazy(async () => ({ default: (await import('./pages/UsersPage')).UsersPage }));

const staffRoles: UserRole[] = ['admin', 'manager'];

/** The loading placeholder follows the shell the visitor is waiting for. */
function RouteFallback() {
  const { pathname } = useLocation();
  return pathname.startsWith('/app') ? <DashboardRouteSkeleton /> : <MarketingRouteSkeleton />;
}

export function App() {
  useVisitLog();
  return <><ServerSyncStatus /><UserPreferenceSync /><SiteAppearance /><Suspense fallback={<RouteFallback />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/rooms" element={<PublicRoomsPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="my-stay" element={<MyStayPage />} />
      <Route index element={<DashboardPage />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="guests" element={<ProtectedRoute roles={staffRoles}><GuestsPage /></ProtectedRoute>} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="finance" element={<ProtectedRoute roles={staffRoles}><FinancePage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute roles={staffRoles}><ReportsPage /></ProtectedRoute>} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="settings/:section" element={<SettingsPage />} />
      <Route path="settings/:section/:editorTab" element={<SettingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense><MobileNavigation /></>;
}
