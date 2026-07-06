import { test, expect, type Page } from '@playwright/test';

/**
 * Valida que:
 *  - back/forward do navegador preservam filtros, busca, paginação e ordenação
 *    sincronizados na URL da tela de Auditoria de Senhas.
 *  - Botões de copiar Trace ID e IP no drawer exibem feedback visual e escrevem
 *    o valor esperado no clipboard, sem expor payload sensível.
 *
 * Segue o padrão de e2e/audit-passwords.spec.ts (mesmos fixtures/mock/login).
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

const fixtures = [
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `succ-${i}`,
    actor_email: null,
    target_email: `user${i}@example.com`,
    action: 'self_request',
    success: true,
    error_message: null,
    ip_address: '10.0.0.1',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(60 + i),
  })),
  {
    id: 'tr-1',
    actor_email: null,
    target_email: 'reuse@example.com',
    action: 'reset_password',
    success: false,
    error_message: 'Token de redefinição já utilizado; email=leak@example.com',
    ip_address: '10.0.0.3',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(5),
  },
  {
    id: 'succ-admin',
    actor_email: 'admin@example.com',
    target_email: 'target@example.com',
    action: 'send_reset_email',
    success: true,
    error_message: null,
    ip_address: '10.0.0.5',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(2),
  },
];

async function mockAudit(page: Page) {
  await page.route('**/rest/v1/password_reset_audit*', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixtures),
    });
  });
}

test.describe('Auditoria de senhas — histórico do navegador e copiar', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockAudit(page);
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(pass!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();
  });

  test('back/forward preservam filtros, ordenação e paginação sincronizados na URL', async ({ page }) => {
    // 1) Filtro por Ação (reset_password)
    await page.getByTestId('action-filter').click();
    await page.getByRole('option', { name: /redefinição de senha/i }).click();
    await expect(page).toHaveURL(/action=reset_password/);

    // 2) Ordenação por Data/Hora asc
    await page.getByTestId('action-filter').click();
    await page.keyboard.press('Escape');
    // limpa ação para ampliar resultado antes de paginar
    await page.getByTestId('action-filter').click();
    await page.getByRole('option', { name: /todas as ações/i }).click();
    await expect(page).not.toHaveURL(/action=reset_password/);

    await page.getByTestId('sort-created-at').click();
    await expect(page).toHaveURL(/dir=asc/);

    // 3) Ir para a página 2
    await page.getByTestId('page-next').click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('page-indicator')).toContainText(/página 2 de 2/i);

    // Back → volta para page=1 mas mantém dir=asc
    await page.goBack();
    await expect(page).toHaveURL(/dir=asc/);
    await expect(page).not.toHaveURL(/page=2/);
    await expect(page.getByTestId('page-indicator')).toContainText(/página 1 de 2/i);

    // Back → remove sort/dir, mantém action limpa
    await page.goBack();
    await expect(page).not.toHaveURL(/dir=asc/);

    // Back → volta a ter action=reset_password
    await page.goBack();
    await expect(page).toHaveURL(/action=reset_password/);
    await expect(page.getByTestId('audit-row')).toHaveCount(1);

    // Forward duas vezes: recuperamos sort asc
    await page.goForward();
    await page.goForward();
    await expect(page).toHaveURL(/dir=asc/);

    // Forward: recupera page=2
    await page.goForward();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('page-indicator')).toContainText(/página 2 de 2/i);
  });

  test('drawer: copiar Trace ID e IP escreve valor no clipboard e mostra feedback', async ({ page }) => {
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();
    await expect(page.getByTestId('detail-trace-id')).toHaveText('tr-1');

    // Copiar Trace ID
    const copyTrace = page.getByTestId('copy-trace-id');
    await expect(copyTrace).toContainText(/copiar/i);
    await copyTrace.click();
    await expect(copyTrace).toContainText(/copiado/i);
    const traceClip = await page.evaluate(() => navigator.clipboard.readText());
    expect(traceClip).toBe('tr-1');
    // Não deve vazar payload sensível
    expect(traceClip).not.toContain('leak@example.com');
    expect(traceClip).not.toContain('Token');

    // Feedback volta ao estado inicial após ~1.6s
    await expect(copyTrace).toContainText(/copiar/i, { timeout: 3000 });

    // Copiar IP
    const copyIp = page.getByTestId('copy-ip');
    await copyIp.click();
    await expect(copyIp).toContainText(/copiado/i);
    const ipClip = await page.evaluate(() => navigator.clipboard.readText());
    expect(ipClip).toBe('10.0.0.3');
  });
});
