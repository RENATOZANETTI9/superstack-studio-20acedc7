import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { AppRole } from '@/lib/partner-rules';

export function useRoleGuard(allowed: AppRole[]) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }
    if (!role || !allowed.includes(role as AppRole)) {
      navigate(`/acesso-negado?from=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [role, isLoading, isAuthenticated, navigate, location.pathname, allowed]);
}