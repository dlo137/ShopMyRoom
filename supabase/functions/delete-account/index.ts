import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // JWT uses base64url — convert to standard base64 before decoding
    const base64Payload = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payload = JSON.parse(atob(base64Payload));
    const userId: string | undefined = payload?.sub;
    console.log('User ID from token:', userId);

    if (!userId) {
      return json({ error: 'Invalid token — no subject' }, 401);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Calling deleteUser for:', userId);
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      console.error('deleteUser error:', error.message);
      return json({ error: error.message }, 500);
    }

    console.log('User deleted successfully');
    return json({ success: true }, 200);
  } catch (err) {
    console.error('Unexpected error:', String(err));
    return json({ error: String(err) }, 500);
  }
});

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
