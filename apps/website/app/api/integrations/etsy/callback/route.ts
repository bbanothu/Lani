import { NextResponse } from 'next/server';

import { exchangeCodeForTokens, verifyEtsyState } from '@/lib/etsy-server';
import { supabaseServiceRole } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const redirect = (query: string) =>
    NextResponse.redirect(new URL(`/profile?tab=integrations${query}`, req.url));

  const data = state ? verifyEtsyState(state) : null;
  if (!data || !code) {
    return redirect('&error=' + encodeURIComponent('Connection request expired, try again'));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, data.verifier, process.env.ETSY_REDIRECT_URI!);
    const { error } = await supabaseServiceRole()
      .from('integrations')
      .upsert(
        {
          user_id: data.uid,
          provider: 'etsy',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );
    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Etsy connection failed';
    return redirect('&error=' + encodeURIComponent(message));
  }

  return redirect('&connected=etsy');
}
