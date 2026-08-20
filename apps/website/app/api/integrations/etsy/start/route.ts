import { NextResponse } from 'next/server';

import { getUserFromAuthHeader } from '@/lib/supabase-server';
import {
  ETSY_AUTH_URL,
  ETSY_SCOPE,
  codeChallengeFromVerifier,
  generateCodeVerifier,
  signEtsyState,
} from '@/lib/etsy-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const keystring = process.env.ETSY_KEYSTRING;
  const redirectUri = process.env.ETSY_REDIRECT_URI;
  if (!keystring || !redirectUri || !process.env.ETSY_SHARED_SECRET) {
    return NextResponse.json({ error: 'Etsy integration is not configured yet' }, { status: 500 });
  }

  const verifier = generateCodeVerifier();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: keystring,
    redirect_uri: redirectUri,
    scope: ETSY_SCOPE,
    state: signEtsyState({ uid: user.id, verifier }),
    code_challenge: codeChallengeFromVerifier(verifier),
    code_challenge_method: 'S256',
  });

  return NextResponse.json({ url: `${ETSY_AUTH_URL}?${params}` });
}
