import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { addToCart, isInCart, removeFromCart } from '../lib/cart';
import { isProductFavorited, toggleFavorite } from '../lib/lists';
import { trackProduct, untrackProduct, type Product } from '../lib/products';
import { colors } from '../lib/theme';

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function retailerLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

export default function ProductCard({ product }: { product: Product }) {
  const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
  const [inCart, setInCart] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [tracking, setTracking] = useState(product.tracking);

  useEffect(() => {
    isInCart(product.id).then(setInCart);
  }, [product.id]);

  useEffect(() => {
    isProductFavorited(product.id).then(setFavorited);
  }, [product.id]);

  const handleToggleFavorite = () => {
    setFavorited((prev) => !prev);
    toggleFavorite(product.id).catch(() => setFavorited((prev) => !prev));
  };

  const handleToggleCart = () => {
    const wasInCart = inCart;
    setInCart(!wasInCart);
    const action = wasInCart ? removeFromCart(product.id) : addToCart(product);
    action.catch(() => setInCart(wasInCart));
  };

  const handleToggleTracking = () => {
    const wasTracking = tracking;
    setTracking(!wasTracking);
    const action = wasTracking ? untrackProduct(product.id) : trackProduct(product.id);
    action.catch(() => setTracking(wasTracking));
  };

  return (
    <Pressable style={styles.card} onPress={() => Linking.openURL(product.url)}>
      <View style={styles.metaRow}>
        <Text style={styles.retailer} numberOfLines={1}>
          {retailerLabel(product.domain)}
        </Text>
        <Text style={styles.time}>{relativeTime(product.addedAt)}</Text>
      </View>

      <View style={styles.imageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.placeholder}>🛍️</Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{price}</Text>

        <View style={styles.actions}>
          <Pressable hitSlop={8} onPress={handleToggleFavorite} style={styles.actionBtn}>
            <Text style={[styles.actionGlyph, favorited && styles.actionGlyphActive]}>
              {favorited ? '♥' : '♡'}
            </Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={handleToggleCart} style={styles.actionBtn}>
            <Text style={[styles.actionGlyph, inCart && styles.actionGlyphActive]}>
              {inCart ? '✓ Cart' : '+ Cart'}
            </Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={handleToggleTracking} style={styles.actionBtn}>
            <Text style={[styles.actionGlyph, tracking && styles.actionGlyphActive]}>
              {tracking ? '📈 Tracking' : '📈 Track'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  retailer: { fontSize: 11, fontWeight: '500', color: colors.ink40, textTransform: 'lowercase' },
  time: { fontSize: 11, color: colors.ink40 },
  imageWrap: {
    margin: 12,
    marginTop: 8,
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: colors.ink05,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  placeholder: { fontSize: 28, opacity: 0.4 },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  title: { fontSize: 13, fontWeight: '600', lineHeight: 17, color: colors.ink },
  price: { marginTop: 4, fontSize: 16, fontWeight: '700', color: colors.ink },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { paddingVertical: 2 },
  actionGlyph: { fontSize: 13, fontWeight: '600', color: colors.ink40 },
  actionGlyphActive: { color: colors.brand },
});
