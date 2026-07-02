import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Catch-all for unknown /dashboard/representantes/* URLs.
 * Sends partner-like roles to their default page (/rota) and everyone else
 * back to the representantes module dashboard.
 */
export const RepresentantesCatchAll = () => {
  const { role } = useAuth();
  const isRepresentanteRole =
    role === 'master_partner' || role === 'partner' || (role as string) === 'representante';

  if (isRepresentanteRole) {
    return <Navigate to="/dashboard/representantes/rota" replace />;
  }
  return <Navigate to="/dashboard/representantes" replace />;
};

export default RepresentantesCatchAll;