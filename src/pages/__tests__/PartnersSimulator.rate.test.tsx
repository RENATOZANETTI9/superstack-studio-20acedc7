import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Garante que o PartnersSimulator lê `taxa_comissao_representante` do
 * useSystemConfig e renderiza 0,80% (pt-BR) imediatamente após o carregamento,
 * usando esse mesmo valor no cálculo da projeção financeira.
 */

vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ role: 'admin', isLoading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null }) }),
      }),
    }),
  },
}));
// Evita instanciar recharts/tooltips complexos no jsdom.
vi.mock('recharts', () => {
  const Any = () => null;
  return {
    __esModule: true,
    default: Any,
    BarChart: Any, Bar: Any, XAxis: Any, YAxis: Any,
    CartesianGrid: Any, Tooltip: Any, Legend: Any,
    ResponsiveContainer: ({ children }: any) => children ?? null,
  };
});

vi.mock('@/hooks/useSystemConfig', () => ({
  useSystemConfig: (key: string) => {
    const map: Record<string, any> = {
      taxa_bonificacao_direta:      { rate: 0.016 },
      taxa_bonificacao_rede:        { rate: 0.002 },
      taxa_comissao_representante:  { rate: 0.008 },
    };
    return { data: map[key], isLoading: false };
  },
}));

import PartnersSimulator from '@/pages/partners/PartnersSimulator';

const renderSim = () =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <PartnersSimulator />
      </TooltipProvider>
    </MemoryRouter>
  );

describe('PartnersSimulator — taxa dinâmica do representante', () => {
  it('exibe 0,80% quando taxa_comissao_representante.rate = 0.008', () => {
    renderSim();
    // Rótulo visível ao usuário: "Taxa: 0,80%"
    expect(screen.getByText(/Taxa:\s*0,80%/)).toBeInTheDocument();
  });

  it('usa a taxa do representante no cálculo (5 clínicas · defaults)', () => {
    renderSim();
    expect(screen.queryByText(/Taxa:\s*1,60%/)).not.toBeInTheDocument();
    expect(screen.getByText(/Taxa:\s*0,80%/)).toBeInTheDocument();
  });
});