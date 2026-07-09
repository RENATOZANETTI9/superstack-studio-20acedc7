import { describe, it, expect } from 'vitest';
import {
  ALLOWED_AI_SOURCES,
  isAiSource,
  normalizeAiSource,
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