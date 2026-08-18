import { createClient } from 'jsr:@supabase/supabase-js@2';

// Same og:price/product:price/regex heuristic as the extension's
// extractProductInfo (apps/extension/src/lib/extract.ts), ported to work off
// raw HTML text since there's no DOM here.
//
// ponytail: plain fetch() + regex has no ceiling for JS-rendered pricing or
// bot-walled sites (Amazon blocks non-browser fetches outright) -- it only
// gets a price on sites that render it server-side in static HTML. Upgrade
// path if that bites: a headless-browser fetch (e.g. Browserless/ScrapingBee)
// for domains that come back empty.
function extractPrice(html: string): { price: number | null; currency: string } {
  const metaMatch = html.match(
    /<meta[^>]+(?:property|name)="(?:product:price:amount|og:price:amount)"[^>]+content="([\d.,]+)"/i,
  );
  if (metaMatch) {
    return { price: parseFloat(metaMatch[1].replace(',', '')), currency: '$' };
  }
  const textMatch = html.match(/[$£€]\s?\d+(?:[.,]\d{2})?/);
  if (textMatch) {
    return { price: parseFloat(textMatch[0].slice(1).replace(',', '')), currency: textMatch[0][0] };
  }
  return { price: null, currency: '$' };
}

Deno.serve(async () => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: tracked, error } = await admin.from('tracked_products').select('*');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let checked = 0;
  let changed = 0;

  for (const product of tracked ?? []) {
    checked++;
    try {
      const res = await fetch(product.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaniPriceBot/1.0)' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const { price, currency } = extractPrice(html);
      if (price == null) continue;

      await admin
        .from('tracked_products')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', product.id);

      if (price !== product.price) {
        changed++;
        await admin.from('tracked_products').update({ price, currency }).eq('id', product.id);
        await admin
          .from('price_history')
          .insert({ tracked_product_id: product.id, price, currency });
        await admin
          .from('products')
          .update({ price, currency })
          .eq('tracked_product_id', product.id);
      }
    } catch {
      // Network/parse failure on one product shouldn't stop the rest.
    }
  }

  return new Response(JSON.stringify({ checked, changed }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
