/**
 * Mock data for all Partner submenus.
 * Used as fallback when no real data exists from the backend.
 * The production developer should replace these with real API calls.
 */

export const MOCK_PARTNERS = [
  {
    id: 'p1', legal_name: 'Carlos Eduardo Silva', email: 'carlos@parceiro.com', phone: '(11) 99876-5432',
    document_number: '123.456.789-00', person_type: 'CPF', type: 'MASTER', status: 'ACTIVE',
    region_state: 'SP', region_city: 'São Paulo', seh_score: 82.5, idr_score: 78,
    current_level: 'MASTER', years_in_health_market: 8, monthly_relationship_clinics: 15,
    created_at: '2024-06-15T10:00:00Z', activated_at: '2024-06-20T14:00:00Z',
    onboarded_at: '2024-06-18T09:00:00Z', user_id: 'u1', updated_at: '2025-04-01T10:00:00Z',
    suspended_at: null,
  },
  {
    id: 'p2', legal_name: 'Ana Paula Mendes', email: 'ana@parceira.com', phone: '(21) 98765-1234',
    document_number: '987.654.321-00', person_type: 'CPF', type: 'PARTNER', status: 'ACTIVE',
    region_state: 'RJ', region_city: 'Rio de Janeiro', seh_score: 67.3, idr_score: 61,
    current_level: 'PARTNER', years_in_health_market: 3, monthly_relationship_clinics: 8,
    created_at: '2024-08-10T10:00:00Z', activated_at: '2024-08-15T14:00:00Z',
    onboarded_at: '2024-08-12T09:00:00Z', user_id: 'u2', updated_at: '2025-03-20T10:00:00Z',
    suspended_at: null,
  },
  {
    id: 'p3', legal_name: 'Roberto Almeida Santos', email: 'roberto@parceiro.com', phone: '(31) 97654-3210',
    document_number: '456.789.123-00', person_type: 'CPF', type: 'PARTNER', status: 'ACTIVE',
    region_state: 'MG', region_city: 'Belo Horizonte', seh_score: 54.8, idr_score: 50,
    current_level: 'PARTNER', years_in_health_market: 5, monthly_relationship_clinics: 6,
    created_at: '2024-09-05T10:00:00Z', activated_at: '2024-09-10T14:00:00Z',
    onboarded_at: '2024-09-07T09:00:00Z', user_id: 'u3', updated_at: '2025-03-15T10:00:00Z',
    suspended_at: null,
  },
  {
    id: 'p4', legal_name: 'Juliana Costa Ferreira', email: 'juliana@parceira.com', phone: '(41) 96543-2109',
    document_number: '321.654.987-00', person_type: 'CPF', type: 'PARTNER', status: 'PENDING',
    region_state: 'PR', region_city: 'Curitiba', seh_score: 0, idr_score: 0,
    current_level: 'PARTNER', years_in_health_market: 2, monthly_relationship_clinics: 3,
    created_at: '2025-03-20T10:00:00Z', activated_at: null,
    onboarded_at: null, user_id: 'u4', updated_at: '2025-03-20T10:00:00Z',
    suspended_at: null,
  },
  {
    id: 'p5', legal_name: 'Marcos Vinícius Oliveira', email: 'marcos@parceiro.com', phone: '(51) 95432-1098',
    document_number: '654.321.987-00', person_type: 'CPF', type: 'PARTNER', status: 'SUSPENDED',
    region_state: 'RS', region_city: 'Porto Alegre', seh_score: 32.1, idr_score: 28,
    current_level: 'PARTNER', years_in_health_market: 1, monthly_relationship_clinics: 2,
    created_at: '2024-07-01T10:00:00Z', activated_at: '2024-07-05T14:00:00Z',
    onboarded_at: '2024-07-03T09:00:00Z', user_id: 'u5', updated_at: '2025-02-10T10:00:00Z',
    suspended_at: '2025-02-10T10:00:00Z',
  },
];

export const MOCK_CLINICS = [
  { id: 'c1', partner_id: 'p1', clinic_name: 'Clínica Sorriso Feliz', clinic_external_id: 'ext-001', is_active: true, is_qualified: true, consultations_count: 245, approvals_count: 28, paid_count: 12, qualified_at: '2024-10-01T00:00:00Z', created_at: '2024-07-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c2', partner_id: 'p1', clinic_name: 'OdontoVida Premium', clinic_external_id: 'ext-002', is_active: true, is_qualified: true, consultations_count: 189, approvals_count: 22, paid_count: 9, qualified_at: '2024-11-15T00:00:00Z', created_at: '2024-08-15T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c3', partner_id: 'p1', clinic_name: 'Centro Médico Saúde+', clinic_external_id: 'ext-003', is_active: true, is_qualified: false, consultations_count: 67, approvals_count: 5, paid_count: 2, qualified_at: null, created_at: '2025-01-10T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c4', partner_id: 'p1', clinic_name: 'Clínica Nova Era (inativa)', clinic_external_id: 'ext-004', is_active: false, is_qualified: false, consultations_count: 15, approvals_count: 1, paid_count: 0, qualified_at: null, created_at: '2024-09-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c5', partner_id: 'p2', clinic_name: 'Estética Carioca', clinic_external_id: 'ext-005', is_active: true, is_qualified: true, consultations_count: 312, approvals_count: 35, paid_count: 15, qualified_at: '2024-12-01T00:00:00Z', created_at: '2024-08-20T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c6', partner_id: 'p2', clinic_name: 'OdontoPlan Rio', clinic_external_id: 'ext-006', is_active: true, is_qualified: false, consultations_count: 98, approvals_count: 8, paid_count: 3, qualified_at: null, created_at: '2024-10-05T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c7', partner_id: 'p3', clinic_name: 'Clínica BH Sorriso', clinic_external_id: 'ext-007', is_active: true, is_qualified: true, consultations_count: 156, approvals_count: 18, paid_count: 7, qualified_at: '2025-01-15T00:00:00Z', created_at: '2024-09-15T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c8', partner_id: 'p3', clinic_name: 'Centro Odonto Minas', clinic_external_id: 'ext-008', is_active: true, is_qualified: false, consultations_count: 45, approvals_count: 3, paid_count: 1, qualified_at: null, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', registered_via_link_id: null },
  { id: 'c9', partner_id: 'p3', clinic_name: 'Clínica Saúde Total', clinic_external_id: 'ext-009', is_active: false, is_qualified: false, consultations_count: 8, approvals_count: 0, paid_count: 0, qualified_at: null, created_at: '2024-11-01T00:00:00Z', updated_at: '2025-01-15T00:00:00Z', registered_via_link_id: null },
  { id: 'c10', partner_id: 'p5', clinic_name: 'Odonto Sul', clinic_external_id: 'ext-010', is_active: false, is_qualified: false, consultations_count: 22, approvals_count: 2, paid_count: 0, qualified_at: null, created_at: '2024-07-10T00:00:00Z', updated_at: '2025-02-10T00:00:00Z', registered_via_link_id: null },
];

export const MOCK_NETWORK = [
  { id: 'n1', parent_partner_id: 'p1', child_partner_id: 'p2', is_active: true, relationship_type: 'INDICATION', linked_at: '2024-08-10T10:00:00Z', unlinked_at: null, created_at: '2024-08-10T10:00:00Z' },
  { id: 'n2', parent_partner_id: 'p1', child_partner_id: 'p3', is_active: true, relationship_type: 'INDICATION', linked_at: '2024-09-05T10:00:00Z', unlinked_at: null, created_at: '2024-09-05T10:00:00Z' },
  { id: 'n3', parent_partner_id: 'p1', child_partner_id: 'p5', is_active: false, relationship_type: 'INDICATION', linked_at: '2024-07-01T10:00:00Z', unlinked_at: '2025-02-10T10:00:00Z', created_at: '2024-07-01T10:00:00Z' },
];

export const MOCK_LINKS = [
  { id: 'l1', partner_id: 'p1', link_code: 'CARLOS2024', link_url: 'https://app.helpude.com/r/CARLOS2024', link_type: 'RECRUITMENT', is_active: true, uses_count: 12, max_uses: null, expires_at: null, created_at: '2024-06-20T00:00:00Z' },
  { id: 'l2', partner_id: 'p1', link_code: 'CARLOSMED', link_url: 'https://app.helpude.com/r/CARLOSMED', link_type: 'CLINIC', is_active: true, uses_count: 8, max_uses: 50, expires_at: null, created_at: '2024-07-01T00:00:00Z' },
  { id: 'l3', partner_id: 'p2', link_code: 'ANARJ2024', link_url: 'https://app.helpude.com/r/ANARJ2024', link_type: 'CLINIC', is_active: true, uses_count: 5, max_uses: null, expires_at: null, created_at: '2024-08-20T00:00:00Z' },
  { id: 'l4', partner_id: 'p3', link_code: 'ROBERTOBH', link_url: 'https://app.helpude.com/r/ROBERTOBH', link_type: 'CLINIC', is_active: true, uses_count: 3, max_uses: null, expires_at: null, created_at: '2024-09-15T00:00:00Z' },
];

export const MOCK_METRICS_DAILY = [
  { id: 'm1', partner_id: 'p1', metric_date: '2025-04-01', consultations: 42, approvals: 5, paid_contracts: 2, paid_amount: 7000, active_clinics: 3, qualified_clinics: 2, total_clinics_direct: 4, seh_score: 82.5, approval_rate: 11.9, paid_rate: 40, potential_lost_amount: 0, created_at: '2025-04-01T23:00:00Z' },
  { id: 'm2', partner_id: 'p1', metric_date: '2025-03-31', consultations: 38, approvals: 4, paid_contracts: 2, paid_amount: 7500, active_clinics: 3, qualified_clinics: 2, total_clinics_direct: 4, seh_score: 80.1, approval_rate: 10.5, paid_rate: 50, potential_lost_amount: 0, created_at: '2025-03-31T23:00:00Z' },
  { id: 'm3', partner_id: 'p1', metric_date: '2025-03-30', consultations: 45, approvals: 6, paid_contracts: 3, paid_amount: 10500, active_clinics: 3, qualified_clinics: 2, total_clinics_direct: 4, seh_score: 84.2, approval_rate: 13.3, paid_rate: 50, potential_lost_amount: 0, created_at: '2025-03-30T23:00:00Z' },
  { id: 'm4', partner_id: 'p2', metric_date: '2025-04-01', consultations: 28, approvals: 3, paid_contracts: 1, paid_amount: 3500, active_clinics: 2, qualified_clinics: 1, total_clinics_direct: 2, seh_score: 67.3, approval_rate: 10.7, paid_rate: 33.3, potential_lost_amount: 0, created_at: '2025-04-01T23:00:00Z' },
  { id: 'm5', partner_id: 'p2', metric_date: '2025-03-31', consultations: 25, approvals: 2, paid_contracts: 1, paid_amount: 4000, active_clinics: 2, qualified_clinics: 1, total_clinics_direct: 2, seh_score: 65.0, approval_rate: 8.0, paid_rate: 50, potential_lost_amount: 0, created_at: '2025-03-31T23:00:00Z' },
  { id: 'm6', partner_id: 'p3', metric_date: '2025-04-01', consultations: 18, approvals: 2, paid_contracts: 1, paid_amount: 3500, active_clinics: 2, qualified_clinics: 1, total_clinics_direct: 3, seh_score: 54.8, approval_rate: 11.1, paid_rate: 50, potential_lost_amount: 0, created_at: '2025-04-01T23:00:00Z' },
];

export const MOCK_COMMISSIONS = [
  { id: 'com1', partner_id: 'p1', beneficiary_partner_id: 'p1', commission_type: 'DIRECT', reference_month: '2025-03', net_paid_amount: 35000, commission_rate: 0.016, commission_amount: 560, status: 'PAID', paid_at: '2025-04-05T00:00:00Z', approved_at: '2025-04-03T00:00:00Z', source_paid_contract_id: 'sc1', clinic_external_id: 'ext-001', calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-05T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'com2', partner_id: 'p1', beneficiary_partner_id: 'p1', commission_type: 'OVERRIDE', reference_month: '2025-03', net_paid_amount: 18000, commission_rate: 0.002, commission_amount: 36, status: 'PAID', paid_at: '2025-04-05T00:00:00Z', approved_at: '2025-04-03T00:00:00Z', source_paid_contract_id: 'sc2', clinic_external_id: 'ext-005', calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-05T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'com3', partner_id: 'p2', beneficiary_partner_id: 'p2', commission_type: 'DIRECT', reference_month: '2025-03', net_paid_amount: 22500, commission_rate: 0.016, commission_amount: 360, status: 'APPROVED', paid_at: null, approved_at: '2025-04-03T00:00:00Z', source_paid_contract_id: 'sc3', clinic_external_id: 'ext-005', calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-03T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'com4', partner_id: 'p3', beneficiary_partner_id: 'p3', commission_type: 'DIRECT', reference_month: '2025-03', net_paid_amount: 14000, commission_rate: 0.016, commission_amount: 224, status: 'CALCULATED', paid_at: null, approved_at: null, source_paid_contract_id: 'sc4', clinic_external_id: 'ext-007', calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'com5', partner_id: 'p1', beneficiary_partner_id: 'p1', commission_type: 'DIRECT', reference_month: '2025-02', net_paid_amount: 28000, commission_rate: 0.016, commission_amount: 448, status: 'PAID', paid_at: '2025-03-05T00:00:00Z', approved_at: '2025-03-03T00:00:00Z', source_paid_contract_id: 'sc5', clinic_external_id: 'ext-002', calculated_at: '2025-03-01T00:00:00Z', created_at: '2025-03-01T00:00:00Z', updated_at: '2025-03-05T00:00:00Z', audit_hash: null, job_id: null },
];

export const MOCK_ALERTS = [
  { id: 'a1', partner_id: 'p3', alert_type: 'LOW_VOLUME', severity: 'HIGH', title: 'Volume abaixo da meta', description: 'Partner Roberto Almeida está com volume de simulações 35% abaixo da meta mensal.', alert_date: '2025-04-10T10:00:00Z', resolved_at: null, resolved_by: null, action_taken: null, clinic_relation_id: null, metadata: null, created_at: '2025-04-10T10:00:00Z' },
  { id: 'a2', partner_id: 'p5', alert_type: 'INACTIVITY', severity: 'CRITICAL', title: 'Partner sem atividade há 60 dias', description: 'Partner Marcos Vinícius não registra nenhuma atividade desde 10/02/2025.', alert_date: '2025-04-08T10:00:00Z', resolved_at: null, resolved_by: null, action_taken: null, clinic_relation_id: null, metadata: null, created_at: '2025-04-08T10:00:00Z' },
  { id: 'a3', partner_id: 'p2', alert_type: 'CONVERSION_DROP', severity: 'MEDIUM', title: 'Queda na taxa de conversão', description: 'Clínica Estética Carioca apresentou queda de 25% na taxa de conversão no último mês.', alert_date: '2025-04-05T10:00:00Z', resolved_at: null, resolved_by: null, action_taken: null, clinic_relation_id: 'c5', metadata: null, created_at: '2025-04-05T10:00:00Z' },
];

export const MOCK_INCENTIVES = [
  { id: 'inc1', clinic_user_id: 'att1', clinic_external_id: 'ext-001', incentive_type: 'MIMO_SEMANAL', reference_month: '2025-03', reference_week: 1, incentive_amount: 50, status: 'DELIVERED', pix_key: null, pix_tier: null, cpfs_generated: 35, consultations_generated: 35, paid_amount_generated: null, paid_at: null, calculated_at: '2025-03-07T00:00:00Z', created_at: '2025-03-07T00:00:00Z', updated_at: '2025-03-08T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'inc2', clinic_user_id: 'att1', clinic_external_id: 'ext-001', incentive_type: 'PIX_MENSAL', reference_month: '2025-03', reference_week: null, incentive_amount: 200, status: 'CALCULATED', pix_key: '123.456.789-00', pix_tier: 'R$ 10.001 – R$ 30.000', cpfs_generated: null, consultations_generated: null, paid_amount_generated: 15000, paid_at: null, calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'inc3', clinic_user_id: 'att2', clinic_external_id: 'ext-005', incentive_type: 'MIMO_SEMANAL', reference_month: '2025-03', reference_week: 2, incentive_amount: 75, status: 'PENDING', pix_key: null, pix_tier: null, cpfs_generated: 52, consultations_generated: 52, paid_amount_generated: null, paid_at: null, calculated_at: '2025-03-14T00:00:00Z', created_at: '2025-03-14T00:00:00Z', updated_at: '2025-03-14T00:00:00Z', audit_hash: null, job_id: null },
  { id: 'inc4', clinic_user_id: 'att2', clinic_external_id: 'ext-005', incentive_type: 'PIX_MENSAL', reference_month: '2025-03', reference_week: null, incentive_amount: 300, status: 'PAID', pix_key: '987.654.321-00', pix_tier: 'R$ 30.001 – R$ 60.000', cpfs_generated: null, consultations_generated: null, paid_amount_generated: 42000, paid_at: '2025-04-05T00:00:00Z', calculated_at: '2025-04-01T00:00:00Z', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-05T00:00:00Z', audit_hash: null, job_id: null },
];

export const MOCK_CONFIG_HISTORY = [
  { id: 'ch1', config_id: 'cfg1', config_key: 'commission_rate_direct', old_value: { rate: 0.015 }, new_value: { rate: 0.016 }, changed_by: 'u1', created_at: '2025-03-01T10:00:00Z' },
  { id: 'ch2', config_id: 'cfg2', config_key: 'seh_weights', old_value: { volume: 0.40, conversion: 0.60 }, new_value: { volume: 0.50, conversion: 0.50 }, changed_by: 'u1', created_at: '2025-02-15T14:00:00Z' },
];

export const MOCK_MASTER_NETWORK_METRICS = [
  { id: 'mnm1', master_partner_id: 'p1', metric_date: '2025-04-01', total_network_partners: 3, active_network_partners: 2, network_clinics_total: 6, network_clinics_active: 4, network_consultations: 611, network_approvals: 43, network_paid_contracts: 19, network_paid_amount: 66500, override_amount: 133, idr_score: 78, created_at: '2025-04-01T23:00:00Z' },
];

/**
 * Helper: use mock data when real data is empty.
 */
export function withMockFallback<T>(realData: T[] | null | undefined, mockData: T[]): T[] {
  const data = realData || [];
  return data.length > 0 ? data : mockData;
}
