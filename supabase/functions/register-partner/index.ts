import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      ref_code,
      email,
      password,
      person_type,
      document_number,
      legal_name,
      phone,
      region_state,
      region_city,
      years_in_health_market,
      monthly_relationship_clinics,
    } = await req.json();

    // Validate required fields
    if (!email || !password || !legal_name || !document_number || !ref_code) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: email, senha, nome, documento e código de referência' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password
    if (password.length < 6 || password.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter entre 6 e 100 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ref_code - find the partner link
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('partner_links')
      .select('id, partner_id, is_active, uses_count, max_uses, expires_at, link_type')
      .eq('link_code', ref_code)
      .eq('link_type', 'PARTNER_INVITATION')
      .single();

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: 'Código de referência inválido ou não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!linkData.is_active) {
      return new Response(
        JSON.stringify({ error: 'Este link de cadastro não está mais ativo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (linkData.max_uses && linkData.uses_count >= linkData.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Este link atingiu o número máximo de usos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Este link de cadastro expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the master partner exists and is active
    const { data: masterPartner, error: masterError } = await supabaseAdmin
      .from('partners')
      .select('id, legal_name, status, type')
      .eq('id', linkData.partner_id)
      .single();

    if (masterError || !masterPartner) {
      return new Response(
        JSON.stringify({ error: 'Partner referenciador não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (masterPartner.status !== 'ACTIVE') {
      return new Response(
        JSON.stringify({ error: 'O partner referenciador não está ativo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = createError.message?.includes('already been registered')
        ? 'Este email já está cadastrado no sistema'
        : 'Erro ao criar conta de usuário';
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = newUser.user.id;

    // 2. Assign 'partner' role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'partner' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // 3. Create partner record
    const { data: partnerRecord, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert({
        user_id: userId,
        email,
        person_type: person_type || 'CPF',
        document_number,
        legal_name,
        phone: phone || null,
        region_state: region_state || null,
        region_city: region_city || null,
        years_in_health_market: years_in_health_market || 0,
        monthly_relationship_clinics: monthly_relationship_clinics || 0,
        type: 'PARTNER',
        status: 'ACTIVE',
        activated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (partnerError) {
      console.error('Error creating partner:', partnerError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de partner' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Link to master partner in partner_network
    const { error: networkError } = await supabaseAdmin
      .from('partner_network')
      .insert({
        parent_partner_id: linkData.partner_id,
        child_partner_id: partnerRecord.id,
        relationship_type: 'INDICATION',
        is_active: true,
      });

    if (networkError) {
      console.error('Error linking network:', networkError);
    }

    // 5. Increment uses_count on the link
    const { error: linkUpdateError } = await supabaseAdmin
      .from('partner_links')
      .update({ uses_count: linkData.uses_count + 1 })
      .eq('id', linkData.id);

    if (linkUpdateError) {
      console.error('Error updating link uses:', linkUpdateError);
    }

    // 6. Create alert for the master partner
    await supabaseAdmin.from('partner_alerts').insert({
      partner_id: linkData.partner_id,
      alert_type: 'NEW_PARTNER',
      title: 'Novo partner cadastrado via indicação',
      description: `${legal_name} (${email}) se cadastrou usando seu link de indicação.`,
      severity: 'LOW',
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email },
        partner_id: partnerRecord.id,
        master_partner: masterPartner.legal_name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Register partner error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
