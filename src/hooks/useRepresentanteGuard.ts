import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRepresentantes, isAdminRole, type AppRole } from '@/lib/partner-rules';

/**
 * Reusable route guard for /dashboard/representantes/* pages.
 *
 * Modes:
 *  - 'shared' (default): page is accessible to admin, master_partner, partner and representante.
 *    Users without any representantes access are redirected to /dashboard.
 *  - 'admin':   page is admin-only inside the representantes module.
 *    master_partner / partner / representante are redirected to /dashboard/representantes/rota.
 *    Any other non-admin role is redirected to /dashboard.
 */
export function useRepresentanteGuard(mode: 'admin' | 'shared' = 'shared') {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !role) return;
    const appRole = role as AppRole;
    const isRepresentanteRole =
      appRole === 'master_partner' || appRole === 'partner' || (appRole as string) === 'representante';
    const denied = () =>
      navigate(`/acesso-negado?from=${encodeURIComponent(location.pathname)}`, { replace: true });

    if (mode === 'admin') {
      if (isRepresentanteRole) {
        navigate('/dashboard/representantes/rota', { replace: true });
        return;
      }
      if (!isAdminRole(appRole)) {
        denied();
      }
      return;
    }

    // shared: allow admin + representante roles; block everyone else
    if (!canAccessRepresentantes(appRole) && !isRepresentanteRole) {
      denied();
    }
  }, [role, isLoading, navigate, mode, location.pathname]);
}

/**
 * Catch-all element used for unknown /dashboard/representantes/* routes:
 * representante-like roles land on /rota, everyone else on the module dashboard.
 */
export { RepresentantesCatchAll } from '@/components/representantes/RepresentantesCatchAll';