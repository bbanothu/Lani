import { supabase } from '@/lib/supabase';

export interface ListShare {
  id: string;
  email: string;
}

export async function getListShares(listId: string): Promise<ListShare[]> {
  const { data, error } = await supabase
    .from('list_shares')
    .select('id, email')
    .eq('list_id', listId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addListShare(listId: string, email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return;
  const { error } = await supabase
    .from('list_shares')
    .upsert({ list_id: listId, email: trimmed }, { onConflict: 'list_id,email' });
  if (error) throw error;
}

export async function removeListShare(shareId: string): Promise<void> {
  const { error } = await supabase.from('list_shares').delete().eq('id', shareId);
  if (error) throw error;
}
