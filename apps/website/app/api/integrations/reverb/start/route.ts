import { NextResponse } from 'next/server';

import { getUserFromAuthHeader } from '@/lib/supabase-server';
import { REVERB_AUTH_URL, REVERB_SCOPE } from '@/lib/reverb-server';
import { signState } from '@/lib/oauth-state';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const clientId = process.env.REVERB_CLIENT_ID;
  const redirectUri = process.env.REVERB_REDIRECT_URI;
  if (!clientId || !redirectUri || !process.env.REVERB_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Reverb integration is not configured yet' },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: REVERB_SCOPE,
    state: signState(process.env.REVERB_CLIENT_SECRET, { uid: user.id }),
  });

  return NextResponse.json({ url: `${REVERB_AUTH_URL}?${params}` });
}
