import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['representante']} />}>
          <Route path="/repr" element={<div>REPR_OK</div>} />
        </Route>
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/acesso-negado" element={<div>DENIED</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute — representante-only', () => {
  it('redirects unauthenticated users to /auth', () => {
    mockedUseAuth.mockReturnValue({ user: null, role: null, isLoading: false });
    renderAt('/repr');
    expect(screen.getByText('AUTH_PAGE')).toBeInTheDocument();
  });

  it('allows access when role is "representante"', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'u1' }, role: 'representante', isLoading: false });
    renderAt('/repr');
    expect(screen.getByText('REPR_OK')).toBeInTheDocument();
  });

  it('denies "user" role (default fallback role)', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'u1' }, role: 'user', isLoading: false });
    renderAt('/repr');
    expect(screen.getByText('DENIED')).toBeInTheDocument();
  });

  it.each(['admin', 'master', 'partner', 'master_partner'] as const)(
    'denies unrelated role "%s"',
    (role) => {
      mockedUseAuth.mockReturnValue({ user: { id: 'u1' }, role, isLoading: false });
      renderAt('/repr');
      expect(screen.getByText('DENIED')).toBeInTheDocument();
    }
  );
});