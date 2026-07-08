import { test, expect, type BrowserContext, type Page, type Request } from '@playwright/test';

/**
 * Verifies that the "Período calculado (fuso do usuário)" card and the
 * server queries emitted by the Simulador (Real vs. Projetado tab) agree
 * on month and week boundaries across timezones and month/year rollovers.
 *
 * Requires REP_EMAIL / REP_PASS (representante seed). Skips if absent.
 *
 * Strategy:
 *  1. Create a browser context with a specific timezoneId.
 *  2. Freeze the JS clock via page.clock at a chosen instant.
 *  3. Login, navigate to /dashboard/representantes/simulador and open the
 *     "Real vs. Projetado" tab.
 *  4. Capture the outgoing REST calls to /rest/v1/partner_commissions and
 *     extract the reference_month / paid_at.gte parameters.
 *  5. Assert the UI text (mês YYYY-MM, janela YYYY-MM-DD → YYYY-MM-DD)
 *     matches those parameters exactly.
 */

const email = process.env.REP_EMAIL;
const pass = process.env.REP_PASS;

type Sniffed = { referenceMonth?: string; weekStartISO?: string };

function parseCommissionsRequest(req: Request, out: Sniffed) {
  const url = new URL(req.url());
  if (!url.pathname.endsWith('/rest/v1/partner_commissions')) return;
  // reference_month=eq.2027-01
  const refMonth = url.searchParams.get('reference_month');
  if (refMonth?.startsWith('eq.')) out.referenceMonth = refMonth.slice(3);
  // paid_at=gte.2027-01-01T00:00:00.000Z
  const paidAt = url.searchParams.get('paid_at');
  if (paidAt?.startsWith('gte.')) out.weekStartISO = paidAt.slice(4);
}

async function login(page: Page) {
  await page.goto('/auth');
  await page.getByLabel(/e-?mail/i).fill(email!);
  await page.getByLabel(/senha/i).fill(pass!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/\/dashboard/);
}

function expectedWeekStart(nowLocal: Date) {
  const d = new Date(nowLocal);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  return d;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Matrix: timezone × frozen instant. Each row exercises a boundary that
 * naive UTC math would get wrong.
 */
const scenarios: Array<{
  name: string;
  timezoneId: string;
  // The exact wall-clock the browser should see in that timezone.
  freezeLocal: { y: number; mo: number; d: number; h: number; mi: number };
}> = [
  {
    name: 'Kiribati (+14) — Jan 1 00:30 crosses year in UTC',
    timezoneId: 'Pacific/Kiritimati',
    freezeLocal: { y: 2027, mo: 1, d: 1, h: 0, mi: 30 },
  },
  {
    name: 'São Paulo (-03) — Jan 1 00:30 stays in the new month locally',
    timezoneId: 'America/Sao_Paulo',
    freezeLocal: { y: 2027, mo: 1, d: 1, h: 0, mi: 30 },
  },
  {
    name: 'Honolulu (-10) — Jul 31 23:30 stays in July locally',
    timezoneId: 'Pacific/Honolulu',
    freezeLocal: { y: 2027, mo: 7, d: 31, h: 23, mi: 30 },
  },
  {
    name: 'Tokyo (+09) — 3rd of the month, week spans previous month',
    timezoneId: 'Asia/Tokyo',
    freezeLocal: { y: 2027, mo: 3, d: 3, h: 9, mi: 0 },
  },
];

test.describe('Simulador — período (fuso + boundaries)', () => {
  test.skip(!email || !pass, 'REP_EMAIL/REP_PASS não definidos');

  for (const sc of scenarios) {
    test(sc.name, async ({ browser }) => {
      const context: BrowserContext = await browser.newContext({
        timezoneId: sc.timezoneId,
        locale: 'pt-BR',
      });
      const page = await context.newPage();

      // page.clock is Playwright 1.45+; install BEFORE any script runs so
      // `new Date()` in the app returns our frozen instant.
      const iso =
        `${sc.freezeLocal.y}-${String(sc.freezeLocal.mo).padStart(2, '0')}-${String(sc.freezeLocal.d).padStart(2, '0')}` +
        `T${String(sc.freezeLocal.h).padStart(2, '0')}:${String(sc.freezeLocal.mi).padStart(2, '0')}:00`;
      // Interpret the wall-clock in the target timezone: build the UTC
      // instant by asking Intl for the offset at that moment. We approximate
      // by constructing the date as if it were local, then correcting.
      // Since Playwright's clock.install takes an instant, we set it and
      // let the browser render it under sc.timezoneId.
      await page.clock.install({ time: new Date(iso) });

      const sniffed: Sniffed = {};
      page.on('request', (req) => parseCommissionsRequest(req, sniffed));

      await login(page);
      await page.goto('/dashboard/representantes/simulador');
      await page.getByRole('tab', { name: /Real vs\.? Projetado/i }).click();

      // Wait for the boundary card to render with concrete values.
      const card = page.getByText('Período calculado (fuso do usuário)').locator('..').locator('..');
      await expect(card).toBeVisible();

      // The UI computes windows off the frozen `new Date()` in sc.timezoneId.
      // We reproduce the same math here to compare against.
      const nowLocal = new Date(
        sc.freezeLocal.y,
        sc.freezeLocal.mo - 1,
        sc.freezeLocal.d,
        sc.freezeLocal.h,
        sc.freezeLocal.mi,
      );
      const expectedRefMonth = ym(nowLocal);
      const expectedWeekStartKey = ymd(expectedWeekStart(nowLocal));
      const expectedTodayKey = ymd(nowLocal);

      // UI reflects boundaries in the user's timezone.
      await expect(card).toContainText(expectedRefMonth);
      await expect(card).toContainText(`${expectedWeekStartKey} → ${expectedTodayKey}`);
      await expect(card).toContainText(sc.timezoneId);

      // Give the network a beat to flush the parallel queries.
      await page.waitForLoadState('networkidle');

      // Server-side filters must match the UI exactly (no UTC drift).
      expect(sniffed.referenceMonth, 'reference_month enviado ao servidor').toBe(expectedRefMonth);
      expect(sniffed.weekStartISO, 'paid_at.gte enviado ao servidor').toBeTruthy();

      // The ISO sent to the server must round-trip to the same local key.
      const parsedWeekStart = new Date(sniffed.weekStartISO!);
      // Format the ISO instant in the target timezone and read Y-M-D.
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: sc.timezoneId,
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const parts = fmt.formatToParts(parsedWeekStart);
      const y = parts.find(p => p.type === 'year')!.value;
      const m = parts.find(p => p.type === 'month')!.value;
      const d = parts.find(p => p.type === 'day')!.value;
      expect(`${y}-${m}-${d}`).toBe(expectedWeekStartKey);

      await context.close();
    });
  }
});