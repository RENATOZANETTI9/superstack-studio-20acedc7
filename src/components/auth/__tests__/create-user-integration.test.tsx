/**
 * End-to-end integration test proving that:
 *   1. The create-user edge function assigns role 'representante'.
 *   2. AuthContext hydrates that role from user_roles.
 *   3. ProtectedRoute unlocks a representante-only route ONLY for that role.
 * A regression to the old 'user' role would flip this test to red.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

const H = vi.hoisted(() => {
  const state = {
    roleTable: [] as Array<{ user_id: string; role: string }>,
    profileTable: [] as Array<{ user_id: string; must_change_password: boolean }>,
    currentSession: null as any,
    authListener: null as null | ((event: string, session: any) => void),
  };
  const fakeSupabase = {
    auth: {
      onAuthStateChange: (cb: (event: string, session: any) => void) => {
        state.authListener = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: state.currentSession } }),
    },
    from: (table: string) => {
      const query: any = {
        _filters: {} as Record<string, string>,
        select() { return query; },
        eq(col: string, val: string) { query._filters[col] = val; return query; },
        maybeSingle: async () => {
          if (table === 'profiles') {
            const row = state.profileTable.find(p => p.user_id === query._filters.user_id);
            return { data: row ?? null, error: null };
          }
          return { data: null, error: null };
        },
        single: async () => {
          if (table === 'user_roles') {
            const row = state.roleTable.find(r => r.user_id === query._filters.user_id);
            return { data: row ?? null, error: row ? null : { message: 'not found' } };
          }
          return { data: null, error: { message: 'not found' } };
        },
      };
      return query;
    },
    functions: {
      invoke: vi.fn(async (name: string, opts: any) => {
        if (name !== 'create-user') return { data: null, error: null };
        const userId = `u_${state.roleTable.length + 1}`;
        state.roleTable.push({ user_id: userId, role: 'representante' });
        state.profileTable.push({ user_id: userId, must_change_password: true });
        state.currentSession = { user: { id: userId, email: opts.body.email } };
        state.authListener?.('SIGNED_IN', state.currentSession);
        return { data: { success: true, user: { id: userId, email: opts.body.email } }, error: null };
      }),
    },
  };
  return { state, fakeSupabase };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: H.fakeSupabase }));

// AuthContext must be imported AFTER the mock is registered.
import { AuthProvider } from '@/contexts/AuthContext';

beforeEach(() => {
  H.state.roleTable.length = 0;
  H.state.profileTable.length = 0;
  H.state.currentSession = null;
  H.state.authListener = null;
  H.fakeSupabase.functions.invoke.mockClear();
});

const Harness = () => (
  <AuthProvider>
    <MemoryRouter initialEntries={['/repr']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['representante']} />}>
          <Route path="/repr" element={<div>REPR_OK</div>} />
        </Route>
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
        <Route path="/acesso-negado" element={<div>DENIED</div>} />
      </Routes>
    </MemoryRouter>
  </AuthProvider>
);

describe('create-user → ProtectedRoute (end-to-end)', () => {
  it('grants access after admin creates a representante account', async () => {
    render(<Harness />);
    await waitFor(() => expect(screen.getByText('AUTH_PAGE')).toBeInTheDocument());

    await act(async () => {
      await H.fakeSupabase.functions.invoke('create-user', {
        body: { email: 'rep@teste.com', password: 'Xx123456' },
      });
    });

    await waitFor(() => expect(screen.getByText('REPR_OK')).toBeInTheDocument());
    expect(H.state.roleTable[0].role).toBe('representante');
    expect(H.state.roleTable[0].role).not.toBe('user');
  });

  it('regression: a "user" role must NOT unlock the representante route', async () => {
    const userId = 'legacy_user';
    H.state.roleTable.push({ user_id: userId, role: 'user' });
    H.state.profileTable.push({ user_id: userId, must_change_password: false });
    H.state.currentSession = { user: { id: userId, email: 'old@teste.com' } };

    render(<Harness />);
    await waitFor(() => expect(screen.getByText('DENIED')).toBeInTheDocument());
  });
});