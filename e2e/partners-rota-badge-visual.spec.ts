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

/**
 * Matriz de viewports: cada estado de retry (`tavily`, `tavily_cache`,
 * `suggested`) é comparado por snapshot em mobile, tablet e desktop. Snapshots
 * ficam nomeados como `badge-<source>-<viewport>.png`, isolando regressões
 * de layout responsivo (por exemplo, badge quebrando linha em mobile).
 */
/**
 * Matriz responsiva + DPR. `mobile` e `desktop` também são executados em
 * high-DPI (`deviceScaleFactor: 2`) para pegar regressões de renderização
 * em telas Retina/HiDPI (fontes com anti-aliasing diferente, ícones
 * borrados, sombras em pixels fracionários).
 */
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dpr: 1 },
  { name: 'mobile@2x', width: 390, height: 844, dpr: 2 },
  { name: 'tablet', width: 768, height: 1024, dpr: 1 },
  { name: 'desktop', width: 1280, height: 800, dpr: 1 },
  { name: 'desktop@2x', width: 1280, height: 800, dpr: 2 },
] as const;

// Congelar o relógio evita que carimbos "há X min", `Date.now()` em UUIDs
// e animações baseadas em `performance.now()` mudem entre execuções.
const FIXED_TIME = new Date('2025-01-15T12:00:00Z');

for (const vp of VIEWPORTS) {
  test.describe(`PartnersRota — regressão visual do badge/tooltip (${vp.name})`, () => {
    test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      // reducedMotion já é 'reduce' no config global, reafirmado aqui para
      // isolamento por describe caso alguém rode o arquivo diretamente.
      reducedMotion: 'reduce',
    });

    test(`badge/tooltip consistentes por source em ${vp.name}`, async ({ page }) => {
    // Relógio determinístico ANTES de qualquer navegação — captura módulos
    // que leem `Date.now()` na inicialização.
    await page.clock.install({ time: FIXED_TIME });

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

    // Reforça a desativação de animações mesmo em libs (framer-motion,
    // Radix) que ignoram `prefers-reduced-motion`. Também mata o caret
    // pulsante de inputs, uma fonte comum de diff intermitente.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
          scroll-behavior: auto !important;
        }
      `,
    });

    // Após injetar o CSS, avança o relógio para drenar timers pendentes
    // (framer-motion agenda frames com setTimeout) sem esperar tempo real.
    await page.clock.runFor(500);

    const gerar = page.getByRole('button', { name: /gerar roteiro/i });
    if (await gerar.isVisible().catch(() => false)) {
      await gerar.click();
    }

    for (let i = 0; i < sequence.length; i++) {
      const badge = page.getByTestId('ai-source-badge');
      await expect(badge).toBeVisible();
      await expect(badge).toHaveAttribute('data-source', sequence[i]);

      // Snapshot do badge por origem + viewport.
      await expect(badge).toHaveScreenshot(`badge-${sequence[i]}-${vp.name}.png`, {
        maxDiffPixelRatio: 0.02,
      });

      // Abre o tooltip via foco (Radix expõe role="tooltip" no portal).
      await badge.focus();
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toHaveScreenshot(`tooltip-${sequence[i]}-${vp.name}.png`, {
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
}

/**
 * Garantia extra de determinismo: durante a janela do snapshot, nem o
 * badge nem o tooltip podem ter animação/transição CSS em execução. Se
 * qualquer `animation-name` ≠ "none" ou `transition-duration` > 0 for
 * detectado no trigger, no content ou em qualquer descendente, o teste
 * falha — indicando que o CSS injetado (reduced-motion + overrides) não
 * está sendo aplicado como esperado e futuros diffs podem flakiar.
 */
test.describe('PartnersRota — badge/tooltip sem animações ativas durante snapshot', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');
  test.use({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });

  test('nenhuma animação/transição CSS ativa em badge nem tooltip', async ({ page }) => {
    await page.clock.install({ time: FIXED_TIME });
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_VALIDO,
          structured: { dias: [], dicas: [] },
          source: 'tavily',
          meta: {
            tavily_configured: true,
            tavily_hits: 1,
            cache_hits: 0,
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
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });
    await page.clock.runFor(500);

    const gerar = page.getByRole('button', { name: /gerar roteiro/i });
    if (await gerar.isVisible().catch(() => false)) await gerar.click();

    const badge = page.getByTestId('ai-source-badge');
    await expect(badge).toBeVisible();

    // Auditor: retorna nomes de propriedades animadas em execução para
    // um elemento e todos os descendentes.
    const audit = async (locator: import('@playwright/test').Locator, label: string) => {
      const findings = await locator.evaluate((root) => {
        const active: Array<{ tag: string; prop: string; value: string }> = [];
        const nodes: Element[] = [root, ...Array.from(root.querySelectorAll('*'))];
        for (const el of nodes) {
          const cs = getComputedStyle(el);
          if (cs.animationName && cs.animationName !== 'none') {
            const dur = parseFloat(cs.animationDuration || '0') || 0;
            if (dur > 0) active.push({ tag: el.tagName, prop: 'animation-name', value: cs.animationName });
          }
          const tdur = (cs.transitionDuration || '')
            .split(',')
            .map((s) => parseFloat(s) || 0)
            .reduce((a, b) => Math.max(a, b), 0);
          if (tdur > 0) {
            active.push({ tag: el.tagName, prop: 'transition-duration', value: cs.transitionDuration });
          }
        }
        return active;
      });
      expect(
        findings,
        `${label}: propriedades animadas ativas durante o snapshot:\n${JSON.stringify(findings, null, 2)}`,
      ).toEqual([]);
    };

    await audit(badge, 'badge');

    await badge.focus();
    const tooltip = page.locator('[role="tooltip"]').first();
    await expect(tooltip).toBeVisible();
    // Drena qualquer transição de abertura remanescente antes de auditar.
    await page.clock.runFor(300);
    await audit(tooltip, 'tooltip');
  });
});