import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function sets up the master user - should only be called once during initial setup
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if master user already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('role', 'master');

    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Usuário master já existe' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create master user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'helpude@gmail.com',
      password: 'admin123',
      email_confirm: true,
    });

    if (createError) {
      // If user already exists, find them and assign master role
      if (createError.message.includes('already been registered')) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingMaster = users.find(u => u.email === 'helpude@gmail.com');
        
        if (existingMaster) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({ user_id: existingMaster.id, role: 'master' }, { onConflict: 'user_id' });

          if (roleError) {
            return new Response(
              JSON.stringify({ error: roleError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Role master atribuída ao usuário existente' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign 'master' role to the user
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'master' });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário master criado com sucesso!' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
