import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { cnpj, email, especialidade, razao_social } = await req.json();

    if (!cnpj || !email || !especialidade) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: cnpj, email, especialidade' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a random password for the clinic user
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!';

    // Create user in auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        cnpj,
        especialidade,
        razao_social,
        tipo: 'clinic_owner',
      },
    });

    if (createError) {
      // If user already exists, generate login link
      if (createError.message?.includes('already been registered') || createError.message?.includes('already exists')) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            existing: true,
            redirect_url: '/auth',
            message: 'Usuário já cadastrado. Faça login para acessar.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Create user error:', createError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign clinic_owner role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'clinic_owner' });

    if (roleError) {
      console.error('Role assignment error:', roleError);
    }

    // Generate a magic link for auto-login
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    let redirectUrl = '/auth';
    if (linkData?.properties?.hashed_token) {
      redirectUrl = `/auth#access_token=${linkData.properties.hashed_token}&type=magiclink`;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        redirect_url: redirectUrl,
        user_id: newUser.user.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Register clinic error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
