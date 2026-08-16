import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { clearCart, getCart, removeFromCart, subscribeToCart } from '../lib/cart';
import type { Product } from '../lib/products';
import { colors } from '../lib/theme';
import type { Tab } from '../lib/nav';

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

export default function CartScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const sync = () => getCart().then(setItems);
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
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Cart</Text>
            <View style={styles.summary}>
              <Text style={styles.summaryTotal}>{money(total)}</Text>
              <Text style={styles.summarySub}>
                {items.length} item{items.length === 1 ? '' : 's'}
              </Text>
              {items.length > 0 && (
                <View style={styles.summaryActions}>
                  <Pressable style={styles.primaryBtn} onPress={openAll}>
                    <Text style={styles.primaryBtnText}>Open all product pages</Text>
                  </Pressable>
                  <Pressable onPress={handleClear}>
                    <Text style={styles.clearText}>Clear cart</Text>
                  </Pressable>
                </View>
              )}
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
        renderItem={({ item }) => (
          <View style={styles.item}>
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
          </View>
        )}
      />
      <BottomNav active="cart" onSelect={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: 16 },
  summary: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 20,
    marginBottom: 16,
  },
  summaryTotal: { fontSize: 32, fontWeight: '700', color: colors.ink },
  summarySub: { marginTop: 2, fontSize: 13, color: colors.ink45 },
  summaryActions: { marginTop: 16, gap: 10 },
  primaryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  clearText: { textAlign: 'center', fontSize: 13, color: colors.ink40, fontWeight: '500' },
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
