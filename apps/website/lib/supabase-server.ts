import { createClient, type User } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Verifies a Supabase access token sent by the browser; returns the user or null. */
export async function getUserFromAuthHeader(req: Request): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await createClient(url, anonKey).auth.getUser(token);
  return error ? null : data.user;
}

/** Client scoped to one user's own RLS-visible rows, via their forwarded access token. */
export function supabaseAsUser(token: string) {
  return createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

/** Bypasses RLS entirely -- only for the OAuth callback, where the uid comes from a signed state instead of a session. */
export function supabaseServiceRole() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
