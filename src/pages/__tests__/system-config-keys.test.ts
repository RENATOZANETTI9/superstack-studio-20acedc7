import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (p: string) => readFileSync(resolve(__dirname, '../../..', p), 'utf8');

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
  const src = read('src/pages/admin/AdminParametros.tsx');
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
  const src = read('src/pages/partners/PartnersSimulator.tsx');

  it('assina taxa_bonificacao_direta via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_bonificacao_direta['"]\s*\)/);
  });
  it('assina taxa_bonificacao_rede via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_bonificacao_rede['"]\s*\)/);
  });
  it('assina taxa_comissao_representante via useSystemConfig', () => {
    expect(src).toMatch(/useSystemConfig\(\s*['"]taxa_comissao_representante['"]\s*\)/);
  });

  it('não usa mais SIMULATOR_COMMISSION_RATE no cálculo da projeção', () => {
    // A constante ainda pode existir em partner-rules.ts como referência,
    // mas o simulador não deve consumi-la diretamente.
    expect(src).not.toMatch(/SIMULATOR_COMMISSION_RATE/);
  });

  it('cálculo de directCommission usa rates.direct (fonte: banco)', () => {
    expect(src).toMatch(/directCommission\s*=\s*totalPaidValue\s*\*\s*rates\.direct/);
  });
});

describe('Edge functions de comissão — leem partner_system_config', () => {
  it('compute-commission consulta a categoria COMMISSION_RATES', () => {
    const src = read('supabase/functions/compute-commission/index.ts');
    expect(src).toContain('partner_system_config');
    expect(src).toContain('COMMISSION_RATES');
  });
  it('monthly-commission-job consulta a categoria COMMISSION_RATES', () => {
    const src = read('supabase/functions/monthly-commission-job/index.ts');
    expect(src).toContain('partner_system_config');
    expect(src).toContain('COMMISSION_RATES');
  });
});