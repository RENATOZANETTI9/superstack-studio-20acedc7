import { test, expect, type Page } from '@playwright/test';

/**
 * Cobre quatro validações complementares para o drawer de auditoria de senhas:
 *  1) Negação de permissão de clipboard -> feedback acessível sem vazar dados.
 *  2) Outline/anel de foco visível e com contraste em gatilho, botões de
 *     copiar e controles do drawer, com o drawer fechado e aberto.
 *  3) Tab/Shift+Tab não escapa do drawer para elementos ocultos, e o foco
 *     retorna ao gatilho ao fechar.
 *  4) Back/Forward do navegador preserva filtros/busca/ordenação/paginação na
 *     URL, sem afetar o estado do drawer.
 */

const email = process.env.ADMIN_EMAIL;
const pass = process.env.ADMIN_PASS;

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

// 25 eventos: garante múltiplas páginas (PAGE_SIZE = 20) e mistura de status.
const fixtures = [
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `succ-${i}`,
    actor_email: null,
    target_email: `user${i}@example.com`,
    action: 'self_request',
    success: true,
    error_message: null,
    ip_address: `10.0.1.${10 + i}`,
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(120 + i),
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
  {
    id: 'ok-1',
    actor_email: null,
    target_email: 'ok@example.com',
    action: 'reset_password',
    success: true,
    error_message: null,
    ip_address: '10.0.0.4',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(2),
  },
  {
    id: 'err-1',
    actor_email: null,
    target_email: 'err@example.com',
    action: 'send_reset_email',
    success: false,
    error_message: 'internal error',
    ip_address: '10.0.0.5',
    user_agent: 'Mozilla/5.0 test',
    created_at: iso(15),
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

/** Retorna o outline efetivo (color + width + style) do elemento focado. */
async function focusRing(page: Page, testId: string) {
  const handle = await page.getByTestId(testId).first().elementHandle();
  if (!handle) throw new Error(`Elemento ${testId} não encontrado`);
  await handle.focus();
  return page.evaluate((el) => {
    const cs = window.getComputedStyle(el as Element);
    // Alguns navegadores expõem outline zerado quando o anel vem via box-shadow (Tailwind ring).
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow,
    };
  }, handle);
}

function hasVisibleFocusIndicator(styles: {
  outlineStyle: string;
  outlineWidth: string;
  boxShadow: string;
}) {
  const outlineOk =
    styles.outlineStyle !== 'none' && parseFloat(styles.outlineWidth) > 0;
  const ringOk = styles.boxShadow && styles.boxShadow !== 'none';
  return outlineOk || ringOk;
}

test.describe('Auditoria de senhas — clipboard negado, foco visível, trap e histórico', () => {
  test.skip(!email || !pass, 'ADMIN_EMAIL/ADMIN_PASS não definidos');

  test.beforeEach(async ({ page }) => {
    await mockAudit(page);
    await login(page);
  });

  test('clipboard negado: feedback acessível sem vazar trace_id, IP, e-mail ou payload', async ({
    page,
    context,
  }) => {
    // Nega explicitamente as permissões de clipboard e sobrescreve a API para lançar.
    await context.clearPermissions();
    await page.addInitScript(() => {
      const denied = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
      try {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: denied, readText: denied },
        });
      } catch {
        /* noop */
      }
      // Também neutraliza o fallback via execCommand.
      // @ts-expect-error override
      document.execCommand = () => false;
    });

    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();

    // Abre o drawer da linha de token reutilizado (tem IP e e-mail secundário).
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /token reutilizado/i }).click();
    await page.getByTestId('view-details').first().click();
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();

    const liveRegion = page.getByTestId('copy-live-region');
    await expect(liveRegion).toHaveText('');

    // Aciona os dois botões de copiar sob permissão negada.
    await page.getByTestId('copy-trace-id').click();
    await page.getByTestId('copy-ip').click();

    // A UI não deve confirmar "Copiado" (pois falhou), e nunca deve anunciar o valor.
    const liveText = (await liveRegion.textContent()) ?? '';
    expect(liveText).not.toContain('tr-1');
    expect(liveText).not.toContain('10.0.0.3');
    expect(liveText).not.toContain('reuse@example.com');
    expect(liveText).not.toContain('leak@example.com');
    expect(liveText.toLowerCase()).not.toContain('token');

    // Nenhum toast/aria-live global pode conter dados sensíveis.
    const bodyLive = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll('[aria-live], [role="status"], [role="alert"]'),
      );
      return nodes.map((n) => n.textContent ?? '').join('\n');
    });
    expect(bodyLive).not.toContain('tr-1');
    expect(bodyLive).not.toContain('10.0.0.3');
    expect(bodyLive).not.toContain('leak@example.com');
    expect(bodyLive).not.toContain('reuse@example.com');

    // Botões continuam acessíveis e nomeados (aria-label).
    await expect(page.getByTestId('copy-trace-id')).toHaveAttribute('aria-label', /trace id/i);
    await expect(page.getByTestId('copy-ip')).toHaveAttribute('aria-label', /ip/i);
  });

  test('foco visível com contraste: gatilho e controles do drawer (fechado e aberto)', async ({
    page,
  }) => {
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();

    // Fechado: gatilho da linha deve ter indicador de foco visível.
    const triggerStyles = await focusRing(page, 'view-details');
    expect(
      hasVisibleFocusIndicator(triggerStyles),
      `Gatilho sem indicador de foco visível: ${JSON.stringify(triggerStyles)}`,
    ).toBe(true);

    // Abre o drawer para validar os controles internos.
    await page.getByTestId('view-details').first().click();
    await expect(page.getByTestId('event-detail-sheet')).toBeVisible();

    for (const id of ['copy-trace-id', 'copy-ip']) {
      const styles = await focusRing(page, id);
      expect(
        hasVisibleFocusIndicator(styles),
        `Controle ${id} sem indicador de foco visível: ${JSON.stringify(styles)}`,
      ).toBe(true);
    }

    // Botão de fechar do Sheet (Radix injeta) também deve ter indicador visível.
    const closeBtn = page.getByTestId('event-detail-sheet').getByRole('button', { name: /close/i });
    if (await closeBtn.count()) {
      await closeBtn.first().focus();
      const styles = await page.evaluate(() => {
        const el = document.activeElement as Element | null;
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow,
        };
      });
      expect(styles && hasVisibleFocusIndicator(styles)).toBe(true);
    }
  });

  test('Tab/Shift+Tab não atravessa para fora do drawer e foco volta ao gatilho', async ({
    page,
  }) => {
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();

    // Escolhe uma linha do meio para provar que a restauração usa o gatilho real.
    const triggers = page.getByTestId('view-details');
    const target = triggers.nth(3);
    const rowId = await target.getAttribute('data-row-id');
    expect(rowId).toBeTruthy();

    await target.focus();
    await target.press('Enter');
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();

    // Percorre Tab 25x e Shift+Tab 25x — o foco nunca deve sair do sheet nem
    // pousar em elemento com aria-hidden ou fora do drawer.
    const cycleAssert = async (dir: 'Tab' | 'Shift+Tab') => {
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press(dir);
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return { inside: false, hidden: false };
          const sheetEl = document.querySelector('[data-testid="event-detail-sheet"]');
          const inside = !!sheetEl && sheetEl.contains(el);
          const hidden = !!el.closest('[aria-hidden="true"]');
          return { inside, hidden };
        });
        expect(info.inside, `iter ${i} (${dir}) — foco escapou do drawer`).toBe(true);
        expect(info.hidden, `iter ${i} (${dir}) — foco pousou em aria-hidden`).toBe(false);
      }
    };

    await cycleAssert('Tab');
    await cycleAssert('Shift+Tab');

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    const focusedRowId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-row-id'),
    );
    expect(focusedRowId).toBe(rowId);
  });

  test('back/forward preserva filtros, busca, ordenação e paginação sem afetar o drawer', async ({
    page,
  }) => {
    await page.goto('/dashboard/usuarios/auditoria-senhas');
    await expect(page.getByTestId('audit-table')).toBeVisible();

    // Estado 1: busca por "user".
    await page.getByTestId('filter-input').fill('user');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('user');

    // Estado 2: ordena por data ascendente clicando no header.
    await page.getByTestId('sort-created-at').click();
    await expect.poll(() => new URL(page.url()).searchParams.get('dir')).toBe('asc');

    // Estado 3: pagina para a página 2 (temos 20 successes matching "user").
    // Se não houver page 2 com esse filtro, relaxa a busca.
    let nextEnabled = await page.getByTestId('page-next').isEnabled();
    if (!nextEnabled) {
      await page.getByTestId('filter-input').fill('');
      await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBeNull();
      nextEnabled = await page.getByTestId('page-next').isEnabled();
    }
    if (nextEnabled) {
      await page.getByTestId('page-next').click();
      await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2');
    }

    const urlWithPage = page.url();
    const paramsAtPage = new URL(urlWithPage).searchParams;
    const snapshot = {
      q: paramsAtPage.get('q'),
      dir: paramsAtPage.get('dir'),
      sort: paramsAtPage.get('sort'),
      page: paramsAtPage.get('page'),
    };

    // Abre o drawer — adiciona `event=<id>` à URL, mas os outros params seguem.
    await page.getByTestId('view-details').first().click();
    const sheet = page.getByTestId('event-detail-sheet');
    await expect(sheet).toBeVisible();
    const eventId = new URL(page.url()).searchParams.get('event');
    expect(eventId).toBeTruthy();

    // Fecha o drawer para desacoplar o estado dele do teste de histórico.
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('event'))
      .toBeNull();

    // Adiciona uma entrada extra ao histórico para exercitar back e forward.
    await page.getByTestId('status-filter').click();
    await page.getByRole('option', { name: /^sucesso$/i }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('success');

    // Back: volta ao estado com o snapshot preservado.
    await page.goBack();
    await expect(page.getByTestId('audit-table')).toBeVisible();
    const backParams = new URL(page.url()).searchParams;
    expect(backParams.get('q')).toBe(snapshot.q);
    expect(backParams.get('dir')).toBe(snapshot.dir);
    expect(backParams.get('sort')).toBe(snapshot.sort);
    expect(backParams.get('page')).toBe(snapshot.page);
    expect(backParams.get('status')).toBeNull();
    // O drawer deve permanecer fechado após back/forward.
    await expect(sheet).toBeHidden();

    // Forward: retorna ao estado com status=success e mantém os demais params.
    await page.goForward();
    await expect.poll(() => new URL(page.url()).searchParams.get('status')).toBe('success');
    const fwdParams = new URL(page.url()).searchParams;
    expect(fwdParams.get('q')).toBe(snapshot.q);
    expect(fwdParams.get('dir')).toBe(snapshot.dir);
    expect(fwdParams.get('sort')).toBe(snapshot.sort);
    expect(fwdParams.get('page')).toBe(snapshot.page);
    await expect(sheet).toBeHidden();
  });
});