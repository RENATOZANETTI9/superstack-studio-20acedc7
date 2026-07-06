import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-setup-token',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

type Rep = {
  email: string;
  password: string;
  legal_name: string;
  document_number: string;
  phone: string;
  region_state: string;
  region_city: string;
  current_level: 'BRONZE' | 'PRATA' | 'OURO' | 'ELITE';
  seh: number;
  idr: number;
  monthly_sims: number;
  clinics: { name: string; ext: string; qualified: boolean; consultations: number; approvals: number; paid: number }[];
  portfolio: { nome: string; tipo: 'Clínica' | 'Hospital' | 'Consultório'; bairro: string; cidade: string; telefone: string; responsavel: string; status: 'Lead' | 'Ativo' | 'Inativo' }[];
  monthly_volume: number; // avg net paid amount for commission months
};

const REPS: Rep[] = [
  {
    email: 'joao.cardoso@demo.helpude.com',
    password: 'Demo@12345',
    legal_name: 'João Felipe Cardoso',
    document_number: '10111213141',
    phone: '(31) 99811-0001',
    region_state: 'MG',
    region_city: 'Belo Horizonte',
    current_level: 'OURO',
    seh: 82,
    idr: 71,
    monthly_sims: 45,
    clinics: [
      { name: 'Clínica Savassi Saúde', ext: 'clin-bh-savassi', qualified: true, consultations: 48, approvals: 22, paid: 15 },
      { name: 'Clínica Lourdes Vida', ext: 'clin-bh-lourdes', qualified: true, consultations: 40, approvals: 18, paid: 12 },
      { name: 'Clínica Buritis Bem-Estar', ext: 'clin-bh-buritis', qualified: true, consultations: 35, approvals: 14, paid: 9 },
      { name: 'Clínica Pampulha Care', ext: 'clin-bh-pampulha', qualified: false, consultations: 22, approvals: 6, paid: 3 },
    ],
    portfolio: [
      { nome: 'OdontoCentro Savassi', tipo: 'Clínica', bairro: 'Savassi', cidade: 'Belo Horizonte', telefone: '(31) 3222-1010', responsavel: 'Dra. Renata Alves', status: 'Lead' },
      { nome: 'Consultório Buritis Estética', tipo: 'Consultório', bairro: 'Buritis', cidade: 'Belo Horizonte', telefone: '(31) 3555-2020', responsavel: 'Dr. Paulo Menezes', status: 'Lead' },
      { nome: 'Hospital Belvedere', tipo: 'Hospital', bairro: 'Belvedere', cidade: 'Belo Horizonte', telefone: '(31) 3888-3030', responsavel: 'Sra. Camila Torres', status: 'Lead' },
    ],
    monthly_volume: 62000,
  },
  {
    email: 'ana.ferreira@demo.helpude.com',
    password: 'Demo@12345',
    legal_name: 'Ana Paula Ferreira',
    document_number: '20212223242',
    phone: '(11) 99722-0002',
    region_state: 'SP',
    region_city: 'São Paulo',
    current_level: 'PRATA',
    seh: 70,
    idr: 58,
    monthly_sims: 28,
    clinics: [
      { name: 'Clínica Pinheiros Saúde', ext: 'clin-sp-pinheiros', qualified: true, consultations: 30, approvals: 12, paid: 8 },
      { name: 'Clínica Vila Mariana Vida', ext: 'clin-sp-vilamariana', qualified: true, consultations: 26, approvals: 10, paid: 6 },
      { name: 'Clínica Moema Care', ext: 'clin-sp-moema', qualified: false, consultations: 18, approvals: 5, paid: 3 },
    ],
    portfolio: [
      { nome: 'Consultório Jardins Estética', tipo: 'Consultório', bairro: 'Jardins', cidade: 'São Paulo', telefone: '(11) 3888-4040', responsavel: 'Dra. Beatriz Nunes', status: 'Lead' },
      { nome: 'Clínica Itaim Saúde', tipo: 'Clínica', bairro: 'Itaim Bibi', cidade: 'São Paulo', telefone: '(11) 3777-5050', responsavel: 'Dr. Rafael Lima', status: 'Lead' },
    ],
    monthly_volume: 38000,
  },
  {
    email: 'marcos.rocha@demo.helpude.com',
    password: 'Demo@12345',
    legal_name: 'Marcos Vinícius Rocha',
    document_number: '30313233343',
    phone: '(21) 99633-0003',
    region_state: 'RJ',
    region_city: 'Rio de Janeiro',
    current_level: 'BRONZE',
    seh: 58,
    idr: 45,
    monthly_sims: 18,
    clinics: [
      { name: 'Clínica Ipanema Saúde', ext: 'clin-rj-ipanema', qualified: true, consultations: 20, approvals: 7, paid: 4 },
      { name: 'Clínica Botafogo Vida', ext: 'clin-rj-botafogo', qualified: false, consultations: 15, approvals: 4, paid: 2 },
      { name: 'Clínica Barra Care', ext: 'clin-rj-barra', qualified: false, consultations: 12, approvals: 3, paid: 1 },
    ],
    portfolio: [
      { nome: 'Consultório Leblon Estética', tipo: 'Consultório', bairro: 'Leblon', cidade: 'Rio de Janeiro', telefone: '(21) 3333-6060', responsavel: 'Dra. Fernanda Souza', status: 'Lead' },
      { nome: 'Clínica Copacabana Bem-Estar', tipo: 'Clínica', bairro: 'Copacabana', cidade: 'Rio de Janeiro', telefone: '(21) 3222-7070', responsavel: 'Dr. Bruno Carvalho', status: 'Lead' },
    ],
    monthly_volume: 22000,
  },
];

const MONTHS = ['2026-05', '2026-06', '2026-07'];
const RATE = 0.008; // 0.80%

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const setupToken = req.headers.get('X-Setup-Token') ?? req.headers.get('x-setup-token');
  const expected = Deno.env.get('SETUP_TOKEN');
  if (!expected || setupToken !== expected) return json({ error: 'invalid setup token' }, 403);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const results: any[] = [];

  for (const rep of REPS) {
    // 1. Auth user (create or reuse)
    let userId: string;
    const created = await admin.auth.admin.createUser({ email: rep.email, password: rep.password, email_confirm: true });
    if (created.error) {
      const list = await admin.auth.admin.listUsers();
      const existing = list.data.users.find((u) => u.email === rep.email);
      if (!existing) { results.push({ email: rep.email, error: created.error.message }); continue; }
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password: rep.password });
    } else {
      userId = created.data.user!.id;
    }

    // 2. profile
    await admin.from('profiles').upsert({ user_id: userId, email: rep.email }, { onConflict: 'user_id' });

    // 3. role = representante
    await admin.from('user_roles').delete().eq('user_id', userId);
    const roleRes = await admin.from('user_roles').insert({ user_id: userId, role: 'representante' as any });
    if (roleRes.error) { results.push({ email: rep.email, error: 'role: ' + roleRes.error.message }); continue; }

    // 4. partners
    const partnerPayload = {
      user_id: userId,
      legal_name: rep.legal_name,
      document_number: rep.document_number,
      email: rep.email,
      phone: rep.phone,
      type: 'PARTNER',
      person_type: 'CPF',
      status: 'ACTIVE',
      current_level: rep.current_level,
      region_state: rep.region_state,
      region_city: rep.region_city,
      years_in_health_market: 4,
      monthly_relationship_clinics: rep.clinics.length,
      seh_score: rep.seh,
      idr_score: rep.idr,
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
      if (p.error) { results.push({ email: rep.email, error: 'partner: ' + p.error.message }); continue; }
      partnerId = p.data.id;
    }

    // Wipe previous demo data
    await admin.from('partner_clinic_relations').delete().eq('partner_id', partnerId);
    await admin.from('partner_commissions').delete().eq('partner_id', partnerId);
    await admin.from('portfolio_clinics').delete().eq('partner_id', partnerId);

    // 5. partner_clinic_relations
    await admin.from('partner_clinic_relations').insert(
      rep.clinics.map((c) => ({
        partner_id: partnerId,
        clinic_name: c.name,
        clinic_external_id: c.ext,
        is_active: true,
        is_qualified: c.qualified,
        qualified_at: c.qualified ? new Date().toISOString() : null,
        consultations_count: c.consultations,
        approvals_count: c.approvals,
        paid_count: c.paid,
      }))
    );

    // 6. portfolio_clinics
    await admin.from('portfolio_clinics').insert(
      rep.portfolio.map((c) => ({ ...c, partner_id: partnerId }))
    );

    // 7. partner_commissions (3 months, DIRECT)
    const commissions = MONTHS.map((m, i) => {
      const volume = rep.monthly_volume * (0.9 + i * 0.1);
      const paid = i < 2;
      return {
        partner_id: partnerId,
        beneficiary_partner_id: partnerId,
        commission_type: 'DIRECT',
        source_paid_contract_id: `demo-${partnerId.slice(0, 8)}-${m}`,
        clinic_external_id: rep.clinics[0].ext,
        net_paid_amount: volume,
        commission_rate: RATE,
        commission_amount: Number((volume * RATE).toFixed(2)),
        reference_month: m,
        status: paid ? 'PAID' : 'CALCULATED',
        paid_at: paid ? new Date().toISOString() : null,
      };
    });
    await admin.from('partner_commissions').insert(commissions);

    results.push({
      email: rep.email,
      user_id: userId,
      partner_id: partnerId,
      legal_name: rep.legal_name,
      city: `${rep.region_city}/${rep.region_state}`,
      clinics: rep.clinics.length,
      portfolio: rep.portfolio.length,
      commissions: commissions.length,
    });
  }

  return json({ ok: true, results });
});