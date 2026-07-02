import { Link, useSearchParams } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForRole } from '@/lib/permissions-matrix';
import type { AppRole } from '@/lib/partner-rules';

const AccessDenied = () => {
  const { role } = useAuth();
  const [params] = useSearchParams();
  const from = params.get('from');
  const home = getDefaultRouteForRole(role as AppRole | null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div
        role="alert"
        aria-labelledby="access-denied-title"
        className="max-w-md rounded-2xl border border-border bg-card/60 p-8 text-center shadow-xl backdrop-blur"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 id="access-denied-title" className="mb-2 text-2xl font-bold text-foreground">
          Acesso negado
        </h1>
        <p className="mb-1 text-sm text-muted-foreground">
          Você não tem permissão para acessar esta área.
        </p>
        {from && (
          <p className="mb-6 text-xs text-muted-foreground/80">
            Rota bloqueada: <code className="rounded bg-muted px-1 py-0.5">{from}</code>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link to={home}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para minha área
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;