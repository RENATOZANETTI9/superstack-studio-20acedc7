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
      email,
      password,
      legal_name,
      document_number,
      phone,
      categoria,
    } = await req.json();

    // Validate required fields
    if (!email || !password || !legal_name || !document_number) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: email, senha, nome e CPF' }),
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

    // Validate CPF (Module 11)
    const cpfDigits = document_number.replace(/\D/g, '');
    if (cpfDigits.length !== 11 || /^(\d)\1{10}$/.test(cpfDigits)) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpfDigits[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(cpfDigits[9])) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido - dígitos verificadores incorretos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpfDigits[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10) rem = 0;
    if (rem !== parseInt(cpfDigits[10])) {
      return new Response(
        JSON.stringify({ error: 'CPF inválido - dígitos verificadores incorretos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create auth user
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
        person_type: 'CPF',
        document_number: cpfDigits,
        legal_name,
        phone: phone || null,
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

    // 4. Create profile record (in case trigger didn't fire)
    await supabaseAdmin
      .from('profiles')
      .upsert({ user_id: userId, email }, { onConflict: 'user_id' });

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email },
        partner_id: partnerRecord.id,
        categoria,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Register partner public error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
