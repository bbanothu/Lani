import { supabase } from '@/lib/supabase';

export async function blacklistDomain(domain: string): Promise<void> {
  if (!domain) return;
  const { error } = await supabase
    .from('blacklisted_domains')
    .upsert({ domain }, { onConflict: 'user_id,domain' });
  if (error) throw error;
}
