import { NextResponse } from 'next/server';

import { getUserFromAuthHeader, supabaseAsUser } from '@/lib/supabase-server';
import { EBAY_BASE, refreshEbayToken } from '@/lib/ebay-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const token = req.headers.get('authorization')!.replace(/^Bearer\s+/i, '');
  const db = supabaseAsUser(token);

  const { data: row, error } = await db
    .from('integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('provider', 'ebay')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'eBay is not connected' }, { status: 404 });

  let accessToken = row.access_token as string;
  if (new Date(row.expires_at as string).getTime() <= Date.now()) {
    if (!row.refresh_token) {
      return NextResponse.json({ error: 'eBay connection expired, reconnect' }, { status: 401 });
    }
    const refreshed = await refreshEbayToken(row.refresh_token as string);
    accessToken = refreshed.access_token;
    await db
      .from('integrations')
      .update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('provider', 'ebay');
  }

  const res = await fetch(`${EBAY_BASE.api}/sell/fulfillment/v1/order?limit=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: json.errors?.[0]?.message || 'Failed to load eBay orders' },
      { status: 502 },
    );
  }

  const orders = (json.orders ?? []).map((o: any) => ({
    orderId: o.orderId,
    itemTitle: o.lineItems?.[0]?.title ?? 'eBay order',
    price: o.pricingSummary?.total?.value ?? null,
    currency: o.pricingSummary?.total?.currency ?? 'USD',
    status: o.orderFulfillmentStatus,
    creationDate: o.creationDate,
  }));

  return NextResponse.json({ orders });
}
