import { test, expect } from '@playwright/test';

/**
 * Fluxo de restrição do papel representante.
 * Requer credenciais em REP_EMAIL / REP_PASS. Se ausentes, o teste é pulado
 * para não quebrar CI em ambientes sem seed.
 */
test.describe('Representante access control', () => {
  const email = process.env.REP_EMAIL;
  const pass = process.env.REP_PASS;

  test.skip(!email || !pass, 'REP_EMAIL/REP_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(pass!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('bloqueia rotas administrativas', async ({ page }) => {
    await page.goto('/dashboard/usuarios/permissoes');
    await expect(page).toHaveURL(/\/acesso-negado/);

    await page.goto('/dashboard/representantes/dashboard');
    await expect(page).toHaveURL(/\/dashboard\/representantes\/rota|\/acesso-negado/);
  });

  test('libera rotas permitidas', async ({ page }) => {
    await page.goto('/dashboard/representantes/rota');
    await expect(page).toHaveURL(/\/dashboard\/representantes\/rota/);
  });
});