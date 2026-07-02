import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RepresentantesCatchAll } from '@/components/representantes/RepresentantesCatchAll';

const authState: { role: any } = { role: null };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderCatchAll = (initialPath = '/dashboard/representantes/anything') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard/representantes/*" element={<RepresentantesCatchAll />} />
        <Route path="/dashboard/representantes/rota" element={<div>ROTA</div>} />
        <Route path="/dashboard/representantes" element={<div>PAINEL</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RepresentantesCatchAll', () => {
  const cases: Array<{ role: string; expected: 'ROTA' | 'PAINEL' }> = [
    { role: 'partner', expected: 'ROTA' },
    { role: 'master_partner', expected: 'ROTA' },
    { role: 'representante', expected: 'ROTA' },
    { role: 'admin', expected: 'PAINEL' },
    { role: 'master', expected: 'PAINEL' },
    { role: 'user', expected: 'PAINEL' },
  ];

  for (const c of cases) {
    it(`role=${c.role} → ${c.expected}`, () => {
      authState.role = c.role;
      renderCatchAll();
      expect(screen.getByText(c.expected)).toBeInTheDocument();
    });
  }

  // Sub-routes and actions that could escape guards via partial permissions.
  const nestedPaths = [
    '/dashboard/representantes/config/edit',
    '/dashboard/representantes/monitoramento/detalhe/42',
    '/dashboard/representantes/cadastro/novo',
    '/dashboard/representantes/marketing/campanhas',
    '/dashboard/representantes/clinicas/999/simulacoes',
    '/dashboard/representantes/rota/dia/2026-07-02',
    '/dashboard/representantes/painel?tab=hoje',
  ];

  describe('nested/unknown sub-routes are still caught', () => {
    for (const path of nestedPaths) {
      it(`representante on ${path} → ROTA`, () => {
        authState.role = 'representante';
        renderCatchAll(path);
        expect(screen.getByText('ROTA')).toBeInTheDocument();
      });
      it(`admin on ${path} → PAINEL`, () => {
        authState.role = 'admin';
        renderCatchAll(path);
        expect(screen.getByText('PAINEL')).toBeInTheDocument();
      });
    }
  });

  it('null role falls through to PAINEL (admin dashboard) so guard on target can act', () => {
    authState.role = null;
    renderCatchAll('/dashboard/representantes/unknown');
    expect(screen.getByText('PAINEL')).toBeInTheDocument();
  });
});