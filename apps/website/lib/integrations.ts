import { supabase } from '@/lib/supabase';

export interface Integration {
  provider: 'ebay';
  connectedAt: string;
}

type IntegrationRow = {
  provider: 'ebay';
  connected_at: string;
};

function integrationFromRow(row: IntegrationRow): Integration {
  return { provider: row.provider, connectedAt: row.connected_at };
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase.from('integrations').select('provider, connected_at');
  if (error) throw error;
  return (data ?? []).map(integrationFromRow);
}

export async function disconnectIntegration(provider: Integration['provider']): Promise<void> {
  const { error } = await supabase.from('integrations').delete().eq('provider', provider);
  if (error) throw error;
}

// Live-refresh hook, same pattern as subscribeToProducts.
export function subscribeToIntegrations(callback: () => void): () => void {
  const channel = supabase
    .channel(`integrations-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'integrations' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface EbayOrder {
  orderId: string;
  itemTitle: string;
  price: string | null;
  currency: string;
  status: string;
  creationDate: string;
}

async function authedFetch(path: string): Promise<any> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export async function connectEbay(): Promise<void> {
  const { url } = await authedFetch('/api/integrations/ebay/start');
  window.location.href = url;
}

export async function getEbayOrders(): Promise<EbayOrder[]> {
  const { orders } = await authedFetch('/api/integrations/ebay/orders');
  return orders;
}
