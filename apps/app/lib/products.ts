import { supabase } from './supabase';

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

export type ProductRow = {
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

export function subscribeToProducts(callback: () => void): () => void {
  const channel = supabase
    .channel(`products-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
