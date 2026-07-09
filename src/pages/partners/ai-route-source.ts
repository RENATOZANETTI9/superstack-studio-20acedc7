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

export function normalizeAiSource(raw: unknown, fallback?: AiSource | null): AiSource {
  if (isAiSource(raw)) return raw;
  if (isAiSource(fallback)) return fallback;
  return 'suggested';
}