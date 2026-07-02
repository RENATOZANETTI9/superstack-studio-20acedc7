import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isRepresentanteRole } from '@/lib/partner-rules';

/**
 * Catch-all for unknown /dashboard/representantes/* URLs.
 * Sends partner-like roles to their default page (/rota) and everyone else
 * back to the representantes module dashboard.
 */
export const RepresentantesCatchAll = () => {
  const { role } = useAuth();
  const isRepresentante = isRepresentanteRole(role as any);

  if (isRepresentanteRole) {
    return <Navigate to="/dashboard/representantes/rota" replace />;
  }
  return <Navigate to="/dashboard/representantes" replace />;
};

export default RepresentantesCatchAll;