import { createClient } from 'jsr:@supabase/supabase-js@2';

// Browser calls (POST + Authorization header) trigger a CORS preflight --
// every response, including the OPTIONS one, needs these headers or the
// browser blocks the request before it ever reaches the code below.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Deletes the calling user's auth account. Every table with user data
// (products, lists, list_products, cart_items, chat_sessions, chat_messages)
// has `user_id references auth.users(id) on delete cascade`, so deleting the
// auth user is enough -- Postgres cleans up the rest.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);
  if (userError || !user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({ ok: true });
});
