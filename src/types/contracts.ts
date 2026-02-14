export type ContractStatus = 
  | 'AGUARDANDO_ASSINATURA'
  | 'PENDENCIAS_GERAIS'
  | 'PAGO'
  | 'EXPIRADO'
  | 'CANCELADO';

export type HistoryInteractionType = 'Ligação' | 'WhatsApp' | 'E-mail' | 'Mensagem' | 'Outro';
export type HistoryInteractionStatus = 'Falou com paciente' | 'Não atendeu' | 'Pediu para retornar' | 'Número incorreto' | 'Outro';

export interface Contract {
  id: string;
  lead_id: string;
  patient_name: string;
  cpf: string;
  proposal_number: string;
  bank_name: string;
  proposal_status: string;
  amount_released: number;
  installment_value: number;
  term_months: number;
  signature_link: string;
  link_generated_at: string;
  contract_status: ContractStatus;
  created_at: string;
  approved_at: string;
  signature_started_at?: string;
  signed_at?: string;
  paid_at?: string;
  expired_at?: string;
  cancelled_at?: string;
  pending_reason?: string;
  cancel_reason?: string;
}

export interface ContractHistoryItem {
  id: string;
  contract_id: string;
  date: string;
  user_name: string;
  type: HistoryInteractionType;
  status: HistoryInteractionStatus;
  observation: string;
}

export interface ScheduledReturn {
  id: string;
  contract_id: string;
  date: string;
  time: string;
  completed: boolean;
  created_at: string;
}

// Mock data
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const mockContracts: Contract[] = [
  {
    id: 'c1',
    lead_id: 'lead-1',
    patient_name: 'Maria Silva',
    cpf: '123.456.789-00',
    proposal_number: 'PROP-2024-001',
    bank_name: 'Banco UY3',
    proposal_status: 'Aprovada',
    amount_released: 15000,
    installment_value: 450.50,
    term_months: 36,
    signature_link: 'https://assinatura.exemplo.com/c1',
    link_generated_at: hoursAgo(12),
    contract_status: 'AGUARDANDO_ASSINATURA',
    created_at: daysAgo(3),
    approved_at: daysAgo(2),
  },
  {
    id: 'c2',
    lead_id: 'lead-2',
    patient_name: 'João Santos',
    cpf: '987.654.321-00',
    proposal_number: 'PROP-2024-002',
    bank_name: 'Banco Safra',
    proposal_status: 'Aprovada',
    amount_released: 22000,
    installment_value: 680.00,
    term_months: 48,
    signature_link: 'https://assinatura.exemplo.com/c2',
    link_generated_at: hoursAgo(5),
    contract_status: 'AGUARDANDO_ASSINATURA',
    created_at: daysAgo(5),
    approved_at: daysAgo(3),
  },
  {
    id: 'c3',
    lead_id: 'lead-3',
    patient_name: 'Ana Oliveira',
    cpf: '456.789.123-00',
    proposal_number: 'PROP-2024-003',
    bank_name: 'Banco Pan',
    proposal_status: 'Aprovada',
    amount_released: 8500,
    installment_value: 320.00,
    term_months: 24,
    signature_link: 'https://assinatura.exemplo.com/c3',
    link_generated_at: daysAgo(1),
    contract_status: 'PENDENCIAS_GERAIS',
    created_at: daysAgo(7),
    approved_at: daysAgo(5),
    signature_started_at: hoursAgo(20),
    pending_reason: 'Dados bancários do titular divergentes. Aguardando novo comprovante.',
  },
  {
    id: 'c4',
    lead_id: 'lead-4',
    patient_name: 'Carlos Pereira',
    cpf: '321.654.987-00',
    proposal_number: 'PROP-2024-004',
    bank_name: 'Banco UY3',
    proposal_status: 'Aprovada',
    amount_released: 30000,
    installment_value: 890.00,
    term_months: 36,
    signature_link: 'https://assinatura.exemplo.com/c4',
    link_generated_at: daysAgo(2),
    contract_status: 'PAGO',
    created_at: daysAgo(10),
    approved_at: daysAgo(8),
    signature_started_at: daysAgo(6),
    signed_at: daysAgo(5),
    paid_at: daysAgo(1),
  },
  {
    id: 'c5',
    lead_id: 'lead-5',
    patient_name: 'Fernanda Lima',
    cpf: '654.321.987-00',
    proposal_number: 'PROP-2024-005',
    bank_name: 'Banco Safra',
    proposal_status: 'Aprovada',
    amount_released: 12000,
    installment_value: 400.00,
    term_months: 30,
    signature_link: 'https://assinatura.exemplo.com/c5',
    link_generated_at: daysAgo(5),
    contract_status: 'EXPIRADO',
    created_at: daysAgo(12),
    approved_at: daysAgo(10),
    expired_at: daysAgo(2),
  },
  {
    id: 'c6',
    lead_id: 'lead-6',
    patient_name: 'Roberto Costa',
    cpf: '789.123.456-00',
    proposal_number: 'PROP-2024-006',
    bank_name: 'Banco Pan',
    proposal_status: 'Aprovada',
    amount_released: 18000,
    installment_value: 550.00,
    term_months: 36,
    signature_link: 'https://assinatura.exemplo.com/c6',
    link_generated_at: daysAgo(4),
    contract_status: 'CANCELADO',
    created_at: daysAgo(14),
    approved_at: daysAgo(12),
    signature_started_at: daysAgo(8),
    signed_at: daysAgo(7),
    cancelled_at: daysAgo(2),
    cancel_reason: 'Cancelamento solicitado pelo banco após análise de crédito complementar.',
  },
  {
    id: 'c7',
    lead_id: 'lead-7',
    patient_name: 'Luciana Mendes',
    cpf: '111.222.333-44',
    proposal_number: 'PROP-2024-007',
    bank_name: 'Banco UY3',
    proposal_status: 'Aprovada',
    amount_released: 9800,
    installment_value: 310.00,
    term_months: 36,
    signature_link: 'https://assinatura.exemplo.com/c7',
    link_generated_at: hoursAgo(48),
    contract_status: 'PENDENCIAS_GERAIS',
    created_at: daysAgo(6),
    approved_at: daysAgo(4),
    signature_started_at: hoursAgo(36),
    pending_reason: 'Falha na validação do documento de identidade. Reenvio necessário.',
  },
];

export const mockHistory: ContractHistoryItem[] = [
  {
    id: 'h1',
    contract_id: 'c3',
    date: hoursAgo(2),
    user_name: 'Operador Ana',
    type: 'Ligação',
    status: 'Falou com paciente',
    observation: 'Paciente informou que vai enviar novo comprovante bancário até amanhã.',
  },
  {
    id: 'h2',
    contract_id: 'c3',
    date: daysAgo(1),
    user_name: 'Operador Carlos',
    type: 'WhatsApp',
    status: 'Pediu para retornar',
    observation: 'Paciente solicitou retorno na quinta-feira pela manhã.',
  },
  {
    id: 'h3',
    contract_id: 'c5',
    date: daysAgo(3),
    user_name: 'Operador Ana',
    type: 'Ligação',
    status: 'Não atendeu',
    observation: 'Tentativa de contato sem sucesso. Caixa postal.',
  },
];

export const mockScheduledReturns: ScheduledReturn[] = [
  {
    id: 'sr1',
    contract_id: 'c3',
    date: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
    time: '09:00',
    completed: false,
    created_at: hoursAgo(2),
  },
];
