/**
 * Centralized partner business rules - parametrizable, no hardcoded logic in components.
 */

export const PARTNER_RULES = {
  /** Minimum paid amount (R$) in network to be promoted to Master Partner */
  MASTER_PROMOTION_THRESHOLD_AMOUNT: 30000,
  
  /** Minimum consultations to qualify a clinic (configurable) */
  QUALIFICATION_THRESHOLD: 30,
  
  /** Commission rates */
  COMMISSION_RATE_DIRECT: 0.016,   // 1.6%
  COMMISSION_RATE_OVERRIDE: 0.002, // 0.2%
  
  /** Mimo tiers (weekly, paid by partner) */
  MIMO_TIERS: [
    { min: 0, max: 30, label: '0–30 simulações', mimo: 'Mimo Tipo 1', description: 'Brinde básico' },
    { min: 31, max: 60, label: '31–60 simulações', mimo: 'Mimo Tipo 2', description: 'Brinde intermediário' },
    { min: 61, max: 100, label: '61–100 simulações', mimo: 'Mimo Tipo 3', description: 'Brinde premium' },
    { min: 101, max: Infinity, label: '101+ simulações', mimo: 'Mimo Tipo 4', description: 'Brinde especial' },
  ],
  
  /** PIX tiers (monthly, paid by Help Ude) */
  PIX_TIERS: [
    { min: 5000, max: 10000, label: 'R$ 5.000 – R$ 10.000', pix: 'R$ 100' },
    { min: 10001, max: 30000, label: 'R$ 10.001 – R$ 30.000', pix: 'R$ 200' },
    { min: 30001, max: 60000, label: 'R$ 30.001 – R$ 60.000', pix: 'R$ 300' },
    { min: 60001, max: 120000, label: 'R$ 60.001 – R$ 120.000', pix: 'R$ 500' },
    { min: 121000, max: 240000, label: 'R$ 121.000 – R$ 240.000', pix: 'R$ 800' },
    { min: 240001, max: Infinity, label: 'Acima de R$ 240.000', pix: 'R$ 1.200' },
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
export type AppRole = 'master' | 'user' | 'partner' | 'master_partner' | 'cs_geral' | 'cs_exclusiva' | 'clinic_owner' | 'attendant' | 'admin';

export const isAdminRole = (role: AppRole | null): boolean => {
  return role === 'master' || role === 'admin';
};

export const isPartnerRole = (role: AppRole | null): boolean => {
  return role === 'partner' || role === 'master_partner';
};

export const canAccessConfig = (role: AppRole | null): boolean => isAdminRole(role);
export const canAccessMonitoring = (role: AppRole | null): boolean => isAdminRole(role);
export const canAccessUsersMenu = (role: AppRole | null): boolean => isAdminRole(role);
export const canEditPartner = (role: AppRole | null): boolean => isAdminRole(role);

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
