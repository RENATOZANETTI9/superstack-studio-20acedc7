import { test, expect } from '@playwright/test';

/**
 * Access-control matrix for the "representante" role.
 *
 * Requires seeded credentials in REP_EMAIL / REP_PASS. When they are not
 * defined the whole suite is skipped, so CI environments without seed data
 * do not break — real environments run the full matrix.
 */
const email = process.env.REP_EMAIL;
const pass = process.env.REP_PASS;

test.describe('Representante — access control matrix', () => {
  test.skip(!email || !pass, 'REP_EMAIL/REP_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(pass!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  // -------- allowed --------
  const allowed = [
    '/dashboard/representantes/rota',
    '/dashboard/representantes/perfil',
    '/dashboard/representantes/clinicas',
    '/dashboard/representantes/bonificacoes',
    '/dashboard/representantes/simulador',
    '/dashboard/representantes/simulacoes-clinicas',
    '/dashboard/contratos',
  ];
  for (const path of allowed) {
    test(`libera rota permitida: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
      await expect(page).not.toHaveURL(/\/acesso-negado/);
    });
  }

  // -------- admin-only inside /representantes → redirected to /rota --------
  const representantesAdminOnly = [
    '/dashboard/representantes',              // painel
    '/dashboard/representantes/cadastro',
    '/dashboard/representantes/marketing',
    '/dashboard/representantes/config',
    '/dashboard/representantes/monitoramento',
  ];
  for (const path of representantesAdminOnly) {
    test(`redireciona rota admin do módulo: ${path} → /rota`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard\/representantes\/rota/);
    });
  }

  // -------- catch-all: unknown sub-routes → /rota --------
  const unknownSubRoutes = [
    '/dashboard/representantes/inexistente',
    '/dashboard/representantes/config/edit',
    '/dashboard/representantes/monitoramento/detalhe/42',
  ];
  for (const path of unknownSubRoutes) {
    test(`catch-all envia sub-rota desconhecida para /rota: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard\/representantes\/rota/);
    });
  }

  // -------- fully blocked routes → 403 --------
  const denied = [
    '/dashboard/usuarios/permissoes',
    '/dashboard/usuarios/hierarquias',
    '/dashboard/usuarios/auditoria',
    '/dashboard/clinicas',
    '/dashboard/consultas',
  ];
  for (const path of denied) {
    test(`bloqueia rota administrativa: ${path} → /acesso-negado`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/acesso-negado/);
      await expect(page.getByText(/acesso negado|permiss/i)).toBeVisible();
    });
  }

  test('AccessDenied preserva query param from', async ({ page }) => {
    await page.goto('/dashboard/usuarios/permissoes');
    await expect(page).toHaveURL(/\/acesso-negado\?from=/);
  });
});