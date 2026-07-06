import { describe, it, expect } from 'vitest';

/**
 * Static repo scan — impede regressão introduzindo valores hardcoded
 * relacionados às chaves canônicas de `partner_system_config` fora
 * do fluxo `useSystemConfig` / RateCard(configKey=...).
 *
 * Se falhar: alguém reintroduziu um número mágico (ex.: 0.016, 0.002)
 * atrelado a uma taxa que já vive no banco. Migre o consumidor para
 * `useSystemConfig('<chave>')`.
 */

const sources = import.meta.glob(
  ['../../**/*.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

// Arquivos legítimos: definem/ leem/ testam as chaves — não devem ser flagados.
const ALLOWLIST_BASENAMES = new Set([
  'useSystemConfig.ts',
  'AdminParametros.tsx',
  'system-config-keys.test.ts',
  'no-hardcoded-rates.test.ts',
  'AdminParametros.mimo-validation.test.tsx',
  'system-config-integration.test.ts',
  'partner-rules.ts',
]);

const KEYS = [
  'taxa_bonificacao_direta',
  'taxa_bonificacao_rede',
  'taxa_comissao_representante',
  'faixas_mimo_representante',
] as const;

function isAllowed(path: string) {
  const base = path.split('/').pop() ?? path;
  return ALLOWLIST_BASENAMES.has(base);
}

describe('sem taxas hardcoded fora de useSystemConfig', () => {
  for (const key of KEYS) {
    it(`arquivos que referenciam "${key}" só o fazem via useSystemConfig`, () => {
      const offenders: string[] = [];
      for (const [path, src] of Object.entries(sources)) {
        if (isAllowed(path)) continue;
        if (!src.includes(key)) continue;
        // Se o arquivo cita a chave, deve ser SEMPRE dentro de useSystemConfig(...)
        // (ou string literal em RateCard configKey=..., mas RateCard vive no admin allowlisted).
        const usesHook = new RegExp(
          `useSystemConfig(?:Full)?\\(\\s*['"]${key}['"]\\s*\\)`,
        ).test(src);
        if (!usesHook) offenders.push(path);
      }
      expect(offenders, `Uso fora de useSystemConfig:\n${offenders.join('\n')}`).toEqual([]);
    });
  }

  it('PartnersSimulator não carrega taxas via fetch direto ao supabase', () => {
    const entry = Object.entries(sources).find(([k]) =>
      k.includes('partners/PartnersSimulator.tsx'),
    );
    expect(entry).toBeDefined();
    const src = entry![1];
    // Não pode consultar partner_system_config para as chaves de taxa
    for (const key of ['taxa_bonificacao_direta', 'taxa_bonificacao_rede', 'taxa_comissao_representante']) {
      const badPattern = new RegExp(`config_key['"\\s,]+.*${key}`);
      expect(badPattern.test(src), `PartnersSimulator lê "${key}" via supabase.from(...) em vez de useSystemConfig`).toBe(false);
    }
  });
});