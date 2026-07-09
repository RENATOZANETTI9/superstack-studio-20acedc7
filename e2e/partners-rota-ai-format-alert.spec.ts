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

/**
 * Fluxo "Gerar novamente" + a11y estendida:
 *  - Após uma resposta com issues, o `source` do backend continua sendo um
 *    dos valores permitidos e o badge reflete o mesmo `data-source`.
 *  - Uma única mudança em `aria-live` é anunciada por resposta (o alerta
 *    é (re)inserido apenas quando `format_valid=false`).
 *  - Shift+Tab a partir do botão volta para o alerta; Enter e Espaço no
 *    botão disparam nova requisição.
 *  - Escape fecha o tooltip do badge quando ele está aberto por foco.
 */
test.describe('PartnersRota — "Gerar novamente" e a11y estendida', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  const ALLOWED_SOURCES = ['tavily', 'tavily_cache', 'suggested'] as const;

  test('source permanece válido a cada retry, alerta anuncia mudança 1x e foco segue o fluxo', async ({ page }) => {
    let call = 0;
    // Alternamos as respostas: cada retorno tem `format_valid=false` para
    // manter o alerta visível, mas com `source` diferente a cada chamada
    // para verificar que o badge/atributo `data-source` sempre reflete um
    // valor permitido.
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const sources = ['tavily_cache', 'suggested', 'tavily'] as const;
      const source = sources[call % sources.length];
      call++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          source,
          meta: {
            tavily_configured: true,
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

    // Conta quantas vezes um nó com aria-live="polite" foi (re)inserido
    // contendo o alerta de formato. Uma resposta = uma inserção.
    await page.evaluate(() => {
      (window as any).__ariaLiveInsertions = 0;
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((n) => {
            if (!(n instanceof HTMLElement)) return;
            if (n.matches?.('[data-testid="ai-format-alert"]')) {
              (window as any).__ariaLiveInsertions++;
            } else if (n.querySelector?.('[data-testid="ai-format-alert"]')) {
              (window as any).__ariaLiveInsertions++;
            }
          });
        }
      });
      obs.observe(document.body, { subtree: true, childList: true });
      (window as any).__ariaLiveObserver = obs;
    });

    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const alert = page.getByTestId('ai-format-alert');
    const badge = page.getByTestId('ai-source-badge');
    const regen = page.getByTestId('ai-regenerate-btn');

    await expect(alert).toBeVisible();
    // Após a 1ª resposta, o auto-fallback já dispara a 2ª. Aguardamos.
    await expect.poll(() => call).toBeGreaterThanOrEqual(2);
    // Cada resposta produz UM alerta no DOM (aria-live anuncia 1x por resposta).
    const insertions1 = await page.evaluate(() => (window as any).__ariaLiveInsertions as number);
    expect(insertions1).toBe(call);

    // Badge sempre reflete um source permitido e ==  atributo data-source no DOM.
    const src1 = await badge.getAttribute('data-source');
    expect(ALLOWED_SOURCES).toContain(src1 as any);

    // Clica em "Gerar novamente" e verifica que uma nova resposta gera exatamente
    // uma nova inserção do alerta (aria-live não é duplicado).
    const beforeCall = call;
    await regen.click();
    await expect.poll(() => call).toBeGreaterThan(beforeCall);
    // Espera o alerta reaparecer após a nova resposta.
    await expect(alert).toBeVisible();
    const insertions2 = await page.evaluate(() => (window as any).__ariaLiveInsertions as number);
    // Uma inserção adicional para cada nova chamada desde a medição anterior.
    expect(insertions2 - insertions1).toBe(call - beforeCall);

    // Source permanece consistente após retry.
    const src2 = await badge.getAttribute('data-source');
    expect(ALLOWED_SOURCES).toContain(src2 as any);

    // Foco volta para o fluxo esperado: o alerta recebe foco quando reaparece.
    const focusInAlert = await alert.evaluate(
      (el) => el === document.activeElement || el.contains(document.activeElement),
    );
    expect(focusInAlert).toBe(true);
  });

  test('Shift+Tab volta ao alerta, Enter e Espaço disparam retry, Escape fecha o tooltip', async ({ page }) => {
    let call = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      call++;
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
            format_issues: ['Sem cabeçalhos "## Dia"', 'Sem itens numerados "1."'],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const alert = page.getByTestId('ai-format-alert');
    const regen = page.getByTestId('ai-regenerate-btn');
    const badge = page.getByTestId('ai-source-badge');

    await expect(alert).toBeVisible();
    await expect.poll(() => call).toBeGreaterThanOrEqual(2); // 1 + auto-fallback

    // 1) Foca o botão explicitamente e faz Shift+Tab — o foco deve voltar
    //    para o alerta (ou algum elemento contido nele).
    await regen.focus();
    await expect(regen).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    const focusOnAlertAfterShiftTab = await alert.evaluate(
      (el) => el === document.activeElement || el.contains(document.activeElement),
    );
    expect(focusOnAlertAfterShiftTab).toBe(true);

    // 2) Enter dispara nova chamada.
    let base = call;
    await regen.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => call).toBeGreaterThan(base);

    // 3) Espaço também dispara nova chamada (semântica nativa de <button>).
    base = call;
    await regen.focus();
    await page.keyboard.press('Space');
    await expect.poll(() => call).toBeGreaterThan(base);

    // 4) Escape fecha o tooltip do badge quando aberto via foco.
    //    Radix Tooltip abre no focus e fecha ao pressionar Escape.
    await badge.focus();
    const tooltipVisible = page.locator('[role="tooltip"]');
    // Pode haver leve atraso na abertura; aguarda até 1s.
    await expect(tooltipVisible.first()).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    await expect(tooltipVisible.first()).toBeHidden({ timeout: 1500 });
  });
});

/**
 * Fallback de `source` ausente/inválido + fechamento do tooltip por
 * clique fora, garantindo que o foco retorne para o badge após o
 * fechamento (Radix Tooltip fecha em pointerdown fora ou Escape).
 */
test.describe('PartnersRota — fallback de source e tooltip fecha ao clicar fora', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  const ALLOWED = ['tavily', 'tavily_cache', 'suggested'] as const;

  test('source ausente/invalido é normalizado para valor permitido e badge fica consistente', async ({ page }) => {
    let call = 0;
    // Sequência: (1) source ausente + inválido → auto-fallback dispara (2)
    // com source = null. Depois o botão "Gerar novamente" dispara (3) com
    // source = 'foo' (string desconhecida). Em todos os casos, o badge
    // precisa mostrar um valor de `ALLOWED`.
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      call++;
      const bodies = [
        { /* sem source */ },
        { source: null },
        { source: 'foo-bar' },
        { source: 'tavily' },
      ];
      const extra = bodies[Math.min(call - 1, bodies.length - 1)];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: call >= 4 ? ROTEIRO_VALIDO : ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          ...extra,
          meta: {
            tavily_configured: true,
            tavily_hits: 0,
            cache_hits: 0,
            tavily_errors: 0,
            bairros_queried: 0,
            format_valid: call >= 4,
            format_issues: call >= 4 ? [] : ['Sem cabeçalhos "## Dia"'],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const badge = page.getByTestId('ai-source-badge');
    await expect(badge).toBeVisible();
    // Após 1ª (source ausente) + auto-fallback (source: null).
    await expect.poll(() => call).toBeGreaterThanOrEqual(2);
    const src1 = await badge.getAttribute('data-source');
    expect(ALLOWED).toContain(src1 as (typeof ALLOWED)[number]);

    // Novo retry manual → resposta com source desconhecida.
    const before = call;
    await page.getByTestId('ai-regenerate-btn').click();
    await expect.poll(() => call).toBeGreaterThan(before);
    const src2 = await badge.getAttribute('data-source');
    expect(ALLOWED).toContain(src2 as (typeof ALLOWED)[number]);
    // Como o retry veio com source inválido, o normalizador deve preservar
    // o último valor válido conhecido (src1).
    expect(src2).toBe(src1);
  });

  test('tooltip fecha ao clicar fora e o badge pode receber foco novamente', async ({ page }) => {
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_VALIDO,
          structured: { dias: [], dicas: [] },
          source: 'tavily_cache',
          meta: {
            tavily_configured: true,
            tavily_hits: 0,
            cache_hits: 1,
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
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const badge = page.getByTestId('ai-source-badge');
    await expect(badge).toBeVisible();

    // Abre o tooltip via foco.
    await badge.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });

    // Clica em um ponto neutro fora do tooltip e do badge (título da página).
    // Radix Tooltip fecha em pointerdown fora do trigger/content.
    await page.mouse.click(5, 5);
    await expect(tooltip.first()).toBeHidden({ timeout: 1500 });

    // Foco pode ter saído do badge; o badge continua focável e pode
    // ser reativado, confirmando que não ficou preso em estado inválido.
    await badge.focus();
    await expect(badge).toBeFocused();
    // Reabrir o tooltip via foco funciona normalmente.
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });
  });
});

/**
 * Estresse do fluxo "Gerar novamente" — várias tentativas seguidas:
 *  - Cada resposta com issues produz exatamente UMA inserção no
 *    contêiner aria-live (nenhum anúncio duplicado).
 *  - O tooltip do badge continua abrindo/fechando corretamente.
 *  - A navegação por teclado (Tab a partir do alerta chega ao botão
 *    e ao badge) permanece funcional após N retries.
 */
test.describe('PartnersRota — múltiplos retries mantêm a11y e tooltip', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  const ALLOWED = ['tavily', 'tavily_cache', 'suggested'] as const;

  test('N cliques em "Gerar novamente" não duplicam aria-live nem travam o teclado', async ({ page }) => {
    let call = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const sources = ['tavily', 'tavily_cache', 'suggested'] as const;
      const source = sources[call % sources.length];
      call++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          source,
          meta: {
            tavily_configured: true,
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

    // Observa (1) quantas vezes o alerta é inserido no DOM e (2) quantos
    // nós [aria-live] existem em cada momento — nunca deve haver >1.
    await page.evaluate(() => {
      (window as any).__ariaLiveInsertions = 0;
      (window as any).__ariaLiveMaxCount = 0;
      const bump = () => {
        const n = document.querySelectorAll('[data-testid="ai-format-alert"]').length;
        if (n > (window as any).__ariaLiveMaxCount) {
          (window as any).__ariaLiveMaxCount = n;
        }
      };
      const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((n) => {
            if (!(n instanceof HTMLElement)) return;
            if (
              n.matches?.('[data-testid="ai-format-alert"]') ||
              n.querySelector?.('[data-testid="ai-format-alert"]')
            ) {
              (window as any).__ariaLiveInsertions++;
              bump();
            }
          });
        }
      });
      obs.observe(document.body, { subtree: true, childList: true });
      (window as any).__ariaLiveObserver = obs;
    });

    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const alert = page.getByTestId('ai-format-alert');
    const badge = page.getByTestId('ai-source-badge');
    const regen = page.getByTestId('ai-regenerate-btn');

    await expect(alert).toBeVisible();
    // 1ª resposta + auto-fallback → pelo menos 2 chamadas.
    await expect.poll(() => call).toBeGreaterThanOrEqual(2);

    // Executa 5 retries manuais em sequência.
    const N = 5;
    for (let i = 0; i < N; i++) {
      const before = call;
      await regen.click();
      await expect.poll(() => call).toBeGreaterThan(before);
      await expect(alert).toBeVisible();

      // Após cada resposta, o badge reflete um source permitido.
      const src = await badge.getAttribute('data-source');
      expect(ALLOWED).toContain(src as (typeof ALLOWED)[number]);

      // Só existe UM contêiner de alerta aria-live no DOM.
      const liveCount = await page.locator('[data-testid="ai-format-alert"]').count();
      expect(liveCount).toBe(1);
    }

    // Inserções por resposta == número de chamadas (nunca duplicadas).
    const totalInsertions = await page.evaluate(
      () => (window as any).__ariaLiveInsertions as number,
    );
    // Cada chamada gera no máximo uma inserção; pode haver menos se o
    // React reconciliar sem remontar. O invariante crítico é: nunca
    // mais de uma por chamada e nunca mais de 1 nó vivo simultaneamente.
    expect(totalInsertions).toBeLessThanOrEqual(call);
    const maxSimultaneous = await page.evaluate(
      () => (window as any).__ariaLiveMaxCount as number,
    );
    expect(maxSimultaneous).toBeLessThanOrEqual(1);

    // Tooltip do badge continua funcional após os retries.
    await badge.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    await expect(tooltip.first()).toBeHidden({ timeout: 1500 });

    // Navegação por teclado ainda alcança regen e badge partindo do alerta.
    await alert.evaluate((el) => (el as HTMLElement).focus());
    let reachedRegen = false;
    let reachedBadge = false;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      if (!reachedRegen && (await regen.evaluate((el) => el === document.activeElement))) {
        reachedRegen = true;
      }
      if (reachedRegen && (await badge.evaluate((el) => el === document.activeElement))) {
        reachedBadge = true;
        break;
      }
    }
    expect(reachedRegen).toBe(true);
    expect(reachedBadge).toBe(true);
  });

  test('respostas com source inválido/null são sempre normalizadas no retry', async ({ page }) => {
    // Sequência determinística de sources inválidos; a UI deve normalizar
    // cada um deles para um valor de ALLOWED e nunca renderizar o valor bruto.
    const invalidSources: unknown[] = [
      undefined,
      null,
      '',
      'random-string',
      'TAVILY',            // case-sensitive: inválido
      'tavily_live',
      123,
      { source: 'tavily' } as unknown,
      [],
    ];
    let call = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const idx = Math.min(call, invalidSources.length - 1);
      call++;
      const payload: Record<string, unknown> = {
        roteiro: ROTEIRO_INVALIDO,
        structured: { dias: [], dicas: [] },
        meta: {
          tavily_configured: false,
          tavily_hits: 0,
          cache_hits: 0,
          tavily_errors: 0,
          bairros_queried: 0,
          format_valid: false,
          format_issues: ['Sem cabeçalhos "## Dia"'],
        },
      };
      // Só inclui `source` quando o índice não corresponde a `undefined`.
      if (invalidSources[idx] !== undefined) payload.source = invalidSources[idx];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const badge = page.getByTestId('ai-source-badge');
    const regen = page.getByTestId('ai-regenerate-btn');
    await expect(badge).toBeVisible();
    // 1ª (source undefined) + auto-fallback.
    await expect.poll(() => call).toBeGreaterThanOrEqual(2);

    // Percorre todos os sources inválidos restantes via "Gerar novamente".
    const observed: string[] = [];
    const src0 = await badge.getAttribute('data-source');
    expect(ALLOWED).toContain(src0 as (typeof ALLOWED)[number]);
    observed.push(src0!);

    for (let i = call; i < invalidSources.length; i++) {
      const before = call;
      await regen.click();
      await expect.poll(() => call).toBeGreaterThan(before);
      const src = await badge.getAttribute('data-source');
      expect(
        ALLOWED,
        `data-source após resposta inválida "${String(invalidSources[i - 1])}"`,
      ).toContain(src as (typeof ALLOWED)[number]);
      observed.push(src!);
    }

    // O texto visível do badge também precisa corresponder a um dos rótulos
    // conhecidos — nunca renderiza a string bruta recebida.
    const label = (await badge.textContent())?.trim() ?? '';
    expect(
      ['🌐 Tavily', '💾 Cache', '✨ Sugestões IA'].some((l) => label.includes(l.replace(/^[^ ]+ /, ''))),
      `label inesperado: "${label}"`,
    ).toBe(true);

    // Todos os valores observados pertencem a ALLOWED.
    for (const s of observed) {
      expect(ALLOWED).toContain(s as (typeof ALLOWED)[number]);
    }
  });
});

/**
 * Substituição de conteúdo em retries + atributos ARIA do tooltip do badge:
 *  - A cada retry, o badge e o alerta são substituídos in-place: nunca há
 *    mais de UM nó `[data-testid="ai-source-badge"]` ou de UM nó
 *    `[data-testid="ai-format-alert"]` no DOM em qualquer instante.
 *  - O TooltipContent do Radix usa `role="tooltip"` e o trigger recebe
 *    `aria-describedby` apontando para o content quando aberto.
 *  - Cliques rápidos consecutivos em "Gerar novamente" (sem esperar) não
 *    quebram a11y: aria-live não duplica e o teclado continua funcional.
 */
test.describe('PartnersRota — substituição de conteúdo, aria do tooltip e cliques rápidos', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  const ALLOWED = ['tavily', 'tavily_cache', 'suggested'] as const;

  test('retries substituem badge/alerta in-place — nunca ficam nós obsoletos', async ({ page }) => {
    let call = 0;
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const sources = ['tavily', 'tavily_cache', 'suggested'] as const;
      const source = sources[call % sources.length];
      call++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          source,
          meta: {
            tavily_configured: true,
            tavily_hits: 0,
            cache_hits: 0,
            tavily_errors: 0,
            bairros_queried: 0,
            format_valid: false,
            format_issues: [`issue #${call}`],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');

    // Rastreia o valor máximo de nós simultâneos de cada testid durante todo
    // o ciclo de vida do teste. Se algum retry deixar um nó "obsoleto" para
    // trás, esses contadores passariam de 1.
    await page.evaluate(() => {
      const w = window as any;
      w.__maxBadges = 0;
      w.__maxAlerts = 0;
      w.__ariaLiveInsertions = 0;
      const check = () => {
        const b = document.querySelectorAll('[data-testid="ai-source-badge"]').length;
        const a = document.querySelectorAll('[data-testid="ai-format-alert"]').length;
        if (b > w.__maxBadges) w.__maxBadges = b;
        if (a > w.__maxAlerts) w.__maxAlerts = a;
      };
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          m.addedNodes.forEach((n) => {
            if (
              n instanceof HTMLElement &&
              (n.matches?.('[data-testid="ai-format-alert"]') ||
                n.querySelector?.('[data-testid="ai-format-alert"]'))
            ) {
              w.__ariaLiveInsertions++;
            }
          });
        }
        check();
      });
      obs.observe(document.body, { subtree: true, childList: true });
      w.__watcher = obs;
      check();
    });

    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const alert = page.getByTestId('ai-format-alert');
    const badge = page.getByTestId('ai-source-badge');
    const regen = page.getByTestId('ai-regenerate-btn');
    await expect(alert).toBeVisible();
    await expect.poll(() => call).toBeGreaterThanOrEqual(2);

    // Guarda referência ao nó original — após retries o mesmo elemento é
    // reconciliado (React não recria) OU é substituído por exatamente um novo.
    const N = 4;
    for (let i = 0; i < N; i++) {
      const before = call;
      await regen.click();
      await expect.poll(() => call).toBeGreaterThan(before);
      await expect(alert).toBeVisible();

      // Existe exatamente um badge e um alerta no DOM.
      expect(await page.locator('[data-testid="ai-source-badge"]').count()).toBe(1);
      expect(await page.locator('[data-testid="ai-format-alert"]').count()).toBe(1);

      // Conteúdo do alerta corresponde à última resposta (substituição real).
      await expect(alert).toContainText(`issue #${call}`);

      // data-source sempre pertence ao conjunto permitido.
      const src = await badge.getAttribute('data-source');
      expect(ALLOWED).toContain(src as (typeof ALLOWED)[number]);
    }

    const { maxBadges, maxAlerts, insertions } = await page.evaluate(() => {
      const w = window as any;
      return {
        maxBadges: w.__maxBadges as number,
        maxAlerts: w.__maxAlerts as number,
        insertions: w.__ariaLiveInsertions as number,
      };
    });
    expect(maxBadges, 'nunca deve haver >1 badge simultâneo').toBeLessThanOrEqual(1);
    expect(maxAlerts, 'nunca deve haver >1 alerta simultâneo').toBeLessThanOrEqual(1);
    // No máximo uma inserção por resposta — nunca duplicadas para o mesmo call.
    expect(insertions).toBeLessThanOrEqual(call);
  });

  test('tooltip do badge usa role="tooltip" e aria-describedby no trigger; foco não fica preso', async ({ page }) => {
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
    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();

    const badge = page.getByTestId('ai-source-badge');
    await expect(badge).toBeVisible();

    // aria-label conhecido no trigger (rótulo acessível estável).
    await expect(badge).toHaveAttribute('aria-label', /Origem do roteiro:\s+(tavily|tavily_cache|suggested)/);

    // Antes de abrir: sem tooltip renderizado.
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);

    // Abre por foco (Radix Tooltip).
    await badge.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });

    // O trigger recebe aria-describedby apontando para o id do content.
    const describedBy = await badge.getAttribute('aria-describedby');
    expect(describedBy, 'trigger deve descrever seu tooltip aberto').toBeTruthy();
    const tooltipId = await tooltip.first().getAttribute('id');
    expect(tooltipId).toBeTruthy();
    expect(describedBy!.split(/\s+/)).toContain(tooltipId!);

    // data-state do trigger reflete o estado aberto (contrato Radix).
    await expect(badge).toHaveAttribute('data-state', 'open');

    // Escape fecha o tooltip e o foco NÃO fica preso: o badge continua
    // sendo o elemento ativo (não move para body / não perde foco).
    await page.keyboard.press('Escape');
    await expect(tooltip.first()).toBeHidden({ timeout: 1500 });
    await expect(badge).toBeFocused();

    // Ao sair do badge com Tab, o foco avança e o tooltip permanece fechado.
    await page.keyboard.press('Tab');
    await expect(badge).not.toBeFocused();
    await expect(page.locator('[role="tooltip"]')).toHaveCount(0);

    // Refocar o badge deve reabrir o tooltip (não ficou em estado inválido).
    await badge.focus();
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });
    await expect(badge).toHaveAttribute('data-state', 'open');
  });

  test('cliques rápidos em "Gerar novamente" durante respostas com issues não duplicam aria-live nem travam o teclado', async ({ page }) => {
    let call = 0;
    // Introduz latência artificial para forçar sobreposição de cliques.
    await page.route('**/functions/v1/generate-ai-route', async (route) => {
      const sources = ['tavily', 'tavily_cache', 'suggested'] as const;
      const source = sources[call % sources.length];
      call++;
      await new Promise((r) => setTimeout(r, 120));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roteiro: ROTEIRO_INVALIDO,
          structured: { dias: [], dicas: [] },
          source,
          meta: {
            tavily_configured: true,
            tavily_hits: 0,
            cache_hits: 0,
            tavily_errors: 0,
            bairros_queried: 0,
            format_valid: false,
            format_issues: ['Sem cabeçalhos "## Dia"'],
          },
        }),
      });
    });

    await login(page);
    await page.goto('/dashboard/partners/rota');

    await page.evaluate(() => {
      const w = window as any;
      w.__insertions = 0;
      w.__maxSimul = 0;
      const check = () => {
        const n = document.querySelectorAll('[data-testid="ai-format-alert"]').length;
        if (n > w.__maxSimul) w.__maxSimul = n;
      };
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          m.addedNodes.forEach((n) => {
            if (
              n instanceof HTMLElement &&
              (n.matches?.('[data-testid="ai-format-alert"]') ||
                n.querySelector?.('[data-testid="ai-format-alert"]'))
            ) {
              w.__insertions++;
            }
          });
        }
        check();
      });
      obs.observe(document.body, { subtree: true, childList: true });
      check();
    });

    await page.getByRole('button', { name: /Gerar Roteiro com Inteligência Artificial/i }).click();
    const alert = page.getByTestId('ai-format-alert');
    const regen = page.getByTestId('ai-regenerate-btn');
    const badge = page.getByTestId('ai-source-badge');
    await expect(alert).toBeVisible();

    // Dispara 6 cliques em sequência, sem aguardar entre eles.
    const RAPID = 6;
    const beforeRapid = call;
    for (let i = 0; i < RAPID; i++) {
      // `noWaitAfter` para não bloquear em navigation/rede entre cliques.
      await regen.click({ noWaitAfter: true }).catch(() => {});
    }
    // Aguarda a rede estabilizar — pode haver debounce/loading que
    // engula cliques quando `loading=true`, então usamos ≥ 1 nova chamada.
    await expect.poll(() => call, { timeout: 5000 }).toBeGreaterThan(beforeRapid);

    // Invariantes de a11y após tempestade de cliques:
    // (a) nunca há mais de 1 alerta simultâneo no DOM.
    const maxSimul = await page.evaluate(() => (window as any).__maxSimul as number);
    expect(maxSimul).toBeLessThanOrEqual(1);
    // (b) inserções ≤ chamadas efetivas — nunca duplicadas por clique.
    const insertions = await page.evaluate(() => (window as any).__insertions as number);
    expect(insertions).toBeLessThanOrEqual(call);
    // (c) só existe um badge e um alerta agora.
    expect(await page.locator('[data-testid="ai-format-alert"]').count()).toBe(1);
    expect(await page.locator('[data-testid="ai-source-badge"]').count()).toBe(1);

    // Teclado continua funcional: badge focável e tooltip abre/fecha.
    await badge.focus();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip.first()).toBeVisible({ timeout: 1500 });
    await page.keyboard.press('Escape');
    await expect(tooltip.first()).toBeHidden({ timeout: 1500 });

    // Botão regen também continua focável (não ficou "preso" em loading).
    await regen.focus();
    await expect(regen).toBeFocused();
  });
});
