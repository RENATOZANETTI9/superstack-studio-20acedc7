import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Cobertura complementar do drawer de detalhes da Auditoria de Senhas:
 *  - Varredura automatizada com axe-core (ARIA + contraste de foco).
 *  - Feedback acessível dos botões de copiar via aria-live/role=status,
 *    sem anunciar o conteúdo copiado (sensível).
 *  - Ordem de navegação por teclado dentro do drawer (Tab / Shift+Tab)
 *    sem foco preso fora do sheet.
 *  - Retorno de foco ao gatilho após fechar via Escape e via clique no overlay.
 *
 * Segue o mesmo padrão dos fixtures/login usados em e2e/audit-passwords.spec.ts.
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

const fixtures = [
  ...Array.from({ length: 3 }, (_, i) => ({
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

test.describe('Auditoria de senhas — axe + gerenciamento de foco no drawer', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockAudit(page);
    await login(page);
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();
  });

  test('axe-core: drawer aberto não apresenta violações críticas de ARIA/contraste', async ({ page }) => {
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[data-testid="event-detail-sheet"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) =>
      v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      serious,
      `Violações axe:\n${JSON.stringify(serious, null, 2)}`,
    ).toEqual([]);
  });

  test('copiar: aria-live anuncia "Copiado" sem expor o valor copiado', async ({ page }) => {
    // Abrir a linha do token reutilizado (contém e-mail no error_message que NÃO deve vazar).
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();

    const live = page.getByTestId('copy-live-region');
    // A região viva existe com role=status e começa vazia (sem anúncio).
    await expect(live).toHaveAttribute('role', 'status');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveText('');

    await page.getByTestId('copy-trace-id').click();
    // Anúncio genérico, sem incluir o Trace ID, IP, ou payload sensível.
    await expect(live).toHaveText(/copiado para a área de transferência/i);
    const liveText = (await live.textContent()) ?? '';
    expect(liveText).not.toContain('tr-1');
    expect(liveText).not.toContain('10.0.0.3');
    expect(liveText).not.toContain('leak@example.com');
    expect(liveText).not.toMatch(/token/i);

    // Após ~1.6s o anúncio é limpo para não repetir/persistir.
    await expect(live).toHaveText('', { timeout: 3000 });
  });

  test('teclado: Tab/Shift+Tab percorre controles do drawer sem escapar', async ({ page }) => {
    await page.getByTestId('view-details').first().click();
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();

    // Percorre 12 tabulações e valida que o foco sempre continua dentro do sheet.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      const inside = await sheet.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `foco escapou do sheet no Tab #${i + 1}`).toBe(true);
    }

    // Shift+Tab também mantém o foco confinado.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Shift+Tab');
      const inside = await sheet.evaluate((el) => el.contains(document.activeElement));
      expect(inside, `foco escapou do sheet no Shift+Tab #${i + 1}`).toBe(true);
    }

    // Ordem lógica: focando "Copiar Trace ID" e tabulando, chegamos ao "Copiar IP".
    await page.getByTestId('copy-trace-id').focus();
    await expect(page.getByTestId('copy-trace-id')).toBeFocused();
    // Pode haver 1..N stops entre eles (botão de fechar do Radix não fica no meio);
    // avançamos até encontrar copy-ip com um limite seguro.
    let reached = false;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
      if (await page.getByTestId('copy-ip').evaluate((el) => el === document.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(reached, 'Tab a partir de copy-trace-id deve alcançar copy-ip').toBe(true);
  });

  test('foco retorna ao gatilho ao fechar por Escape e por clique no overlay', async ({ page }) => {
    // Marca o gatilho da segunda linha para diferenciá-lo dos demais.
    const triggers = page.getByTestId('view-details');
    const trigger = triggers.nth(1);
    const rowId = await trigger.getAttribute('data-row-id');
    expect(rowId).toBeTruthy();

    // 1) Fechar via Escape
    await trigger.focus();
    await trigger.press('Enter');
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    const focusedAfterEsc = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-row-id'),
    );
    expect(focusedAfterEsc).toBe(rowId);

    // 2) Reabrir e fechar via clique no overlay
    await trigger.click();
    await expect(sheet).toBeVisible();

    // O overlay é o irmão anterior ao content dentro do portal do Radix Dialog.
    // Clicamos em uma posição bem fora do sheet (canto superior esquerdo) para atingir o overlay.
    await page.mouse.click(5, 5);
    await expect(sheet).toBeHidden();

    const focusedAfterOverlay = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-row-id'),
    );
    expect(focusedAfterOverlay).toBe(rowId);
  });
});
