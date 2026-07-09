import { describe, it, expect } from 'vitest';
import {
  ALLOWED_AI_SOURCES,
  isAiSource,
  normalizeAiSource,
  coerceAiSource,
} from '@/pages/partners/ai-route-source';

describe('normalizeAiSource', () => {
  it('accepts each allowed source verbatim', () => {
    for (const s of ALLOWED_AI_SOURCES) {
      expect(normalizeAiSource(s)).toBe(s);
      expect(isAiSource(s)).toBe(true);
    }
  });

  it('falls back to the previous valid source when raw is missing/invalid', () => {
    expect(normalizeAiSource(undefined, 'tavily')).toBe('tavily');
    expect(normalizeAiSource(null, 'tavily_cache')).toBe('tavily_cache');
    expect(normalizeAiSource('unknown', 'tavily')).toBe('tavily');
    expect(normalizeAiSource('', 'suggested')).toBe('suggested');
    expect(normalizeAiSource(42, 'tavily_cache')).toBe('tavily_cache');
    expect(normalizeAiSource({ source: 'tavily' } as unknown, 'tavily')).toBe('tavily');
  });

  it('defaults to "suggested" when neither raw nor fallback are valid', () => {
    expect(normalizeAiSource(undefined)).toBe('suggested');
    expect(normalizeAiSource(undefined, null)).toBe('suggested');
    expect(normalizeAiSource('bogus', 'also-bogus' as unknown as null)).toBe('suggested');
    expect(normalizeAiSource(null, undefined)).toBe('suggested');
  });

  it('never returns a value outside the allowed set', () => {
    const inputs: unknown[] = [undefined, null, '', 'x', 0, false, {}, [], 'tavily_LIVE'];
    for (const i of inputs) {
      const out = normalizeAiSource(i);
      expect(ALLOWED_AI_SOURCES).toContain(out);
    }
  });

  it('isAiSource is a proper type guard', () => {
    expect(isAiSource('tavily')).toBe(true);
    expect(isAiSource('nope')).toBe(false);
    expect(isAiSource(undefined)).toBe(false);
    expect(isAiSource(null)).toBe(false);
  });
});

/**
 * Cobertura exaustiva por categoria de valor bruto: para cada tipo que o
 * backend pode devolver em cenários degradados, `normalizeAiSource` deve
 * SEMPRE retornar exatamente um dos três rótulos permitidos, sem depender
 * de fallback quando este também é inválido.
 */
describe('normalizeAiSource — cobertura exaustiva por tipo', () => {
  const ALLOWED = ALLOWED_AI_SOURCES as readonly string[];

  const buckets: Record<string, unknown[]> = {
    undefined: [undefined],
    null: [null],
    'strings aleatórias': [
      '',
      ' ',
      'x',
      'foo',
      'tavily_live',
      'null',
      'undefined',
      'random-string-🌐',
    ],
    números: [0, 1, -1, 42, NaN, Infinity, -Infinity, 3.14, Number.MAX_SAFE_INTEGER],
    booleanos: [true, false],
    objetos: [
      {},
      { source: 'tavily' },
      { toString: () => 'tavily' },
      new Date(),
      new Map(),
      new Set(),
      Object.create(null),
    ],
    arrays: [[], ['tavily'], ['tavily', 'tavily_cache'], [null], [1, 2, 3]],
    símbolos: [Symbol('tavily')],
    funções: [() => 'tavily', function () { return 'tavily'; }],
  };

  const safe = (v: unknown) => {
    try { return String(v); } catch { return '[unprintable]'; }
  };
  for (const [label, values] of Object.entries(buckets)) {
    it(`retorna sempre um valor permitido para ${label} (sem fallback)`, () => {
      for (const v of values) {
        const out = normalizeAiSource(v);
        expect(ALLOWED, `entrada ${safe(v)}`).toContain(out);
        // Sem fallback válido, o valor default é 'suggested'.
        expect(out).toBe('suggested');
      }
    });

    it(`retorna sempre um valor permitido para ${label} com fallback inválido`, () => {
      for (const v of values) {
        for (const fb of [null, undefined, 'bogus', 42, {}] as unknown[]) {
          const out = normalizeAiSource(v, fb as never);
          expect(ALLOWED, `entrada ${safe(v)} / fb ${safe(fb)}`).toContain(out);
          expect(out).toBe('suggested');
        }
      }
    });

    it(`preserva o fallback válido quando ${label} é inválido`, () => {
      for (const v of values) {
        for (const fb of ALLOWED_AI_SOURCES) {
          const out = normalizeAiSource(v, fb);
          expect(out).toBe(fb);
        }
      }
    });
  }

  it('nunca retorna a string bruta recebida quando ela não pertence ao conjunto', () => {
    const raw = ['tavily_LIVE', 'suggested!', 'cache', 'random-🌐'];
    for (const r of raw) {
      const out = normalizeAiSource(r);
      expect(out).not.toBe(r);
      expect(ALLOWED).toContain(out);
    }
  });

  it('é idempotente: normalizar duas vezes produz o mesmo resultado', () => {
    const inputs: unknown[] = [undefined, null, 'x', 42, {}, [], 'tavily', 'tavily_cache', 'suggested'];
    for (const i of inputs) {
      const once = normalizeAiSource(i);
      const twice = normalizeAiSource(once);
      expect(twice).toBe(once);
      expect(ALLOWED).toContain(twice);
    }
  });
});

/**
 * Whitespace / case coercion: o backend pode responder com variantes
 * cosméticas do mesmo valor ("TAVILY", " tavily_cache ", "Suggested\n").
 * `normalizeAiSource` deve tratar essas variantes como equivalentes ao
 * valor canônico em minúsculas e sem espaços em branco nas bordas.
 */
describe('normalizeAiSource — variantes de espaços em branco e caixa', () => {
  const cases: Array<[unknown, 'tavily' | 'tavily_cache' | 'suggested']> = [
    [' tavily', 'tavily'],
    ['tavily ', 'tavily'],
    [' tavily ', 'tavily'],
    ['\ttavily\n', 'tavily'],
    ['TAVILY', 'tavily'],
    ['Tavily', 'tavily'],
    [' TaViLy ', 'tavily'],
    ['TAVILY_CACHE', 'tavily_cache'],
    ['Tavily_Cache', 'tavily_cache'],
    [' tavily_cache\n', 'tavily_cache'],
    ['SUGGESTED', 'suggested'],
    ['Suggested', 'suggested'],
    ['  suggested  ', 'suggested'],
  ];

  for (const [raw, expected] of cases) {
    it(`coage ${JSON.stringify(raw)} → ${expected}`, () => {
      expect(coerceAiSource(raw)).toBe(expected);
      expect(normalizeAiSource(raw)).toBe(expected);
      // coercion tem prioridade sobre fallback
      expect(normalizeAiSource(raw, 'suggested')).toBe(expected);
    });
  }

  it('coerção não afeta strings genuinamente inválidas', () => {
    for (const bad of ['tavily_live', '  cache  ', 'TAVILY!', 'tavilyX', '']) {
      expect(coerceAiSource(bad)).toBeNull();
      expect(normalizeAiSource(bad)).toBe('suggested');
    }
  });

  it('coerção também se aplica ao fallback quando raw é inválido', () => {
    expect(normalizeAiSource(undefined, ' TAVILY ' as never)).toBe('tavily');
    expect(normalizeAiSource({}, 'Tavily_Cache' as never)).toBe('tavily_cache');
  });

  it('coerceAiSource retorna null para não-strings', () => {
    for (const v of [undefined, null, 0, 1, {}, [], true, false, Symbol('x')]) {
      expect(coerceAiSource(v as unknown)).toBeNull();
    }
  });
});