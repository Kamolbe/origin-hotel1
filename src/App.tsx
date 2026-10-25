import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './app/ProtectedRoute';
import { AppLayout } from './app/AppLayout';
import { UnauthorizedPage, NotFoundPage } from './pages/UtilityPages';
import type { UserRole } from './types';

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
function RouteFallback() {
  return <main role="status" aria-busy="true" className="mx-auto min-h-[55vh] w-full max-w-5xl bg-[var(--page)] px-5 py-12"><span className="sr-only">Sahifa yuklanmoqda</span><section className="surface animate-pulse rounded-3xl p-6 sm:p-8"><div className="skeleton h-2.5 w-24 rounded-full"/><div className="skeleton mt-5 h-8 w-56 rounded-lg"/><div className="skeleton mt-3 h-3 w-72 max-w-full rounded-full"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map((item)=><div key={item} className="rounded-2xl border border-[var(--line)] p-4"><div className="skeleton h-28 rounded-xl"/><div className="skeleton mt-4 h-3 w-3/4 rounded-full"/><div className="skeleton mt-3 h-2 w-1/2 rounded-full"/></div>)}</div></section></main>;
}

export function App() {
  return <Suspense fallback={<RouteFallback />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/rooms/:roomId" element={<RoomDetailsPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="guests" element={<ProtectedRoute roles={staffRoles}><GuestsPage /></ProtectedRoute>} />
      <Route path="bookings" element={<BookingsPage />} />
      <Route path="finance" element={<ProtectedRoute roles={staffRoles}><FinancePage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute roles={staffRoles}><ReportsPage /></ProtectedRoute>} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense>;
}
