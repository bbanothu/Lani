import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IntegrationsPanel from '../components/IntegrationsPanel';
import { deleteAccount, signOut, updateName, type AuthUser } from '../lib/auth';
import { pickAndUploadAvatar } from '../lib/avatar';
import { getLists, subscribeToLists } from '../lib/lists';
import { getLLMSettings, saveLLMSettings, type LLMProvider, type LLMSettings } from '../lib/llm';
import { getProducts, subscribeToProducts, type Product } from '../lib/products';
import { colors } from '../lib/theme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

const PROVIDERS: { id: LLMProvider; label: string }[] = [
  { id: 'ollama', label: 'Ollama' },
  { id: 'claude', label: 'Claude' },
  { id: 'openrouter', label: 'OpenRouter' },
];

const SITE_URL = 'https://lani.brainrotslop.com';

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

function topStores(products: Product[]): { domain: string; count: number; pct: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.domain) continue;
    counts.set(p.domain, (counts.get(p.domain) ?? 0) + 1);
  }
  const total = products.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, count]) => ({ domain, count, pct: Math.round((count / total) * 100) }));
}

export default function ProfileScreen({
  user,
  onSignedOut,
}: {
  user: AuthUser;
  onSignedOut: () => void;
}) {
  const [tab, setTab] = useState<'general' | 'integrations'>('general');
  const [products, setProducts] = useState<Product[]>([]);
  const [favoritedCount, setFavoritedCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [llm, setLlm] = useState<LLMSettings | null>(null);
  const [llmSaved, setLlmSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
    return subscribeToProducts(() => getProducts().then(setProducts));
  }, []);

  useEffect(() => {
    getLLMSettings().then(setLlm);
  }, []);

  useEffect(() => {
    const sync = () =>
      getLists().then((lists) =>
        setFavoritedCount(lists.find((l) => l.isFavorites)?.productIds.length ?? 0),
      );
    sync();
    return subscribeToLists(sync);
  }, []);

  const stores = useMemo(() => topStores(products), [products]);

  async function handleSave() {
    const trimmed = name.trim() || user.name;
    await updateName(trimmed);
    setName(trimmed);
    setEditing(false);
  }

  async function handlePickAvatar() {
    setAvatarUploading(true);
    try {
      await pickAndUploadAvatar(user.id);
    } catch (err) {
      Alert.alert(
        'Could not update photo',
        err instanceof Error ? err.message : 'Something went wrong, try again.',
      );
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveLlm() {
    if (!llm) return;
    await saveLLMSettings(llm);
    setLlmSaved(true);
    setTimeout(() => setLlmSaved(false), 1500);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      "This permanently deletes your account and all your data -- products, lists, cart, and chat history. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const error = await deleteAccount();
            if (error) Alert.alert('Could not delete account', error);
            else onSignedOut();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.tabBar}>
          {(['general', 'integrations'] as const).map((t) => {
            const active = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {t === 'general' ? 'General' : 'Integrations'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'integrations' ? (
          <IntegrationsPanel />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.profileRow}>
                <Pressable
                  onPress={handlePickAvatar}
                  disabled={avatarUploading}
                  style={styles.avatarWrap}
                >
                  <View style={styles.avatar}>
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarText}>{initials(user.name)}</Text>
                    )}
                    {avatarUploading ? (
                      <View style={styles.avatarLoading}>
                        <ActivityIndicator color={colors.white} size="small" />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.avatarPlusBadge}>
                    <Text style={styles.avatarPlusText}>+</Text>
                  </View>
                </Pressable>
                {editing ? (
                  <View style={{ flex: 1, gap: 6 }}>
                    <TextInput value={name} onChangeText={setName} style={styles.nameInput} />
                    <Text style={styles.email}>{user.email}</Text>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                  </View>
                )}
                <Pressable
                  style={styles.editBtn}
                  onPress={editing ? handleSave : () => setEditing(true)}
                >
                  <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                { label: 'Products', value: products.length },
                { label: 'Saved', value: favoritedCount },
                { label: 'Stores', value: stores.length },
              ].map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>TOP STORES</Text>
              {stores.length === 0 ? (
                <Text style={styles.sectionEmpty}>
                  Install the Lani extension and browse — your most-visited stores show up here.
                </Text>
              ) : (
                stores.map((store) => (
                  <View key={store.domain} style={styles.storeRow}>
                    <Image source={{ uri: faviconUrl(store.domain) }} style={styles.storeFavicon} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.storeHeader}>
                        <Text style={styles.storeName}>{storeLabel(store.domain)}</Text>
                        <Text style={styles.storeCount}>{store.count}</Text>
                      </View>
                      <View style={styles.storeBarTrack}>
                        <View style={[styles.storeBarFill, { width: `${store.pct}%` }]} />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {llm && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>AI ASSISTANT</Text>

                <View style={styles.providerRow}>
                  {PROVIDERS.map((p) => {
                    const active = llm.provider === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setLlm({ ...llm, provider: p.id })}
                        style={[styles.providerChip, active && styles.providerChipActive]}
                      >
                        <Text
                          style={[styles.providerChipText, active && styles.providerChipTextActive]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>Model</Text>
                <TextInput
                  value={llm.model}
                  onChangeText={(v) => setLlm({ ...llm, model: v })}
                  placeholder="e.g. llama3.1"
                  placeholderTextColor={colors.ink40}
                  autoCapitalize="none"
                  style={styles.llmInput}
                />

                {llm.provider === 'ollama' ? (
                  <>
                    <Text style={styles.fieldLabel}>Ollama base URL</Text>
                    <TextInput
                      value={llm.ollamaBaseUrl}
                      onChangeText={(v) => setLlm({ ...llm, ollamaBaseUrl: v })}
                      placeholder="http://127.0.0.1:11434/v1"
                      placeholderTextColor={colors.ink40}
                      autoCapitalize="none"
                      style={styles.llmInput}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.fieldLabel}>API key</Text>
                    <TextInput
                      value={llm.apiKey}
                      onChangeText={(v) => setLlm({ ...llm, apiKey: v })}
                      placeholder="sk-..."
                      placeholderTextColor={colors.ink40}
                      autoCapitalize="none"
                      secureTextEntry
                      style={styles.llmInput}
                    />
                  </>
                )}

                <Pressable style={styles.llmSaveBtn} onPress={handleSaveLlm}>
                  <Text style={styles.llmSaveBtnText}>{llmSaved ? 'Saved ✓' : 'Save'}</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Pressable style={styles.linkRow} onPress={() => Linking.openURL(SITE_URL)}>
                <Text style={styles.linkText}>Visit our website</Text>
              </Pressable>
              <Pressable
                style={styles.linkRow}
                onPress={() => Linking.openURL(`${SITE_URL}/support`)}
              >
                <Text style={styles.linkText}>Support</Text>
              </Pressable>
            </View>

            <Pressable style={styles.signOutBtn} onPress={() => signOut().then(onSignedOut)}>
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>

            <Pressable style={styles.signOutBtn} onPress={handleDeleteAccount}>
              <Text style={styles.deleteAccountText}>Delete account</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: 16 },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.ink05,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: { flex: 1, alignItems: 'center', borderRadius: 8, paddingVertical: 8 },
  tabBtnActive: { backgroundColor: colors.white },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: colors.ink45 },
  tabBtnTextActive: { color: colors.ink },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { position: 'relative', width: 56, height: 56 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(243,105,36,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.brand },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlusText: { color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  email: { fontSize: 13, color: colors.ink60, marginTop: 2 },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.ink15,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: colors.ink,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.ink15,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.ink },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink08,
    backgroundColor: colors.white,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.ink },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.ink40,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.ink40, letterSpacing: 0.5 },
  linkRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.ink08, marginTop: 10 },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  sectionEmpty: { marginTop: 10, fontSize: 13, color: colors.ink45 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  storeFavicon: { width: 20, height: 20, borderRadius: 4 },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  storeName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  storeCount: { fontSize: 13, color: colors.ink40 },
  storeBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink05,
    marginTop: 4,
    overflow: 'hidden',
  },
  storeBarFill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  signOutBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  signOutText: { fontSize: 14, fontWeight: '600', color: colors.ink45 },
  deleteAccountText: { fontSize: 14, fontWeight: '600', color: '#be123c' },
  providerRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  providerChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingVertical: 8,
  },
  providerChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  providerChipText: { fontSize: 12, fontWeight: '600', color: colors.ink60 },
  providerChipTextActive: { color: colors.white },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink45,
  },
  llmInput: {
    borderWidth: 1,
    borderColor: colors.ink15,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  llmSaveBtn: {
    marginTop: 14,
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  llmSaveBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});
