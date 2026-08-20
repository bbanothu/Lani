'use client';

import { useEffect, useState } from 'react';

import {
  connectEbay,
  disconnectIntegration,
  getEbayOrders,
  getIntegrations,
  subscribeToIntegrations,
  type EbayOrder,
  type Integration,
} from '@/lib/integrations';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [orders, setOrders] = useState<EbayOrder[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) setError(params.get('error'));

    const sync = () => getIntegrations().then(setIntegrations);
    sync();
    return subscribeToIntegrations(sync);
  }, []);

  const ebay = integrations.find((i) => i.provider === 'ebay') ?? null;

  async function handleConnectEbay() {
    setError(null);
    setConnecting(true);
    try {
      await connectEbay();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start eBay connection');
      setConnecting(false);
    }
  }

  async function handleDisconnectEbay() {
    setDisconnecting(true);
    try {
      await disconnectIntegration('ebay');
      setHistoryOpen(false);
      setOrders(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect eBay');
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
      setOrders(await getEbayOrders());
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load selling history');
    } finally {
      setOrdersLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink">eBay</p>
            <p className="mt-0.5 text-sm text-ink/45">
              {ebay ? `Connected on ${formatDate(ebay.connectedAt)}` : 'Pull your selling history'}
            </p>
          </div>
          {ebay ? (
            <button
              type="button"
              onClick={handleDisconnectEbay}
              disabled={disconnecting}
              className="shrink-0 rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnectEbay}
              disabled={connecting}
              className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>

        {ebay ? (
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
                    <div
                      key={o.orderId}
                      className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{o.itemTitle}</p>
                        <p className="text-xs text-ink/40">
                          {formatDate(o.creationDate)} · {o.status}
                        </p>
                      </div>
                      {o.price ? (
                        <p className="shrink-0 font-semibold text-ink">
                          {o.currency} {o.price}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {[
        { name: 'Etsy', blurb: 'Buyer and seller order history' },
        { name: 'Poshmark', blurb: 'Selling history' },
      ].map((provider) => (
        <section
          key={provider.name}
          className="flex items-center justify-between rounded-[28px] border border-ink/8 bg-white p-6 opacity-50 shadow-sm"
        >
          <div>
            <p className="font-semibold text-ink">{provider.name}</p>
            <p className="mt-0.5 text-sm text-ink/45">{provider.blurb}</p>
          </div>
          <span className="shrink-0 rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-semibold text-ink/45">
            Coming soon
          </span>
        </section>
      ))}
    </div>
  );
}
