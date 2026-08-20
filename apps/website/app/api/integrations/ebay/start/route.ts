import { NextResponse } from 'next/server';

import { getUserFromAuthHeader } from '@/lib/supabase-server';
import { EBAY_BASE, EBAY_SCOPE, signState } from '@/lib/ebay-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const clientId = process.env.EBAY_CLIENT_ID;
  const ruName = process.env.EBAY_RU_NAME;
  if (!clientId || !ruName || !process.env.EBAY_CLIENT_SECRET) {
    return NextResponse.json({ error: 'eBay integration is not configured yet' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: ruName,
    response_type: 'code',
    state: signState(user.id),
    scope: EBAY_SCOPE,
  });

  return NextResponse.json({ url: `${EBAY_BASE.auth}/oauth2/authorize?${params}` });
}
