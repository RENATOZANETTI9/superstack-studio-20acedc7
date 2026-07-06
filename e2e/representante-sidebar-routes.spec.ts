import { test, expect } from '@playwright/test';

/**
 * Login como representante e valida:
 *  1) sidebar oculta itens administrativos
 *  2) rotas do módulo /dashboard/representantes/* permitidas carregam
 *  3) rotas admin do módulo redirecionam para /rota
 *
 * Credenciais do usuário seed (edge function seed-representante).
 * Podem ser sobrescritas via REP_EMAIL / REP_PASS.
 */
const email = process.env.REP_EMAIL || 'representante@teste.com';
const pass = process.env.REP_PASS || 'Rep@12345';

test.describe('Representante — sidebar + rotas do módulo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/senha/i).fill(pass);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test('sidebar oculta itens administrativos para o representante', async ({ page }) => {
    // Abre o grupo "Representantes" para inspecionar sub-itens
    const repTrigger = page.getByRole('button', { name: /^Representantes$/ });
    await expect(repTrigger).toBeVisible();
    await repTrigger.click();

    // Sub-itens permitidos devem estar visíveis
    for (const label of [
      /Minha Rota/i,
      /Meu Perfil/i,
      /Minhas Clínicas/i,
      /Bonificações/i,
      /Simulador/i,
      /Simulações Clínicas/i,
    ]) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }

    // Sub-itens administrativos NÃO devem aparecer
    for (const label of [
      /Meu Painel/i,
      /^Cadastro$/i,
      /Marketing/i,
      /Configurações/i,
      /Monitoramento/i,
      /Gestão de Representantes/i,
    ]) {
      await expect(page.getByRole('button', { name: label })).toHaveCount(0);
    }

    // Menus globais administrativos devem estar ocultos
    await expect(page.getByRole('button', { name: /Gestão de Usuários/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Clínicas$/i })).toHaveCount(0);
  });

  // Rotas do módulo que o representante pode acessar
  const allowed = [
    '/dashboard/representantes/rota',
    '/dashboard/representantes/perfil',
    '/dashboard/representantes/clinicas',
    '/dashboard/representantes/bonificacoes',
    '/dashboard/representantes/simulador',
    '/dashboard/representantes/simulacoes-clinicas',
  ];
  for (const path of allowed) {
    test(`carrega rota permitida: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'));
      await expect(page).not.toHaveURL(/\/acesso-negado/);
      await expect(page).not.toHaveURL(/\/auth/);
    });
  }

  // Rotas admin do módulo → devem redirecionar para /rota
  const adminOnly = [
    '/dashboard/representantes',
    '/dashboard/representantes/cadastro',
    '/dashboard/representantes/marketing',
    '/dashboard/representantes/config',
    '/dashboard/representantes/monitoramento',
  ];
  for (const path of adminOnly) {
    test(`redireciona rota admin do módulo para /rota: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/dashboard\/representantes\/rota/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/representantes\/rota/);
    });
  }
});