import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';

// ---- Mocks ---------------------------------------------------------------
vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useRoleGuard', () => ({ useRoleGuard: () => {} }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', isLoading: false }),
}));
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  },
}));

const mimoRep = {
  bronze:   { min_volume: 0,     max_volume: 10000, brinde: 'Kit Bronze',   label: 'Bronze',   level: 1 },
  prata:    { min_volume: 10000, max_volume: 25000, brinde: 'Kit Prata',    label: 'Prata',    level: 2 },
  ouro:     { min_volume: 25000, max_volume: 50000, brinde: 'Kit Ouro',     label: 'Ouro',     level: 3 },
  diamante: { min_volume: 50000, max_volume: null,  brinde: 'Kit Diamante', label: 'Diamante', level: 4 },
};
const mimoAtd = {
  bronze: { min_producao: 0,     max_producao: 5000,  mimo: 'Brinde A' },
  prata:  { min_producao: 5000,  max_producao: 15000, mimo: 'Brinde B' },
  ouro:   { min_producao: 15000, max_producao: null,  mimo: 'Brinde C' },
};
const rateCfg = { rate: 0.016 };

vi.mock('@/hooks/useSystemConfig', () => ({
  useSystemConfigFull: (key: string) => ({
    isLoading: false,
    data: {
      updated_at: new Date().toISOString(),
      updated_by: null,
      config_value:
        key === 'faixas_mimo_representante' ? mimoRep :
        key === 'faixas_mimo_atendente'    ? mimoAtd :
        rateCfg,
    },
  }),
  useUpdateSystemConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Import AFTER mocks
import AdminParametros from '../admin/AdminParametros';

function findTierCard(tierLabel: string) {
  const heading = screen.getAllByText(tierLabel)[0];
  // subir até o container do tier (border rounded-lg p-4)
  let el: HTMLElement | null = heading as HTMLElement;
  while (el && !(el.className || '').toString().includes('border')) {
    el = el.parentElement;
  }
  if (!el) throw new Error(`Tier card não encontrado para ${tierLabel}`);
  return el;
}

describe('AdminParametros — validação de brinde por tier do MIMO Representante', () => {
  beforeEach(() => {
    render(<AdminParametros />);
  });

  for (const tier of ['Bronze', 'Prata', 'Ouro', 'Diamante'] as const) {
    it(`mostra erro específico quando brinde do tier ${tier} é esvaziado e some ao preencher`, () => {
      const card = findTierCard(tier);
      const textarea = within(card).getAllByRole('textbox')[0] as HTMLTextAreaElement;

      // Esvazia
      fireEvent.change(textarea, { target: { value: '   ' } });
      const expected = `Descreva o brinde da faixa ${tier}.`;
      expect(within(card).getByText(expected)).toBeInTheDocument();
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Preenche novamente
      fireEvent.change(textarea, { target: { value: 'Novo brinde' } });
      expect(within(card).queryByText(expected)).not.toBeInTheDocument();
    });
  }
});