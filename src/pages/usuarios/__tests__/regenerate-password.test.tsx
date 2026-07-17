import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ---- Mocks ----
const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...a: unknown[]) => invokeMock(...a) },
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

let mockRole: string | null = 'master';
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ role: mockRole, isAuthenticated: true, isLoading: false }),
}));

vi.mock('@/components/dashboard/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Stub DataTable: renders an "Editar {name}" button per row that calls onEdit
vi.mock('@/components/usuarios/DataTable', () => ({
  DataTable: ({ data, onEdit }: { data: Array<{ id: string; name: string }>; onEdit: (u: unknown) => void }) => (
    <div>
      {data.map((u) => (
        <button key={u.id} onClick={() => onEdit(u)}>{`Editar ${u.name}`}</button>
      ))}
    </div>
  ),
}));

import Lista from '@/pages/usuarios/Lista';

const openEditFor = async (name: string) => {
  render(<MemoryRouter><Lista /></MemoryRouter>);
  fireEvent.click(screen.getByText(`Editar ${name}`));
  await waitFor(() => expect(screen.getByText(/Regenerar senha/i)).toBeInTheDocument());
};

beforeEach(() => {
  invokeMock.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  mockRole = 'master';
});

describe('Regenerar senha (admin/master)', () => {
  it('bloqueia envio quando senha é curta e não chama backend', async () => {
    await openEditFor('Elane');
    const input = screen.getByPlaceholderText(/Nova senha/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '123' } });
    const apply = screen.getByRole('button', { name: /Aplicar/i });
    expect(apply).toBeDisabled();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('sucesso: invoca admin-user-actions com reset_password e mostra toast de sucesso', async () => {
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    await openEditFor('Elane');
    fireEvent.change(screen.getByPlaceholderText(/Nova senha/i), { target: { value: 'Senha@123' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('admin-user-actions', {
        body: {
          action: 'reset_password',
          email: 'helpude6@helpude.com.br',
          newPassword: 'Senha@123',
        },
      });
    });
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/Nova senha definida/i));
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it('erro do backend: exibe toast de erro com a mensagem retornada', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'Usuário não encontrado' }, error: null });
    await openEditFor('Elane');
    fireEvent.change(screen.getByPlaceholderText(/Nova senha/i), { target: { value: 'Senha@123' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Usuário não encontrado');
    });
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('erro de rede: exibe toast com mensagem do error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'network down' } });
    await openEditFor('Elane');
    fireEvent.change(screen.getByPlaceholderText(/Nova senha/i), { target: { value: 'Senha@123' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('network down');
    });
  });

  it('envio de link por e-mail: invoca send_reset_email com redirectTo e mostra sucesso', async () => {
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    await openEditFor('Elane');
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de recupera/i }));
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('admin-user-actions', {
        body: {
          action: 'send_reset_email',
          email: 'helpude6@helpude.com.br',
          redirectTo: expect.stringMatching(/\/reset-password$/),
        },
      });
    });
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/recupera/i));
    });
  });

  it('envio de link por e-mail com erro: exibe toast de erro', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'Falha SMTP' }, error: null });
    await openEditFor('Elane');
    fireEvent.click(screen.getByRole('button', { name: /Enviar link de recupera/i }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Falha SMTP');
    });
  });

  it('usuário sem papel admin/master não vê o bloco de regenerar senha', async () => {
    mockRole = 'user';
    render(<MemoryRouter><Lista /></MemoryRouter>);
    fireEvent.click(screen.getByText('Editar Elane'));
    await waitFor(() => expect(screen.getByText(/Editar Usuário/i)).toBeInTheDocument());
    expect(screen.queryByText(/Regenerar senha/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aplicar/i })).not.toBeInTheDocument();
  });

  it('botão "Gerar" preenche o campo com senha >= 6 e habilita Aplicar', async () => {
    await openEditFor('Elane');
    fireEvent.click(screen.getByRole('button', { name: /Gerar/i }));
    const input = screen.getByPlaceholderText(/Nova senha/i) as HTMLInputElement;
    expect(input.value.length).toBeGreaterThanOrEqual(6);
    expect(screen.getByRole('button', { name: /Aplicar/i })).not.toBeDisabled();
  });
});