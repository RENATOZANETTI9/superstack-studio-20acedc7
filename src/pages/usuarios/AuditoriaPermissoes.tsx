import { useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Download, Eye, EyeOff, ArrowRightCircle, ShieldAlert } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import {
  ALL_PERMISSIONS,
  HIERARCHY_MATRIX,
  buildHierarchyMatrixCsv,
  canAccessMenu,
  getMenuImpact,
  type MenuImpact,
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

const IMPACT_META: Record<MenuImpact, { label: string; icon: typeof Eye; className: string; description: string }> = {
  visible: {
    label: 'Visível',
    icon: Eye,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    description: 'Item aparece no menu e a rota renderiza normalmente.',
  },
  redirect: {
    label: 'Redirect → /rota',
    icon: ArrowRightCircle,
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    description: 'Item oculto; guard redireciona para /dashboard/representantes/rota.',
  },
  forbidden: {
    label: '403 negado',
    icon: ShieldAlert,
    className: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    description: 'Item oculto; guard envia para /acesso-negado.',
  },
};

const ImpactCell = ({ impact }: { impact: MenuImpact }) => {
  const meta = IMPACT_META[impact];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}
      aria-label={meta.description}
      title={meta.description}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
};

const AuditoriaPermissoes = () => {
  useRoleGuard(['admin', 'master']);

  const csv = useMemo(() => buildHierarchyMatrixCsv(), []);

  const menuKeys = Object.keys(MENU_LABELS) as MenuKey[];

  /** Aggregated counts per role for the summary strip above the impact table */
  const impactSummary = useMemo(() => {
    return ROLES_FOR_MENUS.map(({ role, label }) => {
      const counts: Record<MenuImpact, number> = { visible: 0, redirect: 0, forbidden: 0 };
      menuKeys.forEach((key) => {
        counts[getMenuImpact(role, key)] += 1;
      });
      return { role, label, counts };
    });
  }, [menuKeys]);

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

        <Card>
          <CardHeader>
            <CardTitle>Impacto real por role (antes de exportar)</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Consolida o que a matriz + os guards produzem em runtime: item{' '}
              <strong>visível</strong>, <strong>redirect</strong> para <code>/rota</code> ou{' '}
              <strong>403</strong> em <code>/acesso-negado</code>.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
              {(Object.keys(IMPACT_META) as MenuImpact[]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <ImpactCell impact={k} />
                  <span className="text-muted-foreground">{IMPACT_META[k].description}</span>
                </div>
              ))}
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {impactSummary.map(({ role, label, counts }) => (
                <div key={role} className="rounded-lg border border-border/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <Eye className="h-3 w-3" />{counts.visible}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <ArrowRightCircle className="h-3 w-3" />{counts.redirect}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <EyeOff className="h-3 w-3" />{counts.forbidden}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed impact table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
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
                  {menuKeys.map((key) => (
                    <tr key={key} className="border-b border-border/40">
                      <td className="py-1.5 pr-4">{MENU_LABELS[key]}</td>
                      {ROLES_FOR_MENUS.map((r) => (
                        <td key={r.role} className="px-2 py-1.5 text-center">
                          <ImpactCell impact={getMenuImpact(r.role, key)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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