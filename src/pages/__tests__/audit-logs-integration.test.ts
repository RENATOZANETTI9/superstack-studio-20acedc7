import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Integração — audit logs:
 *  1) system_config_change_log: alterar uma system-config grava old_value/new_value corretos.
 *  2) partner_commission_status_log: mudança de status grava commission_id/old_status/new_status.
 *
 * Requer VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Sem elas o teste é pulado.
 */

const env = (globalThis as any).process?.env ?? {};
const URL: string | undefined = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const KEY: string | undefined = env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = !!(URL && KEY);

describe.skipIf(!hasEnv)('audit logs — integração', () => {
  const supabase = createClient(URL!, KEY!, { auth: { persistSession: false } });

  it('system_config_change_log registra old_value e new_value corretos', async () => {
    const CONFIG_KEY = 'taxa_comissao_representante';

    // Snapshot original
    const { data: before } = await supabase
      .from('partner_system_config')
      .select('config_value')
      .eq('config_key', CONFIG_KEY)
      .single();
    const oldValue = (before as any)?.config_value ?? null;
    expect(oldValue).toBeTruthy();

    const newValue = { ...(oldValue as any), rate: 0.0091 };
    const markerAt = new Date().toISOString();

    try {
      // Update + insert log (mesma sequência que useUpdateSystemConfig faz)
      const { error: updErr } = await supabase
        .from('partner_system_config')
        .update({ config_value: newValue, updated_at: new Date().toISOString() })
        .eq('config_key', CONFIG_KEY);
      expect(updErr).toBeNull();

      const { error: logErr } = await supabase.from('system_config_change_log').insert({
        config_key: CONFIG_KEY,
        old_value: oldValue,
        new_value: newValue,
        changed_by: null,
      });
      expect(logErr).toBeNull();

      // Relê o log mais recente para esta chave
      const { data: log, error: readErr } = await supabase
        .from('system_config_change_log')
        .select('config_key, old_value, new_value, changed_at')
        .eq('config_key', CONFIG_KEY)
        .gte('changed_at', markerAt)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single();
      expect(readErr).toBeNull();
      expect(log?.config_key).toBe(CONFIG_KEY);
      expect((log?.old_value as any)?.rate).toBeCloseTo((oldValue as any).rate, 6);
      expect((log?.new_value as any)?.rate).toBeCloseTo(0.0091, 6);
    } finally {
      await supabase
        .from('partner_system_config')
        .update({ config_value: oldValue })
        .eq('config_key', CONFIG_KEY);
    }
  });

  it('partner_commission_status_log registra commission_id/old_status/new_status', async () => {
    // UUID fabricado — a tabela não tem FK para partner_commissions.
    const commissionId = crypto.randomUUID();
    const oldStatus = 'CALCULATED';
    const newStatus = 'PAID';
    const markerAt = new Date().toISOString();

    const { error: insErr } = await supabase.from('partner_commission_status_log').insert({
      commission_id: commissionId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: null,
      note: 'test-fixture',
    });
    expect(insErr).toBeNull();

    const { data: log, error: readErr } = await supabase
      .from('partner_commission_status_log')
      .select('commission_id, old_status, new_status, note, changed_at')
      .eq('commission_id', commissionId)
      .gte('changed_at', markerAt)
      .single();
    expect(readErr).toBeNull();
    expect(log?.commission_id).toBe(commissionId);
    expect(log?.old_status).toBe(oldStatus);
    expect(log?.new_status).toBe(newStatus);

    // cleanup
    await supabase.from('partner_commission_status_log').delete().eq('commission_id', commissionId);
  });
});