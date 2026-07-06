import { test, expect, type Page } from '@playwright/test';

/**
 * E2E da tela de Auditoria de senhas: valida filtros por Ação e Status,
 * paginação, ordenação e sincronia com a URL.
 *
 * Requer credenciais admin em ADMIN_EMAIL / ADMIN_PASS. Caso ausentes,
 * a suíte é ignorada (mesmo padrão de e2e/representante-access.spec.ts).
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

// 25 linhas para exercitar paginação (PAGE_SIZE=20)
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
    id: 'rl-1',
    actor_email: null,
    target_email: 'blocked@example.com',
    action: 'self_request',
    success: false,
    error_message: 'rate_limited: user/6/5 ip/2/20; token=eyJhbGciOiJIUzI1NiJ9.payload.sig',
    ip_address: '10.0.0.2',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(10),
  },
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
    id: 'err-1',
    actor_email: 'admin@example.com',
    target_email: 'unknown@example.com',
    action: 'send_reset_email',
    success: false,
    error_message: 'unexpected error',
    ip_address: '10.0.0.4',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(1),
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

test.describe('Auditoria de senhas — filtros, ordenação e paginação', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await mockAudit(page);
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(pass!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/dashboard/);
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();
  });

  test('filtro por Ação restringe as linhas e sincroniza com a URL', async ({ page }) => {
    await page.getByTestId('action-filter').click();
    await page.getByRole('option', { name: /redefinição de senha/i }).click();
    await expect(page).toHaveURL(/action=reset_password/);
    const rows = page.getByTestId('audit-row');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toHaveAttribute('data-action', 'reset_password');
  });

  test('filtro por Status "Rate limit" mostra o badge 429', async ({ page }) => {
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /bloqueio por rate limit/i }).click();
    await expect(page).toHaveURL(/status=rate_limit/);
    await expect(page.getByTestId('audit-row')).toHaveCount(1);
    await expect(page.getByTestId('badge-rate-limit')).toBeVisible();
  });

  test('filtro por Status "Token reutilizado" mostra o badge dedicado', async ({ page }) => {
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await expect(page).toHaveURL(/status=token_reused/);
    await expect(page.getByTestId('audit-row')).toHaveCount(1);
    await expect(page.getByTestId('badge-token-reused')).toBeVisible();
  });

  test('detalhes: abre drawer com trace id e mensagem sanitizada', async ({ page }) => {
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await page.getByTestId('view-details').first().click();
    await expect(page).toHaveURL(/event=tr-1/);
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();
    await expect(page.getByTestId('detail-trace-id')).toHaveText('tr-1');
    const msg = await page.getByTestId('detail-error-message').innerText();
    expect(msg).toContain('[email]');
    expect(msg).not.toContain('leak@example.com');
  });

  test('paginação: navega entre páginas e mantém filtros', async ({ page }) => {
    await expect(page.getByTestId('page-indicator')).toContainText(/página 1 de 2/i);
    await page.getByTestId('page-next').click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByTestId('page-indicator')).toContainText(/página 2 de 2/i);
    await expect(page.getByTestId('audit-row')).toHaveCount(5);
  });

  test('ordenação: alterna por Data/Hora asc/desc via URL', async ({ page }) => {
    await page.getByTestId('sort-created-at').click();
    await expect(page).toHaveURL(/dir=asc/);
    await page.getByTestId('sort-created-at').click();
    await expect(page).toHaveURL(/dir=desc/);
  });
});
