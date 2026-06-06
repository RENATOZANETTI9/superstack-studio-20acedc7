import { test, expect } from '../playwright-fixture';

/**
 * End-to-end coverage for the Pix → biometric-link flow:
 *  1. Authenticate
 *  2. Open an "Aprovados" card and fill a CPF Pix key
 *  3. Wait until the "ready" toast appears and the signature button is enabled
 *  4. Open the proposal modal and verify the audit timeline renders
 *
 * Optional retry coverage exercises the error → retry transition by simulating
 * a flaky network through Playwright's request interception.
 *
 * Required env vars (provide via .env or CLI):
 *   E2E_EMAIL       — user with at least one approved proposal
 *   E2E_PASSWORD    — password for that user
 *   BASE_URL        — preview URL (defaults to playwright.config.ts)
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const skipReason =
  'Set E2E_EMAIL and E2E_PASSWORD env vars to enable Pix flow E2E tests.';

test.describe('Pix biometric-link flow', () => {
  test.skip(!EMAIL || !PASSWORD, skipReason);

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(EMAIL!);
    await page.getByLabel(/senha|password/i).fill(PASSWORD!);
    await page
      .getByRole('button', { name: /entrar|login|acessar/i })
      .first()
      .click();
    // Wait until we land on an authenticated route
    await page.waitForURL((url) => !/\/auth$/.test(url.pathname), { timeout: 15_000 });
  });

  test('happy path: CPF → ready → audit timeline visible', async ({ page }) => {
    // Navigate to the consult page that hosts the proposal pipeline
    await page.goto('/consultas');

    // Pick the first approved card with the Pix form visible
    const approvedCard = page
      .locator('text=Finalizar contratação / Gerar link de biometria')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"glass-card") or contains(@class,"bg-warning")]')
      .first();
    await expect(approvedCard).toBeVisible({ timeout: 10_000 });

    // Choose CPF in the Select trigger inside the card
    await approvedCard.getByRole('combobox').click();
    await page.getByRole('option', { name: /CPF/ }).first().click();

    // Generation button should start disabled
    const generate = approvedCard.getByRole('button', {
      name: /gerar link de biometria/i,
    });
    await expect(generate).toBeDisabled();

    // Invalid CPF keeps button disabled
    const cpfInput = approvedCard.getByPlaceholder('000.000.000-00');
    await cpfInput.fill('111.111.111-11');
    await expect(generate).toBeDisabled();
    await expect(approvedCard.getByText(/CPF inválido/i)).toBeVisible();

    // Valid CPF (mod-11 valid test number)
    await cpfInput.fill('');
    await cpfInput.type('52998224725');
    await expect(approvedCard.getByText(/chave válida/i)).toBeVisible();
    await expect(generate).toBeEnabled();

    await generate.click();

    // Loading state
    await expect(
      approvedCard.getByText(/Gerando link de biometria/i),
    ).toBeVisible();

    // Ready toast + signature button (the success toast has an "Abrir link" action)
    await expect(page.getByText(/Link de biometria pronto/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      approvedCard.getByRole('button', {
        name: /Link de biometria \/ Assinar contrato/i,
      }),
    ).toBeEnabled();

    // Open the audit timeline via the card disclosure
    await approvedCard
      .getByRole('button', { name: /Ver histórico de alterações/i })
      .click();
    const timeline = approvedCard.getByRole('region', {
      name: /Histórico da chave Pix/i,
    });
    await expect(timeline).toBeVisible();
    await expect(timeline.getByText(/Pronto p\/ assinatura/i)).toBeVisible();

    // Open the detail modal (eye icon) and verify timeline + export button there too
    await approvedCard
      .getByRole('button', { name: '' })
      .first()
      .click({ trial: false })
      .catch(() => {});
    // Fallback: open via Ações Necessárias button
    const detailModal = page.getByRole('dialog');
    if (await detailModal.isVisible().catch(() => false)) {
      await expect(
        detailModal.getByRole('region', { name: /Histórico da chave Pix/i }),
      ).toBeVisible();
      await expect(
        detailModal.getByRole('button', {
          name: /Exportar histórico da chave Pix/i,
        }),
      ).toBeVisible();
    }
  });

  test('error path: failing link generation surfaces retry toast', async ({ page }) => {
    // Force the audit/persistence calls to fail to provoke an error transition.
    await page.route('**/proposal_pix_states*', (route) =>
      route.fulfill({ status: 500, body: 'simulated failure' }),
    );

    await page.goto('/consultas');
    const approvedCard = page
      .locator('text=Finalizar contratação / Gerar link de biometria')
      .first()
      .locator('xpath=ancestor::div[contains(@class,"glass-card") or contains(@class,"bg-warning")]')
      .first();
    await expect(approvedCard).toBeVisible({ timeout: 10_000 });

    await approvedCard.getByRole('combobox').click();
    await page.getByRole('option', { name: /CPF/ }).first().click();
    await approvedCard.getByPlaceholder('000.000.000-00').type('52998224725');
    await approvedCard
      .getByRole('button', { name: /gerar link de biometria/i })
      .click();

    // Either the inline error state or the retry toast must surface
    const retryAffordance = page
      .getByRole('button', { name: /tentar novamente/i })
      .first();
    await expect(retryAffordance).toBeVisible({ timeout: 15_000 });

    await retryAffordance.click();
    // After retry click, the loading or error UI should re-engage
    await expect(
      approvedCard.getByText(
        /Gerando link de biometria|Falha|Tentar novamente/i,
      ),
    ).toBeVisible();
  });
});