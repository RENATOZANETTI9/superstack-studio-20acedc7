import { describe, it, expect } from 'vitest';

// Carrega cada arquivo como string via Vite (sem depender de @types/node).
const sources = import.meta.glob(
  [
    '../admin/AdminParametros.tsx',
    '../partners/PartnersSimulator.tsx',
    '../../../supabase/functions/compute-commission/index.ts',
    '../../../supabase/functions/monthly-commission-job/index.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

const bySuffix = (suffix: string): string => {
  const entry = Object.entries(sources).find(([k]) => k.endsWith(suffix));
  if (!entry) throw new Error(`Fonte não encontrada: ${suffix}`);
  return entry[1];
};

/**
 * Guardrail suite — mantém o sistema fiel às chaves canônicas do banco
 * (`partner_system_config`) e impede regressão para valores hardcoded.
 *
 * Se um teste aqui falhar: reintroduziram um número mágico ou a chave
 * do banco foi renomeada sem atualizar os consumidores.
 */

const DB_KEYS = [
  'taxa_bonificacao_direta',
  'taxa_bonificacao_rede',
  'taxa_comissao_representante',
  'faixas_mimo_representante',
] as const;

describe('AdminParametros — expõe todas as chaves canônicas do banco', () => {
  const src = bySuffix('admin/AdminParametros.tsx');
  for (const key of DB_KEYS) {
    it(`referencia a chave "${key}"`, () => {
      expect(src).toContain(key);
    });
  }
  it('faixas_mimo_atendente também é editável', () => {
    expect(src).toContain('faixas_mimo_atendente');
  });
});

describe('PartnersSimulator — lê taxas via useSystemConfig, não hardcoded', () => {
  const src = bySuffix('partners/PartnersSimulator.tsx');

  it('assina taxa_bonificacao_direta via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_bonificacao_direta['"]\s*\)/);
  });
  it('assina taxa_bonificacao_rede via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_bonificacao_rede['"]\s*\)/);
  });
  it('assina taxa_comissao_representante via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_comissao_representante['"]\s*\)/);
  });

  it('não usa a antiga taxa hardcoded 0.0075 no cálculo da projeção', () => {
    expect(src).not.toMatch(/0\.0075/);
    // Só o fallback nomeado é permitido — nada de constante legada.
    expect(src).not.toMatch(/SIMULATOR_COMMISSION_RATE(?!_FALLBACK)/);
  });

  it('cálculo de directCommission usa rates.representante (fonte: taxa_comissao_representante no banco)', () => {
    expect(src).toMatch(/directCommission\s*=\s*totalPaidValue\s*\*\s*rates\.representante/);
  });
});

describe('Edge functions de comissão — leem partner_system_config', () => {
  it('compute-commission consulta a categoria COMMISSION_RATES', () => {
    const src = bySuffix('compute-commission/index.ts');
    expect(src).toContain('partner_system_config');
    expect(src).toContain('COMMISSION_RATES');
  });
  it('monthly-commission-job consulta a categoria COMMISSION_RATES', () => {
    const src = bySuffix('monthly-commission-job/index.ts');
    expect(src).toContain('partner_system_config');
    expect(src).toContain('COMMISSION_RATES');
  });
});