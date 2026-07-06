import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global gate: if the authenticated user has `must_change_password = true`,
 * force redirect to /change-password. Public routes and the change-password
 * page itself are exempt.
 */
const EXEMPT_PATHS = new Set<string>([
  '/',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/change-password',
  '/register/partner',
  '/cadastroclinica',
  '/cadastropartner',
  '/termos-de-uso',
  '/politica-de-privacidade',
  '/acesso-negado',
]);

export function MustChangePasswordGate({ children }: { children: ReactNode }) {
  const { user, isLoading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) return <>{children}</>;
  if (!user) return <>{children}</>;
  if (!mustChangePassword) return <>{children}</>;
  if (EXEMPT_PATHS.has(location.pathname)) return <>{children}</>;

  return <Navigate to="/change-password" replace />;
}