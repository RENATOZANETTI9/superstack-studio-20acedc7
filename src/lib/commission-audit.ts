import { supabase } from '@/integrations/supabase/client';

/**
 * Registra mudança de status de uma comissão em `partner_commission_status_log`.
 * Silencioso em caso de erro — audit log nunca bloqueia o fluxo do usuário.
 */
export async function logCommissionStatusChange(params: {
  commissionId: string;
  oldStatus: string | null;
  newStatus: string;
  note?: string | null;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id ?? null;
    await supabase.from('partner_commission_status_log').insert({
      commission_id: params.commissionId,
      old_status: params.oldStatus,
      new_status: params.newStatus,
      changed_by: uid,
      note: params.note ?? null,
    });
  } catch (e) {
    console.warn('[audit] falha ao registrar partner_commission_status_log', e);
  }
}