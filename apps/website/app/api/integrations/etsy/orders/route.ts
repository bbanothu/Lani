import { NextResponse } from 'next/server';

import { getUserFromAuthHeader, supabaseAsUser } from '@/lib/supabase-server';
import { etsyApiFetch, etsyUserIdFromToken, refreshEtsyToken } from '@/lib/etsy-server';

export const runtime = 'nodejs';

function money(m: { amount?: number; divisor?: number; currency_code?: string } | undefined) {
  if (!m || typeof m.amount !== 'number' || !m.divisor) return { price: null, currency: 'USD' };
  return { price: (m.amount / m.divisor).toFixed(2), currency: m.currency_code || 'USD' };
}

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const token = req.headers.get('authorization')!.replace(/^Bearer\s+/i, '');
  const db = supabaseAsUser(token);

  const { data: row, error } = await db
    .from('integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('provider', 'etsy')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Etsy is not connected' }, { status: 404 });

  let accessToken = row.access_token as string;
  if (new Date(row.expires_at as string).getTime() <= Date.now()) {
    if (!row.refresh_token) {
      return NextResponse.json({ error: 'Etsy connection expired, reconnect' }, { status: 401 });
    }
    const refreshed = await refreshEtsyToken(row.refresh_token as string);
    accessToken = refreshed.access_token;
    await db
      .from('integrations')
      .update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('provider', 'etsy');
  }

  try {
    const etsyUserId = etsyUserIdFromToken(accessToken);
    const shop = await etsyApiFetch(`/users/${etsyUserId}/shops`, accessToken);
    const shopId = shop?.shop_id ?? shop?.results?.[0]?.shop_id;
    if (!shopId) {
      return NextResponse.json({ error: 'No Etsy shop found for this account' }, { status: 404 });
    }

    const receipts = await etsyApiFetch(`/shops/${shopId}/receipts?limit=50`, accessToken);
    const orders = (receipts.results ?? []).map((r: any) => {
      const { price, currency } = money(r.total_price ?? r.grandtotal);
      return {
        orderId: String(r.receipt_id),
        itemTitle: r.transactions?.[0]?.title ?? 'Etsy order',
        price,
        currency,
        status: r.status ?? (r.is_shipped ? 'shipped' : 'open'),
        creationDate: r.created_timestamp
          ? new Date(r.created_timestamp * 1000).toISOString()
          : new Date().toISOString(),
      };
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load Etsy orders' },
      { status: 502 },
    );
  }
}
