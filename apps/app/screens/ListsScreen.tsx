import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import ListDetailScreen from './ListDetailScreen';
import {
  createList,
  deleteList,
  getLists,
  subscribeToLists,
  updateList,
  type ListVisibility,
  type ProductList,
} from '../lib/lists';
import {
  addListShare,
  getListShares,
  removeListShare,
  shareLinkFor,
  type ListShare,
} from '../lib/list-shares';
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

export default function ListsScreen() {
  const [lists, setLists] = useState<ProductList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ListVisibility>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [sharingList, setSharingList] = useState<ProductList | null>(null);
  const [shares, setShares] = useState<ListShare[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      getLists().then((l) => {
        setLists(l);
        setLoading(false);
      });
      getProducts().then(setProducts);
    };
    sync();
    return subscribeToLists(sync);
  }, []);

  async function openShare(list: ProductList) {
    setSharingList(list);
    setShareEmail('');
    if (list.visibility === 'private') await updateList(list.id, { visibility: 'shared' });
    setShares(await getListShares(list.id));
  }

  async function handleAddShareEmail() {
    if (!sharingList) return;
    const email = shareEmail.trim();
    if (!email) return;
    await addListShare(sharingList.id, email);
    setShareEmail('');
    setShares(await getListShares(sharingList.id));
  }

  async function handleRemoveShareEmail(shareId: string) {
    if (!sharingList) return;
    await removeListShare(shareId);
    setShares(await getListShares(sharingList.id));
  }

  function handleShareLink() {
    if (!sharingList) return;
    const url = shareLinkFor(sharingList.id);
    Share.share({ message: url, url });
  }

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

  const selectedList = selectedListId ? (lists.find((l) => l.id === selectedListId) ?? null) : null;

  if (selectedList) {
    return (
      <ListDetailScreen
        list={selectedList}
        products={products}
        onBack={() => setSelectedListId(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>Loading your lists…</Text>
        </View>
      ) : (
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
          renderItem={({ item, index }) => {
            const thumbs = item.productIds
              .map((id) => products.find((p) => p.id === id))
              .filter((p): p is Product => Boolean(p))
              .slice(0, 6);
            return (
              <FadeIn delay={Math.min(index, 20) * 40} style={styles.card}>
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
                    <Pressable hitSlop={8} onPress={() => openShare(item)}>
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

                <View style={styles.footerRow}>
                  <Text style={styles.itemCount}>
                    {item.productIds.length} item{item.productIds.length === 1 ? '' : 's'}
                  </Text>
                  <Pressable hitSlop={8} onPress={() => setSelectedListId(item.id)}>
                    <Text style={styles.seeAllText}>See all →</Text>
                  </Pressable>
                </View>
              </FadeIn>
            );
          }}
        />
      )}

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

      <Modal visible={sharingList != null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Share “{sharingList?.title}”</Text>

            <Text style={styles.shareLabel}>Anyone with this link can view it</Text>
            <View style={styles.shareLinkRow}>
              <Text style={styles.shareLinkText} numberOfLines={1}>
                {sharingList ? shareLinkFor(sharingList.id) : ''}
              </Text>
              <Pressable style={styles.shareBtn} onPress={handleShareLink}>
                <Text style={styles.shareBtnText}>Share</Text>
              </Pressable>
            </View>

            <Text style={[styles.shareLabel, { marginTop: 12 }]}>Invite by email</Text>
            <View style={styles.shareLinkRow}>
              <TextInput
                value={shareEmail}
                onChangeText={setShareEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.ink40}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                onSubmitEditing={handleAddShareEmail}
              />
              <Pressable style={styles.shareBtn} onPress={handleAddShareEmail}>
                <Text style={styles.shareBtnText}>Add</Text>
              </Pressable>
            </View>

            {shares.length > 0 && (
              <View style={{ marginTop: 10, gap: 6 }}>
                {shares.map((share) => (
                  <View key={share.id} style={styles.shareRow}>
                    <Text style={styles.shareEmail} numberOfLines={1}>
                      {share.email}
                    </Text>
                    <Pressable hitSlop={8} onPress={() => handleRemoveShareEmail(share.id)}>
                      <Text style={styles.shareRemove}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSave} onPress={() => setSharingList(null)}>
                <Text style={styles.modalSaveText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: colors.ink45 },
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
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
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
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCount: { fontSize: 13, color: colors.ink45 },
  seeAllText: { fontSize: 13, fontWeight: '600', color: colors.brand },
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
  shareLabel: { fontSize: 12, fontWeight: '600', color: colors.ink45 },
  shareLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  shareLinkText: {
    flex: 1,
    fontSize: 13,
    color: colors.ink70,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: '#F7F7F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  shareBtn: {
    backgroundColor: colors.ink05,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shareBtnText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ink05,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  shareEmail: { flex: 1, fontSize: 13, color: colors.ink70 },
  shareRemove: { fontSize: 12, fontWeight: '600', color: colors.ink40 },
});
