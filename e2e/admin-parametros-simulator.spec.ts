import { test, expect } from '@playwright/test';

/**
 * E2E — edita taxas em /admin/parametros e confirma que o
 * PartnersSimulator lê imediatamente os novos valores do banco.
 *
 * Requer as credenciais admin em env: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 * Sem elas, o teste é pulado para não quebrar CI de projetos sem seed.
 */

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe('AdminParametros → PartnersSimulator', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Sem credenciais admin (E2E_ADMIN_EMAIL/PASSWORD).');

  test('edita taxas e simulador reflete os novos valores', async ({ page }) => {
    // Login
    await page.goto('/auth');
    await page.getByLabel(/e-?mail/i).fill(ADMIN_EMAIL!);
    await page.getByLabel(/senha/i).fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL(/\/(dashboard|admin|partners|representantes)/, { timeout: 15000 });

    // Parâmetros
    await page.goto('/admin/parametros');
    await expect(page.getByRole('heading', { name: /Parâmetros do Sistema/i })).toBeVisible();

    // Novos valores (%) — usa números levemente diferentes p/ detectar propagação
    const NEW = {
      taxa_comissao_representante: '1.75',
      taxa_bonificacao_direta:     '1.65',
      taxa_bonificacao_rede:       '0.25',
    };

    const setRate = async (inputId: string, value: string) => {
      const input = page.locator(`#${inputId}`);
      await input.click();
      await input.fill(value);
      const card = input.locator('xpath=ancestor::*[contains(@class,"rounded-lg")][1]');
      await card.getByRole('button', { name: /salvar/i }).click();
      await expect(page.getByText(/atualizada/i).first()).toBeVisible({ timeout: 8000 });
    };

    await setRate('rate-taxa_comissao_representante', NEW.taxa_comissao_representante);
    await setRate('rate-taxa_bonificacao_direta',     NEW.taxa_bonificacao_direta);
    await setRate('rate-taxa_bonificacao_rede',       NEW.taxa_bonificacao_rede);

    // Abre o simulador e valida propagação imediata
    await page.goto('/partners/simulator');
    // Verifica que a página do simulador aparece e usa os novos percentuais em algum lugar visível.
    // Aceita formatação pt-BR com vírgula OU ponto.
    const bodyText = await page.locator('body').innerText();
    const contains = (v: string) =>
      bodyText.includes(v) || bodyText.includes(v.replace('.', ','));
    expect(contains(NEW.taxa_bonificacao_direta), 'simulador deve refletir bonificação direta').toBeTruthy();
    expect(contains(NEW.taxa_bonificacao_rede),   'simulador deve refletir bonificação rede').toBeTruthy();
  });
});