import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import {
  AI_ROUTE_TITLE_ID,
  AI_FORMAT_ALERT_ID,
} from '@/pages/partners/ai-route-alert-ids';

/**
 * Integração ARIA — o alerta de `format_issues` deve permanecer conectado ao
 * título "Roteiro Gerado pela IA" via `aria-describedby` ↔ `aria-labelledby`,
 * usando IDs estáveis (não recriados) mesmo quando o conteúdo (mensagens,
 * source) muda entre renderizações. Este é o contrato consumido pelos testes
 * E2E e pela navegação por teclado / leitores de tela.
 */

function AlertHarness({ issues }: { issues: string[] }) {
  const [source, setSource] = useState<'tavily' | 'tavily_cache' | 'suggested'>('tavily');
  const [extra, setExtra] = useState<string[]>([]);
  const msgs = [...issues, ...extra];
  const hasIssues = msgs.length > 0;
  return (
    <div>
      <h2
        id={AI_ROUTE_TITLE_ID}
        aria-describedby={hasIssues ? AI_FORMAT_ALERT_ID : undefined}
      >
        Roteiro Gerado pela IA
        <span data-testid="ai-source-badge" data-source={source}>
          {source}
        </span>
      </h2>
      {hasIssues && (
        <div
          id={AI_FORMAT_ALERT_ID}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          aria-labelledby={AI_ROUTE_TITLE_ID}
          tabIndex={-1}
          data-testid="ai-format-alert"
        >
          <ul>
            {msgs.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <button
            data-testid="mutate-content"
            onClick={() => {
              setExtra((cur) => [...cur, `extra ${cur.length}`]);
              setSource((s) => (s === 'tavily' ? 'tavily_cache' : 'suggested'));
            }}
          >
            Mudar conteúdo
          </button>
        </div>
      )}
    </div>
  );
}

describe('AI route format-alert ARIA contract', () => {
  afterEach(() => cleanup());

  it('title.aria-describedby === alert.id and alert.aria-labelledby === title.id', () => {
    const { container } = render(<AlertHarness issues={['Sem cabeçalhos "## Dia"']} />);

    const title = container.querySelector(`#${AI_ROUTE_TITLE_ID}`) as HTMLElement;
    const alert = screen.getByTestId('ai-format-alert');

    expect(title).toBeTruthy();
    expect(title.getAttribute('aria-describedby')).toBe(AI_FORMAT_ALERT_ID);
    expect(alert.getAttribute('id')).toBe(AI_FORMAT_ALERT_ID);
    expect(alert.getAttribute('aria-labelledby')).toBe(AI_ROUTE_TITLE_ID);
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.getAttribute('aria-live')).toBe('polite');
  });

  it('id and aria-labelledby stay identical when issues/source content changes', async () => {
    const { getByTestId, container } = render(
      <AlertHarness issues={['Sem cabeçalhos "## Dia"', 'Sem itens numerados "1."']} />,
    );

    const alertBefore = getByTestId('ai-format-alert');
    const idBefore = alertBefore.getAttribute('id');
    const labelBefore = alertBefore.getAttribute('aria-labelledby');

    // Mutate content — same DOM element (React reconciles), attributes must not drift.
    fireEvent.click(getByTestId('mutate-content'));
    fireEvent.click(getByTestId('mutate-content'));

    const alertAfter = getByTestId('ai-format-alert');
    expect(alertAfter).toBe(alertBefore);
    expect(alertAfter.getAttribute('id')).toBe(idBefore);
    expect(alertAfter.getAttribute('id')).toBe(AI_FORMAT_ALERT_ID);
    expect(alertAfter.getAttribute('aria-labelledby')).toBe(labelBefore);
    expect(alertAfter.getAttribute('aria-labelledby')).toBe(AI_ROUTE_TITLE_ID);

    // Title still points at the same alert id.
    const title = container.querySelector(`#${AI_ROUTE_TITLE_ID}`) as HTMLElement;
    expect(title.getAttribute('aria-describedby')).toBe(AI_FORMAT_ALERT_ID);

    // The list content actually changed, proving we mutated something.
    const items = alertAfter.querySelectorAll('li');
    expect(items.length).toBeGreaterThan(2);
  });

  it('aria-describedby is removed when there are no more issues (alert unmounted)', () => {
    const { rerender, container } = render(<AlertHarness issues={['x']} />);
    const title = () => container.querySelector(`#${AI_ROUTE_TITLE_ID}`) as HTMLElement;
    expect(title().getAttribute('aria-describedby')).toBe(AI_FORMAT_ALERT_ID);

    rerender(<AlertHarness issues={[]} />);
    expect(container.querySelector('[data-testid="ai-format-alert"]')).toBeNull();
    expect(title().getAttribute('aria-describedby')).toBeNull();
  });
});