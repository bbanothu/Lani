import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
  url: string;
  domain: string;
  addedAt: string;
  source: 'extension' | 'manual';
  tags?: string[];
}

type ProductRow = {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  image: string | null;
  url: string;
  domain: string;
  added_at: string;
  source: 'extension' | 'manual';
  tags: string[] | null;
};

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    currency: row.currency,
    image: row.image,
    url: row.url,
    domain: row.domain,
    addedAt: row.added_at,
    source: row.source,
    tags: row.tags ?? [],
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(productFromRow);
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? productFromRow(data) : null;
}

export async function addProduct(input: Omit<Product, 'id' | 'addedAt'>): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      title: input.title,
      price: input.price,
      currency: input.currency,
      image: input.image,
      url: input.url,
      domain: input.domain,
      source: input.source,
      tags: input.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return productFromRow(data);
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Live-refresh hook: any insert/update/delete on `products` re-triggers `callback`,
// which re-fetches through the normal RLS-scoped query -- the realtime payload
// itself is never read, so it doesn't matter that it isn't filtered per-user.
export function subscribeToProducts(callback: () => void): () => void {
  const channel = supabase
    .channel(`products-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
