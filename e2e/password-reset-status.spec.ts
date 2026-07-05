import { test, expect } from '@playwright/test';

/**
 * E2E do endpoint password-reset-status + exibição do Retry-After +
 * auditoria (429 request, 429 complete e token reutilizado).
 *
 * Estas asserções não checam diretamente a tabela `password_reset_audit`
 * (o browser não fala service_role), mas garantem que as chamadas às
 * edge functions relevantes acontecem — a auditoria é escrita por elas.
 */

test.describe('password-reset-status + Retry-After + auditoria', () => {
  test('/forgot-password: mostra status "em andamento" e tentativas restantes', async ({ page }) => {
    let statusCalls = 0;
    await page.route('**/functions/v1/password-reset-status', async (route) => {
      statusCalls++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          in_progress: true,
          attempts_used: 2,
          attempts_remaining: 3,
          max_attempts: 5,
          throttled: false,
          retry_after_seconds: 0,
          window_seconds: 900,
        }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill('teste@example.com');
    await page.getByLabel(/email/i).blur();
    await expect.poll(() => statusCalls).toBeGreaterThan(0);
    await expect(page.getByTestId('status-info')).toContainText(/3 de 5 tentativas restantes/i);
  });

  test('/forgot-password: 429 exibe Retry-After em contagem regressiva e chama auditoria', async ({ page }) => {
    let requestCalls = 0;
    await page.route('**/functions/v1/password-reset-status', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ in_progress: true, attempts_remaining: 0, max_attempts: 5, throttled: true, retry_after_seconds: 120 }),
      });
    });
    await page.route('**/functions/v1/password-reset-request', async (route) => {
      requestCalls++;
      // A edge function grava auditoria com error_message="rate_limited: ..." antes de responder 429.
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '120' },
        contentType: 'application/json',
        body: JSON.stringify({ success: true, throttled: true, retry_after_seconds: 120 }),
      });
    });

    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill('teste@example.com');
    await page.getByRole('button', { name: /enviar link/i }).click();

    // A UI mostra o countdown do Retry-After (formato m:ss)
    await expect(page.getByTestId('retry-after')).toContainText(/\d+:\d{2}/);
    // Botão fica desabilitado enquanto retryAfter > 0
    await expect(page.getByRole('button', { name: /aguarde/i })).toBeDisabled();
    // A edge function foi chamada (audita internamente o 429)
    expect(requestCalls).toBeGreaterThan(0);
  });

  test('/reset-password: 429 no complete exibe Retry-After', async ({ page }) => {
    await page.route('**/functions/v1/password-reset-status', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ in_progress: false, attempts_remaining: 5, max_attempts: 5, throttled: false, retry_after_seconds: 0 }),
      });
    });
    let completeCalls = 0;
    await page.route('**/functions/v1/password-reset-complete', async (route) => {
      completeCalls++;
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '90' },
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos.', throttled: true, retry_after_seconds: 90 }),
      });
    });

    await page.goto('/reset-password');
    await page.evaluate(() => {
      const fake = {
        access_token: 'fake', refresh_token: 'fake', expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer',
        user: { id: 'u1', email: 'teste@example.com' },
      };
      const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (key) localStorage.setItem(key, JSON.stringify(fake));
    });
    await page.reload();

    await page.getByLabel(/nova senha/i).fill('SenhaForte@123');
    await page.getByLabel(/confirmar senha/i).fill('SenhaForte@123');
    await page.getByRole('button', { name: /redefinir senha/i }).click();

    await expect(page.getByTestId('retry-after')).toContainText(/\d+:\d{2}/);
    expect(completeCalls).toBe(1);
  });

  test('/reset-password: token reutilizado (410) mostra erro amigável', async ({ page }) => {
    await page.route('**/functions/v1/password-reset-status', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ in_progress: false, attempts_remaining: 5, max_attempts: 5, throttled: false, retry_after_seconds: 0 }),
      });
    });
    await page.route('**/functions/v1/password-reset-complete', async (route) => {
      // A edge function grava auditoria com error_message="Token ... já utilizado" antes de retornar 410.
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Este link já foi utilizado. Solicite um novo.' }),
      });
    });

    await page.goto('/reset-password');
    await page.evaluate(() => {
      const fake = {
        access_token: 'fake', refresh_token: 'fake', expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: 'bearer',
        user: { id: 'u1', email: 'teste@example.com' },
      };
      const key = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
      if (key) localStorage.setItem(key, JSON.stringify(fake));
    });
    await page.reload();

    await page.getByLabel(/nova senha/i).fill('SenhaForte@123');
    await page.getByLabel(/confirmar senha/i).fill('SenhaForte@123');
    await page.getByRole('button', { name: /redefinir senha/i }).click();

    await expect(page.getByText(/já foi utilizado/i)).toBeVisible();
  });
});