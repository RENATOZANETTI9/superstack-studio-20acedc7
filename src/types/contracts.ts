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
  lead_id: string | null;
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
  signature_started_at?: string | null;
  signed_at?: string | null;
  paid_at?: string | null;
  expired_at?: string | null;
  cancelled_at?: string | null;
  pending_reason?: string | null;
  cancel_reason?: string | null;
  user_id: string;
  updated_at: string;
}

export interface ContractHistoryItem {
  id: string;
  contract_id: string;
  date: string;
  user_name: string;
  type: string;
  status: string;
  observation: string;
  user_id?: string;
  created_at?: string;
}

export interface ScheduledReturn {
  id: string;
  contract_id: string;
  date: string;
  time: string;
  completed: boolean;
  user_id?: string;
  created_at: string;
}
