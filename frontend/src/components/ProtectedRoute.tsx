import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import type { UserRole } from '@/types';

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    const redirect = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/customer';
    return <Navigate to={redirect} replace />;
  }
  return <Outlet />;
}
