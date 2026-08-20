'use client';

import { useEffect, useState } from 'react';

import {
  connectProvider,
  disconnectIntegration,
  getProviderOrders,
  getIntegrations,
  subscribeToIntegrations,
  type Integration,
  type Provider,
  type ProviderOrder,
} from '@/lib/integrations';

const PROVIDERS: { id: Provider; name: string; domain: string; blurb: string }[] = [
  { id: 'ebay', name: 'eBay', domain: 'ebay.com', blurb: 'Pull your selling history' },
  { id: 'etsy', name: 'Etsy', domain: 'etsy.com', blurb: "Pull your shop's order history" },
  { id: 'reverb', name: 'Reverb', domain: 'reverb.com', blurb: 'Pull your selling history' },
];

const COMING_SOON: { name: string; domain: string; blurb: string }[] = [];

function logoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ProviderCard({
  id,
  name,
  domain,
  blurb,
  integration,
  onError,
}: {
  id: Provider;
  name: string;
  domain: string;
  blurb: string;
  integration: Integration | null;
  onError: (message: string) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [orders, setOrders] = useState<ProviderOrder[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    try {
      await connectProvider(id);
    } catch (err) {
      onError(err instanceof Error ? err.message : `Failed to start ${name} connection`);
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectIntegration(id);
      setHistoryOpen(false);
      setOrders(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : `Failed to disconnect ${name}`);
    } finally {
      setDisconnecting(false);
    }
  }

  async function toggleHistory() {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(true);
    if (orders) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      setOrders(await getProviderOrders(id));
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load selling history');
    } finally {
      setOrdersLoading(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl(domain)} alt="" className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{name}</p>
          <p className="mt-0.5 text-sm text-ink/45">
            {integration ? `Connected on ${formatDate(integration.connectedAt)}` : blurb}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        {integration ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="w-full rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5 disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="w-full rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        )}
      </div>

      {integration ? (
        <div className="mt-4 border-t border-ink/8 pt-4">
          <button
            type="button"
            onClick={toggleHistory}
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            {historyOpen ? 'Hide selling history' : 'View selling history'}
          </button>

          {historyOpen ? (
            <div className="mt-3 space-y-2">
              {ordersLoading ? (
                <p className="text-sm text-ink/45">Loading…</p>
              ) : ordersError ? (
                <p className="text-sm text-red-600">{ordersError}</p>
              ) : orders && orders.length === 0 ? (
                <p className="text-sm text-ink/45">No orders yet.</p>
              ) : (
                orders?.map((o) => (
                  <div key={o.orderId} className="rounded-xl bg-ink/[0.03] px-3 py-2 text-sm">
                    <p className="truncate font-medium text-ink">{o.itemTitle}</p>
                    <div className="mt-0.5 flex items-center justify-between text-xs text-ink/40">
                      <span>
                        {formatDate(o.creationDate)} · {o.status}
                      </span>
                      {o.price ? (
                        <span className="font-semibold text-ink">
                          {o.currency} {o.price}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError(params.get('error'));

    const sync = () => getIntegrations().then(setIntegrations);
    sync();
    return subscribeToIntegrations(sync);
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p, i) => (
          <div key={p.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in">
            <ProviderCard
              id={p.id}
              name={p.name}
              domain={p.domain}
              blurb={p.blurb}
              integration={integrations.find((int) => int.provider === p.id) ?? null}
              onError={setError}
            />
          </div>
        ))}

        {COMING_SOON.map((provider, i) => (
          <section
            key={provider.name}
            style={{ animationDelay: `${(PROVIDERS.length + i) * 60}ms` }}
            className="animate-fade-in flex items-start gap-3 rounded-[28px] border border-ink/8 bg-white p-6 opacity-50 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl(provider.domain)} alt="" className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{provider.name}</p>
              <p className="mt-0.5 text-sm text-ink/45">{provider.blurb}</p>
              <span className="mt-3 inline-block rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-semibold text-ink/45">
                Coming soon
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
