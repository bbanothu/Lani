import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import { clearCart, getCart, removeFromCart, subscribeToCart } from '../lib/cart';
import type { Product } from '../lib/products';
import { colors } from '../lib/theme';

function money(n: number | null): string {
  if (n == null) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

export default function CartScreen() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () =>
      getCart().then((c) => {
        setItems(c);
        setLoading(false);
      });
    sync();
    return subscribeToCart(sync);
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.price ?? 0), 0), [items]);

  function handleClear() {
    if (!items.length) return;
    Alert.alert('Clear cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
    ]);
  }

  function openAll() {
    for (const item of items) Linking.openURL(item.url);
  }

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Loading your cart…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              <Text style={styles.title}>Universal Shopping Cart</Text>
              <View style={styles.summary}>
                <View style={styles.summaryHeaderRow}>
                  <View style={styles.summaryTotalRow}>
                    <Text style={styles.summaryTotal}>{money(total)}</Text>
                    <Text style={styles.summarySub}>
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  {items.length > 0 && (
                    <View style={styles.summaryActions}>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={openAll}
                        hitSlop={8}
                        accessibilityLabel="Open all product pages"
                      >
                        <Text style={styles.iconBtnText}>↗</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.iconBtn, styles.iconBtnMuted]}
                        onPress={handleClear}
                        hitSlop={8}
                        accessibilityLabel="Clear cart"
                      >
                        <Text style={styles.iconBtnMutedText}>🗑</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyMessage}>
                Tap the cart icon on any product card to add it here.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <FadeIn delay={Math.min(index, 20) * 40} style={styles.item}>
              <Pressable onPress={() => Linking.openURL(item.url)}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={{ opacity: 0.4 }}>🛍️</Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemStore}>{storeLabel(item.domain)}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{money(item.price)}</Text>
                  <Pressable onPress={() => removeFromCart(item.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </FadeIn>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: colors.ink45 },
  list: { padding: 16, paddingBottom: 120 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
    textAlign: 'center',
  },
  summary: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  summaryTotal: { fontSize: 26, fontWeight: '700', color: colors.ink },
  summarySub: { fontSize: 13, color: colors.ink45 },
  summaryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  iconBtnMuted: { backgroundColor: colors.ink05 },
  iconBtnMutedText: { fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  emptyMessage: { fontSize: 14, color: colors.ink60, textAlign: 'center', maxWidth: 280 },
  item: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: { width: 64, height: 64, borderRadius: 12 },
  itemImagePlaceholder: {
    backgroundColor: colors.ink05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, justifyContent: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.ink },
  itemStore: { marginTop: 2, fontSize: 12, color: colors.ink40 },
  itemFooter: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.ink },
  removeText: { fontSize: 13, fontWeight: '600', color: colors.ink40 },
});
