import { NextResponse } from 'next/server';

import { exchangeCodeForTokens } from '@/lib/reverb-server';
import { verifyState } from '@/lib/oauth-state';
import { supabaseServiceRole } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const redirect = (query: string) =>
    NextResponse.redirect(new URL(`/profile?tab=integrations${query}`, req.url));

  const data = state
    ? verifyState<{ uid: string }>(process.env.REVERB_CLIENT_SECRET!, state)
    : null;
  if (!data || !code) {
    return redirect('&error=' + encodeURIComponent('Connection request expired, try again'));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, process.env.REVERB_REDIRECT_URI!);
    const { error } = await supabaseServiceRole()
      .from('integrations')
      .upsert(
        {
          user_id: data.uid,
          provider: 'reverb',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );
    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reverb connection failed';
    return redirect('&error=' + encodeURIComponent(message));
  }

  return redirect('&connected=reverb');
}
