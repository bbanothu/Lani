import { supabase } from './supabase';

export type Provider = 'ebay' | 'etsy' | 'reverb';

export interface Integration {
  provider: Provider;
  connectedAt: string;
}

type IntegrationRow = {
  provider: Provider;
  connected_at: string;
};

function fromRow(row: IntegrationRow): Integration {
  return { provider: row.provider, connectedAt: row.connected_at };
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase.from('integrations').select('provider, connected_at');
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function disconnectIntegration(provider: Provider): Promise<void> {
  const { error } = await supabase.from('integrations').delete().eq('provider', provider);
  if (error) throw error;
}

// Live-refresh hook, same pattern as subscribeToProducts. The website's OAuth
// callback writes the connected row server-side, so this is also how the app
// finds out a connection completed after the user returns from the browser.
export function subscribeToIntegrations(callback: () => void): () => void {
  const channel = supabase
    .channel(`integrations-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'integrations' }, callback)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface ProviderOrder {
  orderId: string;
  itemTitle: string;
  price: string | null;
  currency: string;
  status: string;
  creationDate: string;
}

// The OAuth flow and order fetch are handled by the website's API routes --
// the app just calls them over HTTPS with the user's Supabase access token.
async function authedFetch(path: string): Promise<any> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  const res = await fetch(`${process.env.EXPO_PUBLIC_SITE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export async function getConnectUrl(provider: Provider): Promise<string> {
  const { url } = await authedFetch(`/api/integrations/${provider}/start`);
  return url;
}

export async function getProviderOrders(provider: Provider): Promise<ProviderOrder[]> {
  const { orders } = await authedFetch(`/api/integrations/${provider}/orders`);
  return orders;
}
