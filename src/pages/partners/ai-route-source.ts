/**
 * Contrato de `source` retornado pelo endpoint `generate-ai-route`.
 *
 * O backend pode, em cenários degradados (payload malformado, resposta
 * mockada em testes, camada intermediária que remove campos), devolver
 * `source` ausente, `null`, uma string desconhecida ou outro tipo. A UI
 * do `PartnersRota` — em especial o badge de origem — precisa sempre
 * exibir um dos três valores válidos e nunca renderizar "unknown" ou
 * um badge quebrado.
 *
 * `normalizeAiSource` centraliza a política de fallback:
 *  1. Se `raw` já for um dos valores permitidos, usa esse valor.
 *  2. Senão, preserva `fallback` (última origem válida conhecida) para
 *     manter o badge consistente durante um retry.
 *  3. Senão, retorna `'suggested'` — o modo mais defensivo, indicando
 *     que não há garantia de dados externos.
 */
export const ALLOWED_AI_SOURCES = ['tavily', 'tavily_cache', 'suggested'] as const;
export type AiSource = (typeof ALLOWED_AI_SOURCES)[number];

export function isAiSource(v: unknown): v is AiSource {
  return typeof v === 'string' && (ALLOWED_AI_SOURCES as readonly string[]).includes(v);
}

/**
 * Coerce loose string variants ("  Tavily ", "TAVILY_CACHE", "Suggested\n")
 * back into the canonical lowercase form. Non-strings and strings whose
 * trimmed/lowercased form is not in the allowed set return `null`, so the
 * regular fallback chain in `normalizeAiSource` kicks in.
 */
export function coerceAiSource(v: unknown): AiSource | null {
  if (typeof v !== 'string') return null;
  const canon = v.trim().toLowerCase();
  return (ALLOWED_AI_SOURCES as readonly string[]).includes(canon)
    ? (canon as AiSource)
    : null;
}

export function normalizeAiSource(raw: unknown, fallback?: AiSource | null): AiSource {
  if (isAiSource(raw)) return raw;
  const coerced = coerceAiSource(raw);
  if (coerced) return coerced;
  if (isAiSource(fallback)) return fallback;
  const coercedFallback = coerceAiSource(fallback);
  if (coercedFallback) return coercedFallback;
  return 'suggested';
}