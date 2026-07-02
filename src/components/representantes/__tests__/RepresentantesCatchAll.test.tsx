import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RepresentantesCatchAll } from '@/components/representantes/RepresentantesCatchAll';

const authState: { role: any } = { role: null };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderCatchAll = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/representantes/anything']}>
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
});