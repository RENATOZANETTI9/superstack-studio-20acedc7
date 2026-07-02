import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/auth" replace />;

  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <Outlet />;
}