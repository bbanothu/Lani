import { supabase } from './supabase';
import { productFromRow, type Product, type ProductRow } from './products';

export async function getCart(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('added_at, products(*)')
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((row): row is typeof row & { products: ProductRow } => Boolean(row.products))
    .map((row) => ({ ...productFromRow(row.products), addedAt: row.added_at }));
}

export async function addToCart(product: Product): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { product_id: product.id },
      { onConflict: 'user_id,product_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function removeFromCart(productId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('product_id', productId);
  if (error) throw error;
}

export async function clearCart(): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().not('id', 'is', null);
  if (error) throw error;
}

export async function isInCart(productId: string): Promise<boolean> {
  const { data } = await supabase
    .from('cart_items')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();
  return Boolean(data);
}

export function subscribeToCart(callback: () => void): () => void {
  const channel = supabase
    .channel(`cart-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
