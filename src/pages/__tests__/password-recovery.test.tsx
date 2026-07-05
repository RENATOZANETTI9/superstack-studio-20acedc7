import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const resetPasswordForEmail = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn(async () => ({ error: null }));
const getSession = vi.fn(async () => ({ data: { session: { user: { id: 'u1' } } } }));
const onAuthStateChange = vi.fn((_cb: unknown) => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...a: any[]) => resetPasswordForEmail(...a),
      updateUser: (...a: any[]) => updateUser(...a),
      signOut: () => signOut(),
      getSession: () => getSession(),
      onAuthStateChange: (cb: unknown) => onAuthStateChange(cb),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('ForgotPassword — fluxo de solicitação', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    resetPasswordForEmail.mockReset();
  });

  it('rejeita e-mail inválido antes de chamar o backend', async () => {
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    const input = document.getElementById('email') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'nao-e-email' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));
    await waitFor(() => {
      const alerts = document.querySelectorAll('p.text-destructive');
      const texts = Array.from(alerts).map((el) => el.textContent ?? '').join(' ');
      expect(/inválido|invalid/i.test(texts)).toBe(true);
    });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('anti-enumeração: mostra sucesso mesmo quando o provedor retorna erro', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: { message: 'user not found' } });
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'inexistente@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));
    await waitFor(() => {
      expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument();
    });
    // A UI não deve mostrar mensagem que revele existência
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/não encontrado/i)).not.toBeInTheDocument();
  });

  it('caso feliz: envia link e mostra confirmação', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'valido@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar link/i }));
    await waitFor(() => {
      expect(resetPasswordForEmail).toHaveBeenCalledWith(
        'valido@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') }),
      );
      expect(screen.getByText(/verifique sua caixa de entrada/i)).toBeInTheDocument();
    });
  });
});

describe('ResetPassword — validação de política e redirect', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    updateUser.mockReset();
    signOut.mockClear();
  });

  const setup = async () => {
    const utils = render(<MemoryRouter><ResetPassword /></MemoryRouter>);
    // aguarda getSession resolver e marcar como ready
    await waitFor(
      () => {
        expect(screen.getByLabelText(/nova senha/i)).not.toBeDisabled();
      },
      { timeout: 3000 },
    );
    return utils;
  };

  it('bloqueia senha fraca (política de complexidade)', async () => {
    await setup();
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));
    // A mensagem de erro do submit aparece dentro de <p class="text-sm text-destructive">
    await waitFor(() => {
      const alerts = document.querySelectorAll('p.text-sm.text-destructive');
      const texts = Array.from(alerts).map((el) => el.textContent ?? '');
      expect(texts.some((t) => /senha/i.test(t))).toBe(true);
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('bloqueia quando confirmação não coincide', async () => {
    await setup();
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'Senha@123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'Outra@123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/não coincidem/i).length).toBeGreaterThan(0);
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('caso feliz: redefine senha e redireciona para /auth', async () => {
    updateUser.mockResolvedValue({ error: null });
    await setup();
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'Senha@123' } });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), { target: { value: 'Senha@123' } });
    fireEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));
    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: 'Senha@123' });
    });
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
    await waitFor(
      () => expect(navigateMock).toHaveBeenCalledWith('/auth'),
      { timeout: 3000 },
    );
  });

  it('mostra força da senha conforme complexidade', async () => {
    await setup();
    fireEvent.change(screen.getByLabelText(/nova senha/i), { target: { value: 'Senha@123' } });
    await waitFor(() => {
      expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    });
    const strength = screen.getByTestId('password-strength');
    expect(/excelente|forte/i.test(strength.textContent ?? '')).toBe(true);
  });
});