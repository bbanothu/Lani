import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import FadeIn from './FadeIn';
import {
  disconnectIntegration,
  getConnectUrl,
  getIntegrations,
  getProviderOrders,
  subscribeToIntegrations,
  type Integration,
  type Provider,
  type ProviderOrder,
} from '../lib/integrations';
import { colors } from '../lib/theme';

const PROVIDERS: { id: Provider; name: string; domain: string; blurb: string }[] = [
  { id: 'ebay', name: 'eBay', domain: 'ebay.com', blurb: 'Pull your selling history' },
  { id: 'etsy', name: 'Etsy', domain: 'etsy.com', blurb: "Pull your shop's order history" },
  { id: 'reverb', name: 'Reverb', domain: 'reverb.com', blurb: 'Pull your selling history' },
];

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
      const url = await getConnectUrl(id);
      await Linking.openURL(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : `Failed to start ${name} connection`);
    } finally {
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: logoUrl(domain) }} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.blurb}>
            {integration ? `Connected on ${formatDate(integration.connectedAt)}` : blurb}
          </Text>
        </View>
        {integration ? (
          <Pressable
            style={styles.secondaryBtn}
            onPress={handleDisconnect}
            disabled={disconnecting}
            accessibilityLabel="Disconnect"
          >
            {disconnecting ? (
              <ActivityIndicator size="small" color={colors.ink60} />
            ) : (
              <Text style={styles.secondaryBtnText}>✕</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={styles.primaryBtn}
            onPress={handleConnect}
            disabled={connecting}
            accessibilityLabel="Connect"
          >
            {connecting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>+</Text>
            )}
          </Pressable>
        )}
      </View>

      {integration ? (
        <View style={styles.historySection}>
          <Pressable onPress={toggleHistory}>
            <Text style={styles.historyToggle}>
              {historyOpen ? 'Hide selling history' : 'View selling history'}
            </Text>
          </Pressable>

          {historyOpen ? (
            ordersLoading ? (
              <ActivityIndicator color={colors.brand} style={{ marginTop: 10 }} />
            ) : ordersError ? (
              <Text style={styles.errorText}>{ordersError}</Text>
            ) : orders && orders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet.</Text>
            ) : (
              <View style={{ marginTop: 8, gap: 6 }}>
                {orders?.map((o) => (
                  <View key={o.orderId} style={styles.orderRow}>
                    <Text style={styles.orderTitle} numberOfLines={1}>
                      {o.itemTitle}
                    </Text>
                    <View style={styles.orderMeta}>
                      <Text style={styles.orderDate}>
                        {formatDate(o.creationDate)} · {o.status}
                      </Text>
                      {o.price ? (
                        <Text style={styles.orderPrice}>
                          {o.currency} {o.price}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => getIntegrations().then(setIntegrations);
    sync();
    return subscribeToIntegrations(sync);
  }, []);

  return (
    <View style={{ gap: 12 }}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {PROVIDERS.map((p, i) => (
        <FadeIn key={p.id} delay={i * 60}>
          <ProviderCard
            id={p.id}
            name={p.name}
            domain={p.domain}
            blurb={p.blurb}
            integration={integrations.find((int) => int.provider === p.id) ?? null}
            onError={setError}
          />
        </FadeIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  blurb: { marginTop: 2, fontSize: 13, color: colors.ink45 },
  primaryBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  secondaryBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.ink05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: colors.ink60 },
  historySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.ink08,
  },
  historyToggle: { fontSize: 13, fontWeight: '600', color: colors.brand },
  errorText: { marginTop: 8, fontSize: 13, color: '#be123c' },
  emptyText: { marginTop: 8, fontSize: 13, color: colors.ink45 },
  orderRow: { backgroundColor: colors.ink05, borderRadius: 10, padding: 10 },
  orderTitle: { fontSize: 13, fontWeight: '600', color: colors.ink },
  orderMeta: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: { fontSize: 11, color: colors.ink40 },
  orderPrice: { fontSize: 12, fontWeight: '700', color: colors.ink },
  errorBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    padding: 12,
  },
  errorBannerText: { fontSize: 13, color: '#be123c' },
});
