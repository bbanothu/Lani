import { NextResponse } from 'next/server';

import { getUserFromAuthHeader, supabaseAsUser } from '@/lib/supabase-server';
import { reverbApiFetch, refreshReverbToken } from '@/lib/reverb-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req);
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const token = req.headers.get('authorization')!.replace(/^Bearer\s+/i, '');
  const db = supabaseAsUser(token);

  const { data: row, error } = await db
    .from('integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('provider', 'reverb')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Reverb is not connected' }, { status: 404 });

  let accessToken = row.access_token as string;
  if (new Date(row.expires_at as string).getTime() <= Date.now()) {
    if (!row.refresh_token) {
      return NextResponse.json({ error: 'Reverb connection expired, reconnect' }, { status: 401 });
    }
    const refreshed = await refreshReverbToken(row.refresh_token as string);
    accessToken = refreshed.access_token;
    await db
      .from('integrations')
      .update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq('provider', 'reverb');
  }

  try {
    const data = await reverbApiFetch('/my/orders/selling?per_page=50', accessToken);
    const list = data.orders ?? data._embedded?.orders ?? [];
    const orders = list.map((o: any) => ({
      orderId: String(o.order_number ?? o.id ?? ''),
      itemTitle: o.listing?.title ?? o.line_items?.[0]?.listing?.title ?? 'Reverb order',
      price: o.total?.amount ?? o.amount_product?.amount ?? null,
      currency: o.total?.currency ?? 'USD',
      status: o.status ?? 'unknown',
      creationDate: o.created_at ?? new Date().toISOString(),
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load Reverb orders' },
      { status: 502 },
    );
  }
}
