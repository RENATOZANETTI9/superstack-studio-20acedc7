import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '@/components/dashboard/AppSidebar';

// --- Mocks ---------------------------------------------------------------
const authState: { role: any; user: any; isMaster: boolean } = {
  role: null,
  user: { email: 'user@test.com' },
  isMaster: false,
};
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    ...authState,
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

const mobileState = { isMobile: false };
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mobileState.isMobile,
}));

const renderSidebar = (path = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppSidebar collapsed={false} onToggle={() => {}} />
    </MemoryRouter>,
  );

// -------------------------------------------------------------------------
describe('AppSidebar — desktop visibility per role', () => {
  beforeEach(() => {
    cleanup();
    mobileState.isMobile = false;
  });

  it('representante: hides Dashboard/Buscar Crédito, shows Créditos Aprovados, Gestão de Usuários, Representantes without admin-only subitems', () => {
    authState.role = 'representante';
    renderSidebar('/dashboard/representantes/rota');

    // top-level menu
    expect(screen.queryByRole('button', { name: /^Dashboard$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Buscar Crédito/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Créditos Aprovados/i })).toBeInTheDocument();

    // users menu present, but Auditoria (admin-only) hidden
    expect(screen.getByRole('button', { name: /Gestão de Usuários/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Auditoria$/i })).toBeNull();

    // representantes menu present with representante-allowed subitems
    expect(screen.getByRole('button', { name: /Representantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minha Rota/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meu Perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minhas Clínicas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bonificações/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simulador/i })).toBeInTheDocument();

    // admin-only representantes items hidden
    expect(screen.queryByRole('button', { name: /Meu Painel/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Cadastro$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Marketing$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Configurações/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Monitoramento/i })).toBeNull();

    // Clínicas admin hidden
    expect(screen.queryByRole('button', { name: /^Clínicas$/i })).toBeNull();
  });

  it('partner: hides admin representantes items and users menu', () => {
    authState.role = 'partner';
    renderSidebar('/dashboard/representantes/rota');

    expect(screen.getByRole('button', { name: /^Dashboard$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gestão de Usuários/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Representantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Minha Rota/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Meu Painel/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Cadastro$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Marketing$/i })).toBeNull();
  });

  it('admin: shows all top-level menus including Auditoria and Clínicas', () => {
    authState.role = 'admin';

    // First render: users menu open (path starts with /usuarios)
    renderSidebar('/dashboard/usuarios/lista');
    expect(screen.getByRole('button', { name: /^Dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar Crédito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Créditos Aprovados/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestão de Usuários/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Auditoria$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Clínicas$/i })).toBeInTheDocument();

    cleanup();

    // Second render: representantes menu open (path starts with /representantes)
    renderSidebar('/dashboard/representantes');
    expect(screen.getByRole('button', { name: /Representantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meu Painel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Cadastro$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Marketing$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Monitoramento/i })).toBeInTheDocument();
  });

  it('user (basic): sees only Dashboard/Buscar/Créditos and no admin menus', () => {
    authState.role = 'user';
    renderSidebar('/dashboard');

    expect(screen.getByRole('button', { name: /^Dashboard$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar Crédito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Créditos Aprovados/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gestão de Usuários/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Representantes/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Clínicas$/i })).toBeNull();
  });
});

describe('AppSidebar — mobile (bottom nav & drawer)', () => {
  beforeEach(() => {
    cleanup();
    mobileState.isMobile = true;
  });

  it('representante: bottom nav omits Buscar Crédito/Dashboard, keeps Créditos + Usuários shortcut', () => {
    authState.role = 'representante';
    const { container } = renderSidebar('/dashboard/representantes/rota');

    const bottomNav = container.querySelector('nav.fixed.bottom-0') as HTMLElement;
    expect(bottomNav).toBeTruthy();
    const nav = within(bottomNav);
    expect(nav.queryByText(/Dashboard/i)).toBeNull();
    expect(nav.queryByText(/Buscar Crédito/i)).toBeNull();
    expect(nav.getByText(/Créditos Aprovados/i)).toBeInTheDocument();
    expect(nav.getByText(/Usuários/i)).toBeInTheDocument();
  });

  it('user: bottom nav shows Dashboard/Buscar/Créditos and no Usuários shortcut', () => {
    authState.role = 'user';
    const { container } = renderSidebar('/dashboard');

    const bottomNav = container.querySelector('nav.fixed.bottom-0') as HTMLElement;
    const nav = within(bottomNav);
    expect(nav.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(nav.getByText(/Buscar Crédito/i)).toBeInTheDocument();
    expect(nav.getByText(/Créditos Aprovados/i)).toBeInTheDocument();
    expect(nav.queryByText(/Usuários/i)).toBeNull();
  });

  it('admin: bottom nav includes Usuários shortcut', () => {
    authState.role = 'admin';
    const { container } = renderSidebar('/dashboard');
    const bottomNav = container.querySelector('nav.fixed.bottom-0') as HTMLElement;
    expect(within(bottomNav).getByText(/Usuários/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------
  // Full mobile drawer coverage — asserts that forbidden items NEVER
  // appear for each representante-like mode (representante / partner /
  // master_partner). The drawer is opened by clicking the hamburger
  // button in the mobile header.
  // --------------------------------------------------------------------
  const openMobileDrawer = async (container: HTMLElement) => {
    const { fireEvent } = await import('@testing-library/react');
    const header = container.querySelector('header.fixed.top-0') as HTMLElement;
    const trigger = within(header).getAllByRole('button')[0];
    fireEvent.click(trigger);
  };

  const FORBIDDEN_FOR_REPRESENTANTE = [
    /^Dashboard$/i,
    /Buscar Crédito/i,
    /Meu Painel/i,
    /^Cadastro$/i,
    /^Marketing$/i,
    /Configurações/i,
    /Monitoramento/i,
    /^Clínicas$/i, // admin clinics module
  ];

  const ALLOWED_FOR_REPRESENTANTE = [
    /Créditos Aprovados/i,
    /Gestão de Usuários/i, // representante has restricted users menu access
    /Representantes/i,
    /Minha Rota/i,
    /Meu Perfil/i,
    /Minhas Clínicas/i,
    /Bonificações/i,
    /Simulador/i,
  ];

  const FORBIDDEN_FOR_PARTNER = [
    /Gestão de Usuários/i,
    /Meu Painel/i,
    /^Cadastro$/i,
    /^Marketing$/i,
    /Configurações/i,
    /Monitoramento/i,
    /^Clínicas$/i,
    /^Auditoria$/i,
  ];

  const ALLOWED_FOR_PARTNER = [
    /^Dashboard$/i,
    /Representantes/i,
    /Minha Rota/i,
    /Meu Perfil/i,
    /Minhas Clínicas/i,
    /Bonificações/i,
    /Simulador/i,
  ];

  const drawerCases: Array<{
    role: 'representante' | 'partner' | 'master_partner';
    forbidden: RegExp[];
    allowed: RegExp[];
  }> = [
    { role: 'representante', forbidden: FORBIDDEN_FOR_REPRESENTANTE, allowed: ALLOWED_FOR_REPRESENTANTE },
    { role: 'partner', forbidden: FORBIDDEN_FOR_PARTNER, allowed: ALLOWED_FOR_PARTNER },
    { role: 'master_partner', forbidden: FORBIDDEN_FOR_PARTNER, allowed: ALLOWED_FOR_PARTNER },
  ];

  for (const c of drawerCases) {
    it(`mobile drawer — ${c.role}: allowed items render, forbidden items NEVER render`, async () => {
      authState.role = c.role;
      const { container } = renderSidebar('/dashboard/representantes/rota');
      await openMobileDrawer(container);

      const drawer = container.querySelector('.fixed.inset-0.z-40') as HTMLElement;
      expect(drawer).toBeTruthy();
      const inDrawer = within(drawer);

      for (const re of c.allowed) {
        expect(inDrawer.getAllByRole('button', { name: re }).length).toBeGreaterThan(0);
      }
      for (const re of c.forbidden) {
        expect(inDrawer.queryByRole('button', { name: re })).toBeNull();
      }
    });
  }

  // Bottom-nav coverage for each representante-like mode
  const bottomNavCases: Array<{
    role: 'representante' | 'partner' | 'master_partner';
    forbidden: RegExp[];
  }> = [
    { role: 'representante', forbidden: [/^Dashboard$/i, /Buscar Crédito/i] },
    { role: 'partner', forbidden: [/Usuários/i] },
    { role: 'master_partner', forbidden: [/Usuários/i] },
  ];

  for (const c of bottomNavCases) {
    it(`mobile bottom nav — ${c.role}: forbidden shortcuts NEVER render`, () => {
      authState.role = c.role;
      const { container } = renderSidebar('/dashboard/representantes/rota');
      const bottomNav = container.querySelector('nav.fixed.bottom-0') as HTMLElement;
      const nav = within(bottomNav);
      for (const re of c.forbidden) {
        expect(nav.queryByText(re)).toBeNull();
      }
    });
  }
});