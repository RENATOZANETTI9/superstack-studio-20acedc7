/**
 * Centralized partner business rules - parametrizable, no hardcoded logic in components.
 */

export const PARTNER_RULES = {
  /** Minimum paid amount (R$) in network to be promoted to Master Partner */
  MASTER_PROMOTION_THRESHOLD_AMOUNT: 30000,
  
  /** Minimum consultations to qualify a clinic (configurable) */
  QUALIFICATION_THRESHOLD: 30,
  
  /** Commission rates */
  COMMISSION_RATE_DIRECT: 0.008,   // 0.80%
  COMMISSION_RATE_OVERRIDE: 0.002, // 0.2%
  SIMULATOR_COMMISSION_RATE: 0.0075, // 0.75% — used only in simulator projections
  
  /** PIX tiers (monthly, paid by Help Ude) */
  PIX_TIERS: [
    { min: 5000, max: 10000, label: 'R$ 5.000 – R$ 10.000', pix: 'R$ 50,00', value: 50 },
    { min: 10001, max: 30000, label: 'R$ 10.001 – R$ 30.000', pix: 'R$ 100,00', value: 100 },
    { min: 30001, max: 60000, label: 'R$ 30.001 – R$ 60.000', pix: 'R$ 300,00', value: 300 },
    { min: 60001, max: 120000, label: 'R$ 60.001 – R$ 120.000', pix: 'R$ 600,00', value: 600 },
    { min: 120001, max: 240000, label: 'R$ 120.001 – R$ 240.000', pix: 'R$ 1.200,00', value: 1200 },
    { min: 240001, max: Infinity, label: 'Acima de R$ 240.000', pix: 'R$ 2.400,00', value: 2400 },
  ],
  
  /** SEH weights (only volume + conversion, no activation) */
  SEH_WEIGHTS: { volume: 0.50, conversion: 0.50 },
  
  /** SEH reference values */
  SEH_REFERENCE: {
    /** Simulations per clinic per day */
    SIMULATIONS_PER_DAY: 5,
    /** Working days per month */
    WORKING_DAYS: 20,
    /** Approval rate reference */
    APPROVAL_RATE: 0.10,
    /** Paid rate (of total simulations) reference */
    PAID_RATE: 0.10,
    /** Average ticket */
    AVG_TICKET: 3500,
  },
  
  /** Partner types */
  PARTNER_TYPES: ['PARTNER', 'MASTER'] as const,
};

export const TYPE_COLORS: Record<string, string> = {
  PARTNER: 'bg-primary text-white',
  MASTER: 'bg-purple-600 text-white',
};

/** Unified Mimo tiers — single source of truth (weekly, paid by partner). */
export const MIMO_TIERS = [
  { min: 20, max: 34, label: 'Mimo Tipo 1', level: 1 },
  { min: 35, max: 49, label: 'Mimo Tipo 2', level: 2 },
  { min: 50, max: 69, label: 'Mimo Tipo 3', level: 3 },
  { min: 70, max: Infinity, label: 'Mimo Tipo 4', level: 4 },
] as const;

export type MimoTier = typeof MIMO_TIERS[number];

export function getMimoTier(simulacoes: number): MimoTier | null {
  return MIMO_TIERS.find((t) => simulacoes >= t.min && simulacoes <= t.max) ?? null;
}

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  SUSPENDED: 'Suspenso',
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  CALCULATED: 'Calculado',
  READY_FOR_PAYOUT: 'Pronto p/ Pagamento',
  APPROVED: 'Aprovado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

export const COMMISSION_STATUS_COLORS: Record<string, string> = {
  CALCULATED: 'bg-blue-100 text-blue-800',
  READY_FOR_PAYOUT: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

/** Roles that have admin-level access */
export type AppRole = 'master' | 'user' | 'partner' | 'master_partner' | 'cs_geral' | 'cs_exclusiva' | 'clinic_owner' | 'attendant' | 'admin' | 'representante';

export const isAdminRole = (role: AppRole | null): boolean => {
  return role === 'master' || role === 'admin';
};

export const isPartnerRole = (role: AppRole | null): boolean => {
  return role === 'partner' || role === 'master_partner';
};

/** Roles that participate in the representantes module as field users (not admins). */
export const isRepresentanteRole = (role: AppRole | null): boolean => {
  return role === 'partner' || role === 'master_partner' || role === 'representante';
};

export const canAccessConfig = (role: AppRole | null): boolean => isAdminRole(role);
export const canAccessMonitoring = (role: AppRole | null): boolean => isAdminRole(role);
/**
 * "Gestão de Usuários" menu — admins get full access; representante gets a
 * restricted view (scoped to records they own).
 */
export const canAccessUsersMenu = (role: AppRole | null): boolean =>
  isAdminRole(role) || role === 'representante';
export const canEditPartner = (role: AppRole | null): boolean => isAdminRole(role);
export const canAccessRepresentantes = (role: AppRole | null): boolean => {
  return (
    role === 'master' ||
    role === 'admin' ||
    role === 'master_partner' ||
    role === 'partner' ||
    role === 'representante'
  );
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
