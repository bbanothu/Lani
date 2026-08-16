import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import BottomNav from '../components/BottomNav';
import ProductCard from '../components/ProductCard';
import QuickFilters, { type FilterChip } from '../components/QuickFilters';
import type { AuthUser } from '../lib/auth';
import type { Tab } from '../lib/nav';
import { getProducts, subscribeToProducts, type Product } from '../lib/products';
import { colors } from '../lib/theme';

const STOP = new Set([
  'with', 'from', 'that', 'this', 'your', 'into', 'over', 'under', 'and', 'the', 'for', 'set',
]);

function buildFilterChips(products: Product[]): FilterChip[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const words = product.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w));
    for (const word of words.slice(0, 4)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ key, label: key, count }));
}

export default function DashboardScreen({
  user,
  onNavigate,
}: {
  user: AuthUser;
  onNavigate: (tab: Tab) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    getProducts().then(setProducts);
    return subscribeToProducts(() => getProducts().then(setProducts));
  }, []);

  const chips = useMemo(() => buildFilterChips(products), [products]);

  const visible = useMemo(() => {
    if (activeFilters.size === 0) return products;
    return products.filter((product) => {
      const hay = product.title.toLowerCase();
      return [...activeFilters].every((key) => hay.includes(key));
    });
  }, [products, activeFilters]);

  const firstName = user.name.trim().split(/\s+/)[0] || 'there';

  function toggleFilter(key: string) {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.brandRow}>
              <Image source={require('../assets/icon.png')} style={styles.brandIcon} />
              <Text style={styles.brandName}>Lani</Text>
            </View>
            <Text style={styles.greeting}>Hey, {firstName}</Text>
            <View style={styles.filters}>
              <QuickFilters chips={chips} active={activeFilters} onToggle={toggleFilter} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {products.length === 0 ? 'No products yet' : 'No matches'}
            </Text>
            <Text style={styles.emptyMessage}>
              {products.length === 0
                ? 'Install the Lani extension and browse — product pages you visit show up here automatically.'
                : 'Try clearing a filter.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <ProductCard product={item} />
          </View>
        )}
      />
      <BottomNav active="home" onSelect={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 16, paddingBottom: 120 },
  row: { gap: 12 },
  cardWrap: { flex: 1, marginBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  brandIcon: { width: 40, height: 40, borderRadius: 8 },
  brandName: { fontSize: 22, fontWeight: '700', color: colors.ink },
  greeting: { fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: 16 },
  filters: { marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  emptyMessage: { fontSize: 14, color: colors.ink60, textAlign: 'center', maxWidth: 280 },
});
