import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Complementa e2e/audit-drawer-axe-focus.spec.ts:
 *  - Verifica retorno de foco ao gatilho exato ao abrir o drawer a partir de
 *    múltiplas linhas distintas e fechá-lo via Escape ou clique no overlay.
 *  - Garante que os botões "Copiar" escrevem apenas o dado permitido no
 *    clipboard, sem vazar Trace ID em outro botão, IP, e-mail alvo/secundário
 *    ou trechos do payload sanitizado.
 *  - Executa varredura axe-core em toda a página (tabela + filtros + drawer)
 *    validando ausência de violações críticas/serias de ARIA e contraste.
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

const fixtures = [
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `succ-${i}`,
    actor_email: null,
    target_email: `user${i}@example.com`,
    action: 'self_request',
    success: true,
    error_message: null,
    ip_address: `10.0.0.${10 + i}`,
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

test.describe('Auditoria de senhas — restauração de foco, clipboard seguro e axe página inteira', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockAudit(page);
    await login(page);
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();
  });

  test('foco volta ao gatilho para múltiplas linhas, fechando via Escape e overlay', async ({ page }) => {
    const triggers = page.getByTestId('view-details');
    const total = await triggers.count();
    expect(total).toBeGreaterThanOrEqual(4);

    // Testa 4 linhas diferentes (0, 1, 2, última) alternando Escape e overlay.
    const indices = [0, 1, 2, total - 1];
    const sheet = page.getByTestId('event-detail-sheet');

    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      const trigger = triggers.nth(idx);
      const rowId = await trigger.getAttribute('data-row-id');
      expect(rowId, `linha #${idx} deve ter data-row-id`).toBeTruthy();

      await trigger.focus();
      await trigger.press('Enter');
      await expect(sheet).toBeVisible();

      if (k % 2 === 0) {
        await page.keyboard.press('Escape');
      } else {
        // Clica bem fora do sheet para atingir o overlay do Radix Dialog.
        await page.mouse.click(5, 5);
      }
      await expect(sheet).toBeHidden();

      const focusedRowId = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.getAttribute('data-row-id'),
      );
      expect(
        focusedRowId,
        `linha #${idx}: foco deve retornar ao gatilho (data-row-id=${rowId})`,
      ).toBe(rowId);
    }
  });

  test('clipboard: copiar Trace ID e IP grava apenas o valor esperado, sem vazar payload', async ({ page }) => {
    // Linha com token reutilizado — o error_message contém e-mail secundário e a palavra "Token".
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();

    // 1) Copiar Trace ID → clipboard tem exatamente o id.
    await page.getByTestId('copy-trace-id').click();
    const traceClip = await page.evaluate(() => navigator.clipboard.readText());
    expect(traceClip).toBe('tr-1');
    expect(traceClip).not.toContain('10.0.0.3');
    expect(traceClip).not.toContain('leak@example.com');
    expect(traceClip).not.toContain('reuse@example.com');
    expect(traceClip.toLowerCase()).not.toContain('token');
    expect(traceClip.toLowerCase()).not.toContain('jwt');
    expect(traceClip).not.toMatch(/ey[A-Za-z0-9_-]{5,}/); // fragmento típico de JWT

    // 2) Copiar IP → clipboard tem exatamente o IP.
    await page.getByTestId('copy-ip').click();
    const ipClip = await page.evaluate(() => navigator.clipboard.readText());
    expect(ipClip).toBe('10.0.0.3');
    expect(ipClip).not.toBe('tr-1');
    expect(ipClip).not.toContain('leak@example.com');
    expect(ipClip).not.toContain('reuse@example.com');
    expect(ipClip.toLowerCase()).not.toContain('token');

    // 3) Fecha e abre outra linha (rate limit) — nenhum resíduo dos valores anteriores deve ser copiado.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('event-detail-sheet')).toBeHidden();
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /bloqueio por rate limit/i }).click();
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('detail-trace-id')).toHaveText('rl-1');

    await page.getByTestId('copy-trace-id').click();
    const traceClip2 = await page.evaluate(() => navigator.clipboard.readText());
    expect(traceClip2).toBe('rl-1');
    expect(traceClip2).not.toContain('tr-1');

    await page.getByTestId('copy-ip').click();
    const ipClip2 = await page.evaluate(() => navigator.clipboard.readText());
    expect(ipClip2).toBe('10.0.0.2');
    // Não vaza JWT que aparece no error_message dessa linha.
    expect(ipClip2).not.toMatch(/ey[A-Za-z0-9_-]{5,}/);
    expect(ipClip2.toLowerCase()).not.toContain('token');
  });

  test('axe-core: página inteira (tabela + filtros) sem violações críticas/serias', async ({ page }) => {
    // Espera as linhas renderizarem antes de auditar.
    await expect(page.getByTestId('audit-row').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) =>
      v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      serious,
      `Violações axe (página):\n${JSON.stringify(serious, null, 2)}`,
    ).toEqual([]);
  });

  test('axe-core: página inteira com drawer aberto sem violações críticas/serias', async ({ page }) => {
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter((v) =>
      v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      serious,
      `Violações axe (drawer aberto):\n${JSON.stringify(serious, null, 2)}`,
    ).toEqual([]);
  });
});
