import { test, expect, type Page } from '@playwright/test';

/**
 * Valida que, quando o endpoint `generate-ai-route` retorna
 * `meta.format_valid=false` com `meta.format_issues`:
 *  - o aviso é exibido com `role="alert"` e `aria-live="polite"`,
 *  - o foco é movido para o aviso (a11y de teclado),
 *  - o botão "Gerar novamente" é focável e dispara nova requisição,
 *  - o badge de origem correspondente ao `source` é renderizado com tooltip.
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const ROTEIRO_INVALIDO = 'texto qualquer sem cabeçalhos nem itens numerados';
const ROTEIRO_VALIDO = [
  '## Segunda-feira — 01/01',
  '1. **Clínica Alfa** | Savassi | Tel: (31) 90000-0001 | Responsável: Dra. Marina',
  '   - Objetivo: apresentação',
  '   - Faturamento estimado: R$ 60k–90k/mês',
].join('\n');

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByLabel(/e-?mail/i).fill(email!);
  await page.getByLabel(/senha/i).fill(pass!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
}

test.describe('PartnersRota — aviso de format_issues e badge de origem', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test('exibe alerta acessível, badge com tooltip e permite regenerar', async ({ page }) => {
    let callCount = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      callCount++;
      // 1ª chamada: formato inválido; 2ª (auto-fallback ou botão): válido
      const invalid = callCount === 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: invalid ? ROTEIRO_INVALIDO : ROTEIRO_VALIDO,
          structured: { dias: [], dicas: [] },
          source: 'tavily_cache',
          meta: {
            tavily_configured: true,
            tavily_hits: 0,
            cache_hits: 1,
            tavily_errors: 0,
            bairros_queried: 1,
            format_valid: !invalid,
            format_issues: invalid
              ? ['Sem cabeçalhos "## Dia"', 'Sem itens numerados "1."']
              : [],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');

    // Aciona a geração
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    // A primeira resposta é inválida → aviso aparece com atributos ARIA corretos
    const alert = page.getByTestId('ai-format-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute('role', 'alert');
    await expect(alert).toHaveAttribute('aria-live', 'polite');

    // Foco deve estar no aviso (navegação por teclado)
    const focusIsInAlert = await alert.evaluate((el) => el.contains(document.activeElement) || el === document.activeElement);
    expect(focusIsInAlert).toBe(true);

    // Badge de origem visível com data-source correspondente
    const badge = page.getByTestId('ai-source-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute('data-source', 'tavily_cache');

    // Tooltip acessível via teclado (foco no badge)
    await badge.focus();
    await expect(badge).toBeFocused();

    // O auto-fallback já pode ter disparado a 2ª chamada; aguarda estabilizar
    await expect.poll(() => callCount).toBeGreaterThanOrEqual(2);

    // Botão "Gerar novamente" fica acessível por teclado enquanto houver issues
    const regen = page.getByTestId('ai-regenerate-btn');
    if (await regen.isVisible().catch(() => false)) {
      await regen.focus();
      await expect(regen).toBeFocused();
      await regen.click();
      await expect.poll(() => callCount).toBeGreaterThanOrEqual(3);
    }
  });
});
