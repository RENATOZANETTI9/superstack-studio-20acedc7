import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Teste de integração — grava as 3 taxas via `partner_system_config`
 * e confirma que os valores foram persistidos com números válidos.
 *
 * Requer VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY no ambiente
 * (só roda em CI/local com credenciais). Sem essas variáveis é pulado
 * para não quebrar o build padrão.
 */

const env = (globalThis as any).process?.env ?? {};
const URL: string | undefined = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const KEY: string | undefined = env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = !!(URL && KEY);

const KEYS = ['taxa_bonificacao_direta', 'taxa_bonificacao_rede', 'taxa_comissao_representante'] as const;

describe.skipIf(!hasEnv)('integração: AdminParametros persiste taxas em partner_system_config', () => {
  const supabase = createClient(URL!, KEY!, { auth: { persistSession: false } });

  it('salva e relê valores válidos (0..1) para cada chave canônica', async () => {
    // Snapshot original para restaurar depois
    const { data: original } = await supabase
      .from('partner_system_config')
      .select('config_key, config_value')
      .in('config_key', KEYS as unknown as string[]);
    expect(original?.length).toBe(KEYS.length);

    try {
      for (const key of KEYS) {
        const newVal = { rate: 0.0123 };
        const { error: updErr } = await supabase
          .from('partner_system_config')
          .update({ config_value: newVal, updated_at: new Date().toISOString() })
          .eq('config_key', key);
        expect(updErr, `update ${key}`).toBeNull();

        const { data: row, error: readErr } = await supabase
          .from('partner_system_config')
          .select('config_value')
          .eq('config_key', key)
          .single();
        expect(readErr, `read ${key}`).toBeNull();
        const rate = (row?.config_value as any)?.rate;
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
        expect(rate).toBeCloseTo(0.0123, 6);
      }
    } finally {
      // Restaura valores originais
      for (const row of original ?? []) {
        await supabase
          .from('partner_system_config')
          .update({ config_value: (row as any).config_value })
          .eq('config_key', (row as any).config_key);
      }
    }
  });
});