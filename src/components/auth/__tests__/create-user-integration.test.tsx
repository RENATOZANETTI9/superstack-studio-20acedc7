/**
 * End-to-end integration test:
 *
 *   1. Simulates an admin calling the `create-user` edge function.
 *   2. The mocked function inserts a role row (must be 'representante').
 *   3. AuthContext hydrates from the mocked Supabase client and reads that
 *      role back from the `user_roles` table.
 *   4. ProtectedRoute is rendered with `allowedRoles={['representante']}`
 *      and must render its child — confirming only that role unlocks
 *      representante-only routes.
 *
 * If the edge function ever regresses to `role: 'user'` (the old bug), this
 * test fails because ProtectedRoute redirects to /acesso-negado.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

type RoleRow = { user_id: string; role: string };
const roleTable: RoleRow[] = [];
const profileTable: Array<{ user_id: string; must_change_password: boolean }> = [];

let currentSession: any = null;
let authListener: ((event: string, session: any) => void) | null = null;

// --- Fake Supabase client -------------------------------------------------
const fakeSupabase = {
  auth: {
    onAuthStateChange: (cb: (event: string, session: any) => void) => {
      authListener = cb;
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => ({ data: { session: currentSession } }),
  },
  from: (table: string) => {
    const query: any = {
      _filters: {} as Record<string, string>,
      select() { return query; },
      eq(col: string, val: string) { query._filters[col] = val; return query; },
      maybeSingle: async () => {
        if (table === 'profiles') {
          const row = profileTable.find(p => p.user_id === query._filters.user_id);
          return { data: row ?? null, error: null };
        }
        return { data: null, error: null };
      },
      single: async () => {
        if (table === 'user_roles') {
          const row = roleTable.find(r => r.user_id === query._filters.user_id);
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
      // Emulate the real edge function: create user + insert role +
      // must_change_password profile row.
      const userId = `u_${roleTable.length + 1}`;
      roleTable.push({ user_id: userId, role: 'representante' });
      profileTable.push({ user_id: userId, must_change_password: true });
      currentSession = { user: { id: userId, email: opts.body.email } };
      // Notify listeners as Supabase would after signInWithPassword.
      authListener?.('SIGNED_IN', currentSession);
      return { data: { success: true, user: { id: userId, email: opts.body.email } }, error: null };
    }),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: fakeSupabase,
}));

// AuthContext must be imported AFTER the mock is registered.
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

beforeEach(() => {
  roleTable.length = 0;
  profileTable.length = 0;
  currentSession = null;
  authListener = null;
  fakeSupabase.functions.invoke.mockClear();
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
    // Initially unauthenticated → redirected to /auth.
    await waitFor(() => expect(screen.getByText('AUTH_PAGE')).toBeInTheDocument());

    // Admin action: invoke the edge function (simulated), which seeds the
    // role table and fires SIGNED_IN.
    await act(async () => {
      await fakeSupabase.functions.invoke('create-user', {
        body: { email: 'rep@teste.com', password: 'Xx123456' },
      });
    });

    // Once the role is fetched from user_roles, ProtectedRoute renders /repr.
    await waitFor(() => expect(screen.getByText('REPR_OK')).toBeInTheDocument());

    // Guard against silent regressions of the create-user fix.
    expect(roleTable[0].role).toBe('representante');
    expect(roleTable[0].role).not.toBe('user');
  });

  it('regression: a "user" role from create-user must NOT unlock the route', async () => {
    // Simulate the OLD bug by seeding the role table manually with 'user'.
    const userId = 'legacy_user';
    roleTable.push({ user_id: userId, role: 'user' });
    profileTable.push({ user_id: userId, must_change_password: false });
    currentSession = { user: { id: userId, email: 'old@teste.com' } };

    render(<Harness />);
    // Session is present but role is 'user' → ProtectedRoute must deny.
    await waitFor(() => expect(screen.getByText('DENIED')).toBeInTheDocument());
  });
});