import { test, expect, type Page } from '@playwright/test';

/**
 * Visual regression — o badge de origem (`data-testid="ai-source-badge"`)
 * e seu tooltip devem renderizar consistentemente em cada retry, mesmo
 * quando o `source` muda entre `tavily`, `tavily_cache` e `suggested`.
 *
 * Também confirma que nenhum tooltip "fantasma" (nó Radix Portal) sobrevive
 * a um retry — evitando o cenário de leitores de tela anunciarem conteúdo
 * antigo ou de artefatos visuais sobrepostos.
 *
 * Screenshots ficam em `e2e/__screenshots__/partners-rota-badge-visual.spec.ts/`
 * — regenere com `bun run test:e2e:visual -- --update-snapshots` quando o
 * design mudar intencionalmente.
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

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

test.describe('PartnersRota — regressão visual do badge/tooltip de source', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test('badge renderiza consistentemente por source e tooltip não deixa nós obsoletos', async ({
    page,
  }) => {
    const sequence = ['tavily', 'tavily_cache', 'suggested'] as const;
    let callCount = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const source = sequence[callCount % sequence.length];
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_VALIDO,
          structured: { dias: [], dicas: [] },
          source,
          meta: {
            tavily_configured: true,
            tavily_hits: source === 'tavily' ? 1 : 0,
            cache_hits: source === 'tavily_cache' ? 1 : 0,
            tavily_errors: 0,
            bairros_queried: 1,
            format_valid: true,
            format_issues: [],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');

    // Estabiliza a UI (desliga animações que geram diff falso positivo).
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
    });

    const gerar = page.getByRole('button', { name: /gerar roteiro/i });
    if (await gerar.isVisible().catch(() => false)) {
      await gerar.click();
    }

    for (let i = 0; i < sequence.length; i++) {
      const badge = page.getByTestId('ai-source-badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveAttribute('data-source', sequence[i]);

      // Snapshot do badge por origem.
      await expect(badge).toHaveScreenshot(`badge-${sequence[i]}.png`, {
        maxDiffPixelRatio: 0.02,
      });

      // Abre o tooltip via foco (Radix expõe role="tooltip" no portal).
      await badge.focus();
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveScreenshot(`tooltip-${sequence[i]}.png`, {
        maxDiffPixelRatio: 0.02,
      });

      // Fecha e garante que NENHUM tooltip permanece no DOM antes do retry.
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="tooltip"]')).toHaveCount(0);

      // Retry para o próximo source.
      if (i < sequence.length - 1) {
        const regen = page.getByRole('button', { name: /gerar novamente/i });
        await regen.click();
        await expect(badge).toHaveAttribute('data-source', sequence[i + 1]);
      }
    }

    // Nenhum badge duplicado deve sobrar após múltiplos retries.
    await expect(page.getByTestId('ai-source-badge')).toHaveCount(1);
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
  });
});