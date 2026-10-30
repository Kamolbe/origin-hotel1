import { useAppData } from '../context/AppDataContext';
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { user } = useAuth();
  const { data } = useAppData();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ ...(location.state ?? {}), from: location.pathname }} />;
  if (data.serverPermissions && ['/app/finance','/app/reports'].some((path)=>location.pathname.startsWith(path)) && !data.serverPermissions.includes('hotel.view_financeentry')) return <Navigate to="/unauthorized" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
