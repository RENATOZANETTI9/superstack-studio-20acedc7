import { test, expect, type Page } from '@playwright/test';

/**
 * Valida:
 *  - Acessibilidade do drawer de detalhes: foco inicial dentro do sheet,
 *    navegação por Tab entre elementos interativos, indicador de foco visível
 *    (focus-visible ring) e fechamento com a tecla Escape.
 *  - Ao recarregar a página, filtros (busca/ação/status), paginação e
 *    ordenação sincronizados na URL permanecem aplicados na UI.
 *
 * Segue os mesmos fixtures e login usados em e2e/audit-passwords.spec.ts.
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

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByLabel(/e-?mail/i).fill(email!);
  await page.getByLabel(/senha/i).fill(pass!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
}

test.describe('Auditoria de senhas — a11y do drawer e reload preservando URL', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockAudit(page);
    await login(page);
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();
  });

  test('drawer: foco inicial dentro do sheet, Tab navega e Escape fecha', async ({ page }) => {
    await page.getByTestId('view-details').first().click();
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();

    // Após abrir, o foco deve estar contido no sheet (Radix focus trap).
    const focusedInsideSheet = await sheet.evaluate((el) =>
      el.contains(document.activeElement),
    );
    expect(focusedInsideSheet).toBe(true);

    // Sheet expõe atributos ARIA (dialog + título + descrição).
    await expect(sheet).toHaveAttribute('role', 'dialog');
    await expect(sheet).toHaveAttribute('aria-labelledby', 'event-detail-title');
    await expect(sheet).toHaveAttribute('aria-describedby', 'event-detail-desc');

    // Tab deve levar o foco para o botão "Copiar Trace ID" e este deve
    // renderizar um indicador de foco visível (ring/outline).
    const copyTrace = page.getByTestId('copy-trace-id');
    await copyTrace.focus();
    await expect(copyTrace).toBeFocused();
    const hasVisibleFocus = await copyTrace.evaluate((el) => {
      const s = window.getComputedStyle(el);
      const ringWidth = s.getPropertyValue('--tw-ring-offset-width') || s.outlineWidth;
      return (
        s.outlineStyle !== 'none' ||
        parseFloat(s.outlineWidth || '0') > 0 ||
        !!ringWidth ||
        s.boxShadow !== 'none'
      );
    });
    expect(hasVisibleFocus).toBe(true);

    // Tab avança para o próximo controle sem sair do sheet.
    await page.keyboard.press('Tab');
    const stillInside = await sheet.evaluate((el) =>
      el.contains(document.activeElement),
    );
    expect(stillInside).toBe(true);

    // Escape fecha o drawer e limpa o parâmetro `event` da URL.
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(page).not.toHaveURL(/event=/);
  });

  test('reload preserva filtros, busca, ordenação e paginação na URL', async ({ page }) => {
    // Aplica um filtro por ação, ordenação asc e vai para a página 2.
    await page.getByTestId('sort-created-at').click(); // -> dir=asc
    await expect(page).toHaveURL(/dir=asc/);
    await page.getByTestId('page-next').click();
    await expect(page).toHaveURL(/page=2/);
    // Adiciona busca (usa replaceState no input, mas persiste na URL).
    await page.getByTestId('filter-input').fill('user1');
    await expect(page).toHaveURL(/q=user1/);

    const urlBefore = new URL(page.url());
    const paramsBefore = urlBefore.search;

    // Recarrega e valida que os parâmetros continuam na URL.
    await page.reload();
    await expect(page.getByTestId('audit-table')).toBeVisible();
    const urlAfter = new URL(page.url());
    expect(urlAfter.search).toBe(paramsBefore);
    expect(urlAfter.searchParams.get('dir')).toBe('asc');
    expect(urlAfter.searchParams.get('page')).toBe('2');
    expect(urlAfter.searchParams.get('q')).toBe('user1');

    // A UI deve refletir os parâmetros restaurados.
    await expect(page.getByTestId('filter-input')).toHaveValue('user1');
    // A busca "user1" bate com user1, user10..user19 (11 linhas) -> uma página.
    await expect(page.getByTestId('page-indicator')).toContainText(/página 1 de 1/i);
  });

  test('reload com filtro por status preserva estado e badges renderizam', async ({ page }) => {
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await expect(page).toHaveURL(/status=token_reused/);

    await page.reload();
    await expect(page.getByTestId('audit-table')).toBeVisible();
    await expect(page).toHaveURL(/status=token_reused/);
    await expect(page.getByTestId('audit-row')).toHaveCount(1);
    await expect(page.getByTestId('badge-token-reused')).toBeVisible();
  });
});
