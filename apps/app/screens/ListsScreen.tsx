import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import {
  createList,
  deleteList,
  getLists,
  subscribeToLists,
  updateList,
  type ListVisibility,
  type ProductList,
} from '../lib/lists';
import type { Tab } from '../lib/nav';
import { getProducts, type Product } from '../lib/products';
import { colors } from '../lib/theme';

const FILTERS: { id: 'all' | ListVisibility; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'private', label: 'Private' },
  { id: 'shared', label: 'Shared' },
  { id: 'public', label: 'Public' },
];

const VISIBILITY_COLOR: Record<ListVisibility, string> = {
  private: '#0369A1',
  shared: '#6D28D9',
  public: '#047857',
};

function nextVisibility(v: ListVisibility): ListVisibility {
  return v === 'private' ? 'shared' : v === 'shared' ? 'public' : 'private';
}

export default function ListsScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [lists, setLists] = useState<ProductList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | ListVisibility>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    const sync = () => {
      getLists().then(setLists);
      getProducts().then(setProducts);
    };
    sync();
    return subscribeToLists(sync);
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? lists : lists.filter((l) => l.visibility === filter)),
    [lists, filter],
  );

  function openCreateForm() {
    setEditingList(null);
    setFormTitle('');
    setFormDescription('');
    setFormVisible(true);
  }

  function openEditForm(list: ProductList) {
    setEditingList(list);
    setFormTitle(list.title);
    setFormDescription(list.description);
    setFormVisible(true);
  }

  async function handleFormSave() {
    if (editingList) {
      await updateList(editingList.id, {
        title: formTitle.trim() || editingList.title,
        description: formDescription,
      });
    } else {
      if (!formTitle.trim()) return;
      await createList({ title: formTitle, description: formDescription });
    }
    setFormVisible(false);
    getLists().then(setLists);
  }

  function handleDelete(list: ProductList) {
    Alert.alert('Delete list', `Delete "${list.title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteList(list.id).then(() => getLists().then(setLists)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={visible}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Your Lists</Text>
              <Pressable style={styles.newBtn} onPress={openCreateForm}>
                <Text style={styles.newBtnText}>+ New List</Text>
              </Pressable>
            </View>
            <View style={styles.filterRow}>
              {FILTERS.map((chip) => {
                const active = filter === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setFilter(chip.id)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No lists yet</Text>
            <Text style={styles.emptyMessage}>
              Create a list, then tap the heart on any product to save it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const thumbs = item.productIds
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p))
            .slice(0, 4);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description || 'No description'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable hitSlop={8} onPress={() => openEditForm(item)}>
                    <Text style={styles.cardActionText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      updateList(item.id, { visibility: nextVisibility(item.visibility) })
                    }
                  >
                    <Text style={styles.cardActionText}>Share</Text>
                  </Pressable>
                  {!item.isFavorites && (
                    <Pressable hitSlop={8} onPress={() => handleDelete(item)}>
                      <Text style={[styles.cardActionText, { color: '#dc2626' }]}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <Text style={[styles.badge, { color: VISIBILITY_COLOR[item.visibility] }]}>
                {item.visibility}
              </Text>

              {thumbs.length > 0 && (
                <View style={styles.thumbRow}>
                  {thumbs.map((p) => (
                    <View key={p.id} style={styles.thumb}>
                      {p.image ? (
                        <Image source={{ uri: p.image }} style={styles.thumbImage} />
                      ) : (
                        <Text style={{ fontSize: 16, opacity: 0.4 }}>🛍️</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.itemCount}>
                {item.productIds.length} item{item.productIds.length === 1 ? '' : 's'}
              </Text>
            </View>
          );
        }}
      />

      <Modal visible={formVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingList ? 'Edit list' : 'New list'}</Text>
            <TextInput
              value={formTitle}
              onChangeText={setFormTitle}
              placeholder="List name"
              placeholderTextColor={colors.ink40}
              style={styles.modalInput}
            />
            <TextInput
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.ink40}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setFormVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={handleFormSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav active="lists" onSelect={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 16, paddingBottom: 120 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
  newBtn: {
    backgroundColor: colors.brand,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterChipText: { fontSize: 13, fontWeight: '500', color: colors.ink60 },
  filterChipTextActive: { color: colors.white },
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink },
  emptyMessage: { fontSize: 14, color: colors.ink60, textAlign: 'center', maxWidth: 280 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  cardDescription: { marginTop: 2, fontSize: 13, color: colors.ink40 },
  cardActions: { flexDirection: 'row', gap: 12 },
  cardActionText: { fontSize: 12, fontWeight: '600', color: colors.ink45 },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  thumbRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.ink05,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  itemCount: { marginTop: 10, fontSize: 13, color: colors.ink45 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.ink15,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4 },
  modalCancel: { paddingVertical: 8, paddingHorizontal: 4 },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.ink45 },
  modalSave: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSaveText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
