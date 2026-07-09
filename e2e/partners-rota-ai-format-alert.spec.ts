import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

  test('aria-describedby conecta título ao alerta, Tab percorre badge e regen, e axe não acusa violações', async ({ page }) => {
    // Todas as respostas retornam formato inválido → alerta persiste após auto-fallback.
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          source: 'suggested',
          meta: {
            tavily_configured: false,
            tavily_hits: 0,
            cache_hits: 0,
            tavily_errors: 0,
            bairros_queried: 0,
            format_valid: false,
            format_issues: [
              'Sem cabeçalhos "## Dia"',
              'Sem itens numerados "1."',
            ],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const alert = page.getByTestId('ai-format-alert');
    await expect(alert).toBeVisible();

    // aria-describedby do título aponta para o id do alerta e o id existe.
    const title = page.locator('#ai-route-title');
    await expect(title).toHaveAttribute('aria-describedby', 'ai-format-alert');
    await expect(alert).toHaveAttribute('id', 'ai-format-alert');
    await expect(alert).toHaveAttribute('aria-labelledby', 'ai-route-title');

    // Navegação por teclado: partindo do alerta (que recebeu foco), Tab
    // deve alcançar o botão "Gerar novamente" e depois o badge de origem
    // (ambos focáveis) sem depender do mouse.
    const focusedOnAlert = await alert.evaluate(
      (el) => el === document.activeElement || el.contains(document.activeElement),
    );
    expect(focusedOnAlert).toBe(true);

    const regen = page.getByTestId('ai-regenerate-btn');
    const badge = page.getByTestId('ai-source-badge');

    let reachedRegen = false;
    let reachedBadge = false;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      if (!reachedRegen && (await regen.evaluate((el) => el === document.activeElement))) {
        reachedRegen = true;
      }
      if (reachedRegen && (await badge.evaluate((el) => el === document.activeElement))) {
        reachedBadge = true;
        break;
      }
    }
    expect(reachedRegen, 'Tab a partir do alerta deve alcançar o botão Gerar novamente').toBe(true);
    expect(reachedBadge, 'Tab após o botão deve alcançar o badge de origem').toBe(true);

    // Tooltip do badge acessível por foco (aparece via focus, não só hover).
    await badge.focus();
    await expect(badge).toBeFocused();

    // Varredura axe-core: alerta aria-live e badge/tooltip não devem ter
    // violações críticas de ARIA/contraste.
    const results = await new AxeBuilder({ page })
      .include('[data-testid="ai-format-alert"]')
      .include('[data-testid="ai-source-badge"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      serious,
      `Violações axe:\n${JSON.stringify(serious, null, 2)}`,
    ).toEqual([]);
  });
});
