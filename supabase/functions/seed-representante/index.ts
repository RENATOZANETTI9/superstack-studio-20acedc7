import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-setup-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const setupToken = Deno.env.get('SETUP_TOKEN');
  const provided = req.headers.get('x-setup-token');
  if (!setupToken || provided !== setupToken) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, key);

  const email = 'representante@teste.com';
  const password = 'Rep@12345';

  // Create or reuse auth user
  let userId: string | null = null;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    // If already exists, find via list
    const list = await admin.auth.admin.listUsers();
    const existing = list.data.users.find((u) => u.email === email);
    if (!existing) {
      return new Response(JSON.stringify({ error: created.error.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, { password });
  } else {
    userId = created.data.user!.id;
  }

  // Ensure profile
  await admin.from('profiles').upsert({ user_id: userId, email }, { onConflict: 'user_id' });

  // Ensure role = representante (delete any pre-existing)
  await admin.from('user_roles').delete().eq('user_id', userId);
  const roleRes = await admin.from('user_roles').insert({ user_id: userId, role: 'representante' as any });
  if (roleRes.error) {
    return new Response(JSON.stringify({ error: 'role: ' + roleRes.error.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Create or update partner record for this representative
  const partnerPayload = {
    user_id: userId,
    legal_name: 'João Representante Teste',
    document_number: '12345678900',
    email,
    phone: '(11) 98888-0001',
    type: 'PARTNER',
    person_type: 'PF',
    status: 'ACTIVE',
    current_level: 'PRATA',
    region_state: 'SP',
    region_city: 'São Paulo',
    years_in_health_market: 5,
    monthly_relationship_clinics: 12,
    seh_score: 78,
    idr_score: 62,
    onboarded_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
    categoria: 'REPRESENTANTE',
  };

  const existingPartner = await admin.from('partners').select('id').eq('user_id', userId).maybeSingle();
  let partnerId: string;
  if (existingPartner.data?.id) {
    partnerId = existingPartner.data.id;
    await admin.from('partners').update(partnerPayload).eq('id', partnerId);
  } else {
    const p = await admin.from('partners').insert(partnerPayload).select('id').single();
    if (p.error) {
      return new Response(JSON.stringify({ error: 'partner: ' + p.error.message }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    partnerId = p.data.id;
  }

  // Clear old mock relations / commissions for this partner and reseed
  await admin.from('partner_clinic_relations').delete().eq('partner_id', partnerId);
  await admin.from('partner_commissions').delete().eq('partner_id', partnerId);
  await admin.from('partner_links').delete().eq('partner_id', partnerId);

  const mockClinics = [
    { clinic_name: 'Clínica Vida Plena', clinic_external_id: 'clin-001', is_active: true, is_qualified: true, consultations_count: 42, approvals_count: 18, paid_count: 12 },
    { clinic_name: 'OdontoSorriso',      clinic_external_id: 'clin-002', is_active: true, is_qualified: true, consultations_count: 30, approvals_count: 10, paid_count: 6 },
    { clinic_name: 'Estética Bella',     clinic_external_id: 'clin-003', is_active: true, is_qualified: false, consultations_count: 12, approvals_count: 3, paid_count: 1 },
    { clinic_name: 'Saúde & Bem',        clinic_external_id: 'clin-004', is_active: true, is_qualified: true, consultations_count: 55, approvals_count: 22, paid_count: 15 },
    { clinic_name: 'CardioCenter',       clinic_external_id: 'clin-005', is_active: false, is_qualified: false, consultations_count: 5, approvals_count: 1, paid_count: 0 },
  ];
  await admin.from('partner_clinic_relations').insert(
    mockClinics.map((c) => ({ ...c, partner_id: partnerId, qualified_at: c.is_qualified ? new Date().toISOString() : null }))
  );

  // Commissions
  const months = ['2026-04', '2026-05', '2026-06', '2026-07'];
  const commissions: any[] = [];
  months.forEach((m, i) => {
    const paid = i < 2;
    commissions.push({
      partner_id: partnerId,
      beneficiary_partner_id: partnerId,
      commission_type: 'DIRECT',
      source_paid_contract_id: `contract-${m}-01`,
      clinic_external_id: 'clin-001',
      net_paid_amount: 8000 + i * 1500,
      commission_rate: 0.016,
      commission_amount: (8000 + i * 1500) * 0.016,
      reference_month: m,
      status: paid ? 'PAID' : 'PENDING',
      paid_at: paid ? new Date().toISOString() : null,
    });
  });
  await admin.from('partner_commissions').insert(commissions);

  // Recruitment link
  await admin.from('partner_links').insert({
    partner_id: partnerId,
    link_type: 'CLINIC_REGISTRATION',
    link_code: 'REP-DEMO01',
    link_url: 'https://superstack-studio.lovable.app/cadastroclinica?ref=REP-DEMO01',
    is_active: true,
    uses_count: 4,
  });

  return new Response(
    JSON.stringify({
      ok: true,
      credentials: { email, password },
      partner_id: partnerId,
      user_id: userId,
      seeded: { clinics: mockClinics.length, commissions: commissions.length },
    }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  );
});