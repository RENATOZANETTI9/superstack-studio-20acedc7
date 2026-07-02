import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useRepresentanteGuard } from '@/hooks/useRepresentanteGuard';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const authState: { role: any; isLoading: boolean } = { role: null, isLoading: false };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

const Probe = ({ mode }: { mode: 'admin' | 'shared' }) => {
  useRepresentanteGuard(mode);
  return null;
};

const renderAt = (path: string, mode: 'admin' | 'shared') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<Probe mode={mode} />} />
      </Routes>
    </MemoryRouter>,
  );

describe('useRepresentanteGuard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    authState.isLoading = false;
  });

  const cases: Array<{ role: string; mode: 'admin' | 'shared'; expected: string | null }> = [
    { role: 'admin', mode: 'shared', expected: null },
    { role: 'master', mode: 'shared', expected: null },
    { role: 'representante', mode: 'shared', expected: null },
    { role: 'partner', mode: 'shared', expected: null },
    { role: 'master_partner', mode: 'shared', expected: null },
    { role: 'user', mode: 'shared', expected: '/acesso-negado' },
    { role: 'cs_geral', mode: 'shared', expected: '/acesso-negado' },
    { role: 'admin', mode: 'admin', expected: null },
    { role: 'master', mode: 'admin', expected: null },
    { role: 'partner', mode: 'admin', expected: '/dashboard/representantes/rota' },
    { role: 'master_partner', mode: 'admin', expected: '/dashboard/representantes/rota' },
    { role: 'representante', mode: 'admin', expected: '/dashboard/representantes/rota' },
    { role: 'user', mode: 'admin', expected: '/acesso-negado' },
  ];

  for (const c of cases) {
    it(`role=${c.role} mode=${c.mode} → ${c.expected ?? 'no redirect'}`, () => {
      authState.role = c.role;
      renderAt('/dashboard/representantes/dashboard', c.mode);
      if (c.expected === null) {
        expect(navigateMock).not.toHaveBeenCalled();
      } else {
        expect(navigateMock).toHaveBeenCalledTimes(1);
        const target = String(navigateMock.mock.calls[0][0]);
        expect(target.startsWith(c.expected)).toBe(true);
      }
    });
  }
});