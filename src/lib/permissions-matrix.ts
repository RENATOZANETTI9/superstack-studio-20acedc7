/**
 * Matriz única de permissões por hierarquia + itens de menu por role.
 * Fonte da verdade usada por: AppSidebar, guards de rota, página Auditoria.
 */
import type { AppRole } from '@/lib/partner-rules';

export type MenuKey =
  | 'dashboard'
  | 'buscar_credito'
  | 'creditos_aprovados'
  | 'usuarios'
  | 'representantes_painel'
  | 'representantes_rota'
  | 'representantes_perfil'
  | 'representantes_cadastro'
  | 'representantes_clinicas'
  | 'representantes_bonificacoes'
  | 'representantes_simulador'
  | 'representantes_marketing'
  | 'representantes_simulacoes'
  | 'representantes_config'
  | 'representantes_monitoramento'
  | 'clinicas_admin'
  | 'auditoria_permissoes';

const ADMIN_ROLES: AppRole[] = ['admin', 'master'];
const REPRESENTANTE_LIKE: AppRole[] = ['master_partner', 'partner', 'representante'];

const MENU_MATRIX: Record<MenuKey, AppRole[]> = {
  dashboard: ['admin', 'master', 'user', 'cs_geral', 'cs_exclusiva', 'clinic_owner', 'attendant', 'master_partner', 'partner'],
  buscar_credito: ['admin', 'master', 'user', 'cs_geral', 'cs_exclusiva', 'clinic_owner', 'attendant'],
  creditos_aprovados: ['admin', 'master', 'user', 'cs_geral', 'cs_exclusiva', 'clinic_owner', 'attendant', 'representante'],
  usuarios: ['admin', 'master', 'representante'],
  representantes_painel: ADMIN_ROLES,
  representantes_rota: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_perfil: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_cadastro: ADMIN_ROLES,
  representantes_clinicas: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_bonificacoes: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_simulador: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_marketing: ADMIN_ROLES,
  representantes_simulacoes: [...ADMIN_ROLES, ...REPRESENTANTE_LIKE],
  representantes_config: ADMIN_ROLES,
  representantes_monitoramento: ADMIN_ROLES,
  clinicas_admin: ADMIN_ROLES,
  auditoria_permissoes: ADMIN_ROLES,
};

export const canAccessMenu = (role: AppRole | null, key: MenuKey): boolean => {
  if (!role) return false;
  return MENU_MATRIX[key].includes(role);
};

export const getAllowedMenuKeys = (role: AppRole | null): MenuKey[] => {
  if (!role) return [];
  return (Object.keys(MENU_MATRIX) as MenuKey[]).filter((k) => MENU_MATRIX[k].includes(role));
};

/** Rota default por role — usada por AccessDenied e catch-alls. */
export const getDefaultRouteForRole = (role: AppRole | null): string => {
  if (!role) return '/auth';
  if (REPRESENTANTE_LIKE.includes(role)) return '/dashboard/representantes/rota';
  return '/dashboard';
};

// ---------------------------------------------------------------------------
// Matriz de permissões por hierarquia (CS, SDR, CS+SDR, Representante, ...)
// Usada exclusivamente pela página de auditoria; espelha Hierarquias.tsx.
// ---------------------------------------------------------------------------

export interface HierarchyRow {
  id: string;
  title: string;
  permissions: string[];
}

export const ALL_PERMISSIONS: string[] = [
  'user_management_access', 'user_edit', 'user_show', 'user_delete', 'user_access', 'user_create',
  'clinica_edit', 'clinica_show', 'clinica_delete', 'clinica_access', 'clinica_create',
  'propostum_access', 'propostum_show', 'propostum_approve', 'propostum_cancel', 'propostum_delete',
  'simulacao_access', 'simulacao_create', 'simulacao_show', 'simulacao_delete',
  'paciente_access', 'paciente_create', 'paciente_edit', 'paciente_show', 'paciente_delete', 'paciente_sensitive_edit',
  'audit_log_access', 'audit_log_show',
  'user_alert_access', 'user_alert_create', 'user_alert_edit', 'user_alert_delete',
  'dashboard_access', 'onboarding_dashboard_access',
  'clinica_filial_create', 'clinica_sensitive_edit', 'clinica_edit_endereco',
  'user_create_atendente', 'user_create_aprovador', 'user_create_medico',
];

const CS_PERMS = [
  'user_management_access', 'user_access', 'clinica_edit', 'clinica_access', 'propostum_access',
  'propostum_show', 'simulacao_access', 'simulacao_create', 'paciente_access', 'paciente_create',
  'paciente_edit', 'audit_log_access', 'dashboard_access', 'clinica_filial_create',
  'user_create_atendente', 'clinica_edit_endereco',
];
const SDR_PERMS = [
  'user_management_access', 'user_access', 'propostum_access', 'propostum_show',
  'simulacao_access', 'dashboard_access', 'onboarding_dashboard_access',
];
const REPRESENTANTE_PERMS = Array.from(new Set([...CS_PERMS, ...SDR_PERMS, 'simulacao_show']));

export const HIERARCHY_MATRIX: HierarchyRow[] = [
  { id: 'cs', title: 'CS', permissions: CS_PERMS },
  { id: 'sdr', title: 'SDR', permissions: SDR_PERMS },
  { id: 'cs_sdr', title: 'CS + SDR', permissions: Array.from(new Set([...CS_PERMS, ...SDR_PERMS])) },
  { id: 'representante', title: 'Representante', permissions: REPRESENTANTE_PERMS },
];