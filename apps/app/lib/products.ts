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
  tracking: boolean;
  trackedProductId: string | null;
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
  tracking: boolean;
  tracked_product_id: string | null;
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
    tracking: row.tracking,
    trackedProductId: row.tracked_product_id,
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

export async function trackProduct(productId: string): Promise<void> {
  const { error } = await supabase.rpc('track_product', { p_product_id: productId });
  if (error) throw error;
}

export async function untrackProduct(productId: string): Promise<void> {
  const { error } = await supabase.rpc('untrack_product', { p_product_id: productId });
  if (error) throw error;
}

export interface PricePoint {
  price: number | null;
  currency: string;
  checkedAt: string;
}

export async function getPriceHistory(trackedProductId: string): Promise<PricePoint[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('price, currency, checked_at')
    .eq('tracked_product_id', trackedProductId)
    .order('checked_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    price: row.price,
    currency: row.currency,
    checkedAt: row.checked_at,
  }));
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
