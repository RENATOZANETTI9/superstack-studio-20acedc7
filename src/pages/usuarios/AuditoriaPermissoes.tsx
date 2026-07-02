import { useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Download } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import {
  ALL_PERMISSIONS,
  HIERARCHY_MATRIX,
  buildHierarchyMatrixCsv,
  canAccessMenu,
  type MenuKey,
} from '@/lib/permissions-matrix';
import type { AppRole } from '@/lib/partner-rules';

const MENU_LABELS: Record<MenuKey, string> = {
  dashboard: 'Dashboard geral',
  buscar_credito: 'Buscar Crédito',
  creditos_aprovados: 'Créditos Aprovados',
  usuarios: 'Gestão de Usuários',
  representantes_painel: 'Representantes • Painel',
  representantes_rota: 'Representantes • Minha Rota',
  representantes_perfil: 'Representantes • Perfil',
  representantes_cadastro: 'Representantes • Cadastro',
  representantes_clinicas: 'Representantes • Clínicas',
  representantes_bonificacoes: 'Representantes • Bonificações',
  representantes_simulador: 'Representantes • Simulador',
  representantes_marketing: 'Representantes • Marketing',
  representantes_simulacoes: 'Representantes • Simulações',
  representantes_config: 'Representantes • Configurações',
  representantes_monitoramento: 'Representantes • Monitoramento',
  clinicas_admin: 'Clínicas (admin)',
  auditoria_permissoes: 'Auditoria de Permissões',
};

const ROLES_FOR_MENUS: { role: AppRole; label: string }[] = [
  { role: 'admin', label: 'Admin' },
  { role: 'master', label: 'Master' },
  { role: 'master_partner', label: 'Master Partner' },
  { role: 'partner', label: 'Partner' },
  { role: 'representante', label: 'Representante' },
  { role: 'cs_geral', label: 'CS Geral' },
  { role: 'cs_exclusiva', label: 'CS Exclusiva' },
  { role: 'attendant', label: 'Atendente' },
  { role: 'clinic_owner', label: 'Dono Clínica' },
  { role: 'user', label: 'Usuário' },
];

const Yes = () => (
  <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="permitido" />
);
const No = () => (
  <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="bloqueado" />
);

const AuditoriaPermissoes = () => {
  useRoleGuard(['admin', 'master']);

  const csv = useMemo(() => buildHierarchyMatrixCsv(), []);

  const download = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria-permissoes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria de Permissões</h1>
            <p className="text-muted-foreground">
              Matriz por hierarquia (CS / SDR / CS+SDR / Representante) e impacto nos menus por role.
            </p>
          </div>
          <Button onClick={download} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permissões por hierarquia</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium">Permissão</th>
                  {HIERARCHY_MATRIX.map((h) => (
                    <th key={h.id} className="px-2 py-2 text-center font-medium">
                      {h.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((p) => (
                  <tr key={p} className="border-b border-border/40">
                    <td className="py-1.5 pr-4 font-mono text-xs text-muted-foreground">{p}</td>
                    {HIERARCHY_MATRIX.map((h) => (
                      <td key={h.id} className="px-2 py-1.5 text-center">
                        {h.permissions.includes(p) ? <Yes /> : <No />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impacto nos menus por role</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-4 font-medium">Menu</th>
                  {ROLES_FOR_MENUS.map((r) => (
                    <th key={r.role} className="px-2 py-2 text-center font-medium">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(MENU_LABELS) as MenuKey[]).map((key) => (
                  <tr key={key} className="border-b border-border/40">
                    <td className="py-1.5 pr-4">{MENU_LABELS[key]}</td>
                    {ROLES_FOR_MENUS.map((r) => (
                      <td key={r.role} className="px-2 py-1.5 text-center">
                        {canAccessMenu(r.role, key) ? <Yes /> : <No />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-2">Nota</Badge>
          Representante enxerga apenas registros que ele mesmo cadastrou (filtros por ownership aplicados nos hooks).
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditoriaPermissoes;