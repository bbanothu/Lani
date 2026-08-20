import { supabase } from '@/lib/supabase';

export type ListVisibility = 'private' | 'shared' | 'public';

export interface ProductList {
  id: string;
  title: string;
  description: string;
  visibility: ListVisibility;
  productIds: string[];
  createdAt: string;
  isFavorites: boolean;
}

type ListRow = {
  id: string;
  title: string;
  description: string;
  visibility: ListVisibility;
  is_favorites: boolean;
  created_at: string;
  list_products: { product_id: string }[] | null;
};

function fromRow(row: ListRow): ProductList {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    productIds: (row.list_products ?? []).map((lp) => lp.product_id),
    createdAt: row.created_at,
    isFavorites: row.is_favorites,
  };
}

export function isFavoritesList(list: ProductList): boolean {
  return list.isFavorites;
}

const SELECT = '*, list_products(product_id)';

export async function getLists(): Promise<ProductList[]> {
  const { data, error } = await supabase
    .from('lists')
    .select(SELECT)
    .order('is_favorites', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getList(id: string): Promise<ProductList | null> {
  const { data, error } = await supabase.from('lists').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

/** Lists someone else shared with the signed-in user's email -- RLS on list_shares scopes this to their own invites. */
export async function getSharedWithMe(): Promise<ProductList[]> {
  const { data, error } = await supabase
    .from('list_shares')
    .select(`lists(${SELECT})`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.lists)
    .filter(Boolean)
    .map(fromRow);
}

export async function createList(input: {
  title: string;
  description?: string;
  visibility?: ListVisibility;
}): Promise<ProductList> {
  const { data, error } = await supabase
    .from('lists')
    .insert({
      title: input.title.trim() || 'Untitled list',
      description: (input.description || '').trim(),
      visibility: input.visibility || 'private',
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateList(
  id: string,
  patch: Partial<Pick<ProductList, 'title' | 'description' | 'visibility'>>,
): Promise<void> {
  const { error } = await supabase.from('lists').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteList(id: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', id);
  // The Favorites list is protected by a DB trigger that raises on delete --
  // swallow that specific error so callers don't need to know about it.
  if (error && !/Favorites/i.test(error.message)) throw error;
}

export async function addProductToList(listId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('list_products')
    .upsert(
      { list_id: listId, product_id: productId },
      { onConflict: 'list_id,product_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function removeProductFromList(listId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('list_products')
    .delete()
    .eq('list_id', listId)
    .eq('product_id', productId);
  if (error) throw error;
}

async function getFavoritesList(): Promise<ProductList | null> {
  const { data, error } = await supabase
    .from('lists')
    .select(SELECT)
    .eq('is_favorites', true)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function isProductFavorited(productId: string): Promise<boolean> {
  const favorites = await getFavoritesList();
  return Boolean(favorites?.productIds.includes(productId));
}

export async function toggleFavorite(productId: string): Promise<void> {
  const favorites = await getFavoritesList();
  if (!favorites) return;
  if (favorites.productIds.includes(productId)) {
    await removeProductFromList(favorites.id, productId);
  } else {
    await addProductToList(favorites.id, productId);
  }
}

export function subscribeToLists(callback: () => void): () => void {
  const channel = supabase
    .channel(`lists-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'list_products' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
