import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import ProductCard from '../components/ProductCard';
import type { ListVisibility, ProductList } from '../lib/lists';
import type { Product } from '../lib/products';
import { colors } from '../lib/theme';

const VISIBILITY_COLOR: Record<ListVisibility, string> = {
  private: '#0369A1',
  shared: '#6D28D9',
  public: '#047857',
};

export default function ListDetailScreen({
  list,
  products,
  onBack,
}: {
  list: ProductList;
  products: Product[];
  onBack: () => void;
}) {
  const items = useMemo(
    () =>
      list.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [list.productIds, products],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.navRow}>
              <Pressable hitSlop={8} onPress={onBack} style={styles.navSide}>
                <Text style={styles.backText}>‹ All lists</Text>
              </Pressable>
              <Text style={styles.navTitle} numberOfLines={1}>
                {list.title}
              </Text>
              <View style={styles.navSide} />
            </View>
            <Text style={styles.description}>{list.description || 'No description'}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.badge, { color: VISIBILITY_COLOR[list.visibility] }]}>
                {list.visibility}
              </Text>
              <Text style={styles.itemCount}>
                {items.length} item{items.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyMessage}>
              Tap the heart on any product card to add it to this list.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index, 20) * 40} style={styles.cardWrap}>
            <ProductCard product={item} />
          </FadeIn>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 16, paddingBottom: 120 },
  row: { gap: 12 },
  cardWrap: { flex: 1, marginBottom: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  navSide: { flex: 1 },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  backText: { fontSize: 14, fontWeight: '600', color: colors.ink45 },
  description: { marginTop: 4, fontSize: 14, color: colors.ink45 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 4 },
  badge: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  itemCount: { fontSize: 13, color: colors.ink40 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  emptyMessage: { fontSize: 14, color: colors.ink60, textAlign: 'center', maxWidth: 280 },
});
