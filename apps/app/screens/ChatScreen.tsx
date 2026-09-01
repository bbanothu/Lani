import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import FadeIn from '../components/FadeIn';
import { addToCart, isInCart, removeFromCart, subscribeToCart } from '../lib/cart';
import { streamChat } from '../lib/chat';
import {
  addChatMessage,
  createChatSession,
  getChatMessages,
  getChatSessions,
  titleFromMessage,
  type ChatSession,
} from '../lib/chat-history';
import { getLLMSettings, type ChatMessage } from '../lib/llm';
import { addProductToList, getLists, removeProductFromList, type ProductList } from '../lib/lists';
import { getProducts, type Product } from '../lib/products';
import { colors } from '../lib/theme';

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productIds?: string[];
};

const PRODUCTS_TAG = /\[\[products:\s*([^\]]+)\]\]/gi;
const ACTION_TAG = /\[\[action:(add_cart|remove_cart|favorite|unfavorite|add_list):([^\]]+)\]\]/gi;

type ChatAction =
  | { type: 'add_cart'; product: Product }
  | { type: 'remove_cart'; product: Product }
  | { type: 'add_list'; product: Product; list: ProductList }
  | { type: 'remove_list'; product: Product; list: ProductList };

function formatProductLine(product: Product, index: number, favoriteIds: Set<string>): string {
  const price = product.price != null ? `${product.currency}${product.price}` : 'price unknown';
  const saved = favoriteIds.has(product.id) ? 'saved' : 'not saved';
  return `${index + 1}. ${product.title} | ${price} | ${product.domain} | ${saved}`;
}

function stripActionTags(raw: string): string {
  return raw.replace(ACTION_TAG, '').replace(PRODUCTS_TAG, '').trim();
}

async function buildSystemMessage(products: Product[], lists: ProductList[]): Promise<ChatMessage> {
  const favoriteIds = new Set(lists.find((l) => l.isFavorites)?.productIds ?? []);
  const catalog =
    products.length === 0
      ? 'The user has no products in their Lani list yet.'
      : `The user has ${products.length} product(s) in their Lani list:\n${products
          .map((p, i) => formatProductLine(p, i, favoriteIds))
          .join('\n')}`;
  const listNames = lists.map((l) => l.title).join(', ') || 'Favorites';

  return {
    role: 'system',
    content: [
      'You are Lani, a friendly shopping assistant.',
      'Keep replies concise and helpful. No markdown images, no URLs. Plain text is fine.',
      'Use the product list below as your primary context when recommending, comparing, or answering.',
      'Prefer items from this list when relevant. If something is missing, say so.',
      'When you recommend or discuss specific products from the list, end your message with exactly one line:',
      '[[products:1,2]]',
      'Use the item numbers from the list above (never the product name or a made-up id). Omit that line if no products apply.',
      '',
      'You can also take actions the user asks for by including one tag per action, anywhere in your reply (they are removed before the user sees the message, so also confirm the action in plain text):',
      '[[action:add_cart:N]] -- add item N to the cart',
      '[[action:remove_cart:N]] -- remove item N from the cart',
      '[[action:favorite:N]] -- favorite item N',
      '[[action:unfavorite:N]] -- unfavorite item N',
      '[[action:add_list:N:LIST_NAME]] -- add item N to a list, using its exact name from the list below',
      `Lists available: ${listNames}`,
      'Only take an action when the user actually asks for it.',
      '',
      catalog,
    ].join('\n'),
  };
}

function parseAssistantReply(
  raw: string,
  catalog: Product[],
  lists: ProductList[],
): { content: string; productIds: string[]; actions: ChatAction[] } {
  const ids: string[] = [];
  const actions: ChatAction[] = [];
  const favorites = lists.find((l) => l.isFavorites);

  const content = raw
    .replace(ACTION_TAG, (_, type: string, args: string) => {
      const [indexStr, listName] = args.split(':');
      const product = catalog[Number(indexStr.trim()) - 1];
      if (!product) return '';
      if (!ids.includes(product.id)) ids.push(product.id);

      if (type === 'add_cart' || type === 'remove_cart') {
        actions.push({ type, product });
      } else if (type === 'favorite' || type === 'unfavorite') {
        if (favorites) {
          actions.push({
            type: type === 'favorite' ? 'add_list' : 'remove_list',
            product,
            list: favorites,
          });
        }
      } else if (type === 'add_list') {
        const list = lists.find(
          (l) => l.title.trim().toLowerCase() === (listName || '').trim().toLowerCase(),
        );
        if (list) actions.push({ type: 'add_list', product, list });
      }
      return '';
    })
    .replace(PRODUCTS_TAG, (_, list: string) => {
      for (const part of list.split(/[\s,]+/)) {
        const product = catalog[Number(part.trim()) - 1];
        if (product && !ids.includes(product.id)) ids.push(product.id);
      }
      return '';
    })
    .trim();

  const lower = content.toLowerCase();
  for (const product of catalog) {
    const title = product.title.trim();
    if (title.length >= 8 && lower.includes(title.toLowerCase()) && !ids.includes(product.id)) {
      ids.push(product.id);
    }
  }

  return { content: content || '…', productIds: ids, actions };
}

async function runChatActions(actions: ChatAction[]): Promise<void> {
  for (const action of actions) {
    if (action.type === 'add_cart') await addToCart(action.product);
    else if (action.type === 'remove_cart') await removeFromCart(action.product.id);
    else if (action.type === 'add_list') await addProductToList(action.list.id, action.product.id);
    else await removeProductFromList(action.list.id, action.product.id);
  }
}

function RailCard({ product }: { product: Product }) {
  const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    const sync = () => isInCart(product.id).then(setInCart);
    sync();
    return subscribeToCart(sync);
  }, [product.id]);

  return (
    <View style={railStyles.card}>
      <Pressable onPress={() => Linking.openURL(product.url)}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={railStyles.image} />
        ) : (
          <View style={[railStyles.image, railStyles.imagePlaceholder]}>
            <Text style={{ fontSize: 24, opacity: 0.4 }}>🛍️</Text>
          </View>
        )}
        <View style={railStyles.body}>
          <Text style={railStyles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={railStyles.price}>{price}</Text>
        </View>
      </Pressable>
      <Pressable
        hitSlop={6}
        onPress={() => addToCart(product)}
        style={[railStyles.cartBtn, inCart && railStyles.cartBtnActive]}
      >
        <Text style={[railStyles.cartBtnText, inCart && railStyles.cartBtnTextActive]}>
          {inCart ? '✓' : '🛒'}
        </Text>
      </Pressable>
    </View>
  );
}

function ProductRail({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={products}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ gap: 10 }}
      renderItem={({ item, index }) => (
        <FadeIn delay={Math.min(index, 20) * 40}>
          <RailCard product={item} />
        </FadeIn>
      )}
    />
  );
}

const railStyles = StyleSheet.create({
  card: {
    width: 148,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.ink05 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  cartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cartBtnActive: { backgroundColor: colors.brand },
  cartBtnText: { fontSize: 12 },
  cartBtnTextActive: { color: colors.white, fontWeight: '700' },
  title: { fontSize: 12, fontWeight: '600', lineHeight: 15, color: colors.ink },
  price: { fontSize: 14, fontWeight: '700', color: colors.ink },
});

const WELCOME_MESSAGE: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi — I'm Lani. Ask me about products you've saved, deals, or what to buy next.",
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Map<string, Product>>(new Map());
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const listRef = useRef<FlatList<UiMessage>>(null);

  useEffect(() => {
    getProducts().then((p) => setCatalog(new Map(p.map((x) => [x.id, x]))));
  }, []);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, sending]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: UiMessage = { id: `u_${Date.now()}`, role: 'user', content: trimmed };
    const assistantId = `a_${Date.now()}`;
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      let sid = sessionId;
      if (!sid) {
        const session = await createChatSession(titleFromMessage(trimmed));
        sid = session.id;
        setSessionId(sid);
      }
      await addChatMessage(sid, 'user', trimmed);

      const catalog = await getProducts();
      const lists = await getLists();
      const history: ChatMessage[] = [
        await buildSystemMessage(catalog, lists),
        ...next.map((m) => ({ role: m.role, content: m.content })),
      ];
      const settings = await getLLMSettings();
      const reply = await streamChat(history, settings, (partial) => {
        const display = stripActionTags(partial);
        if (!display) return;
        setMessages((current) =>
          current.map((m) => (m.id === assistantId ? { ...m, content: display } : m)),
        );
      });
      const parsed = parseAssistantReply(reply.trim(), catalog, lists);
      await runChatActions(parsed.actions);
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId
            ? { ...m, content: parsed.content, productIds: parsed.productIds }
            : m,
        ),
      );
      await addChatMessage(sid, 'assistant', parsed.content, parsed.productIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      setMessages((current) => current.filter((m) => m.id !== assistantId));
    } finally {
      setSending(false);
    }
  }

  function startNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    setError(null);
  }

  async function openHistory() {
    setHistoryVisible(true);
    setHistoryLoading(true);
    setSessions(await getChatSessions());
    setHistoryLoading(false);
  }

  async function loadSession(session: ChatSession) {
    const stored = await getChatMessages(session.id);
    setMessages(
      stored.map((m) => ({ id: m.id, role: m.role, content: m.content, productIds: m.productIds })),
    );
    setSessionId(session.id);
    setHistoryVisible(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Chat with Lani</Text>
          <View style={styles.headerActions}>
            <Pressable hitSlop={8} onPress={openHistory} style={styles.headerBtn}>
              <Text style={styles.headerBtnIcon}>🕘</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={startNewChat} style={styles.headerBtn}>
              <Text style={styles.headerBtnIcon}>✚</Text>
            </Pressable>
          </View>
        </View>

        <FadeIn style={styles.panelWrap}>
          <BlurView intensity={40} tint="light" style={styles.panel}>
            <FlatList
              ref={listRef}
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                if (item.role === 'user') {
                  return (
                    <View style={styles.userRow}>
                      <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.content}</Text>
                      </View>
                    </View>
                  );
                }
                const cards = (item.productIds || [])
                  .map((id) => catalog.get(id))
                  .filter((p): p is Product => Boolean(p));
                return (
                  <View style={styles.assistantBlock}>
                    <View style={styles.assistantHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>L</Text>
                      </View>
                      <Text style={styles.assistantName}>Lani</Text>
                    </View>
                    <View style={styles.assistantBubble}>
                      {item.content ? (
                        <Text style={styles.assistantText}>{item.content}</Text>
                      ) : (
                        <View style={styles.thinkingRow}>
                          <ActivityIndicator size="small" color={colors.ink40} />
                          <Text style={styles.thinkingText}>Thinking…</Text>
                        </View>
                      )}
                    </View>
                    <ProductRail products={cards} />
                  </View>
                );
              }}
              ListFooterComponent={error ? <Text style={styles.errorText}>{error}</Text> : null}
            />

            <View style={styles.inputBar}>
              <View style={styles.inputPill}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.ink40}
                  style={styles.input}
                  editable={!sending}
                  onSubmitEditing={send}
                />
                <Pressable
                  onPress={send}
                  disabled={sending || !input.trim()}
                  style={[styles.sendBtn, (sending || !input.trim()) && styles.sendBtnDisabled]}
                >
                  <Text style={styles.sendBtnText}>↑</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </FadeIn>
      </KeyboardAvoidingView>

      <Modal visible={historyVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={50} tint="light" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Previous chats</Text>
              <Pressable hitSlop={8} onPress={() => setHistoryVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            {historyLoading ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: 24 }} />
            ) : sessions.length === 0 ? (
              <Text style={styles.modalEmpty}>No previous chats yet.</Text>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(s) => s.id}
                style={{ maxHeight: 360 }}
                renderItem={({ item, index }) => (
                  <FadeIn delay={Math.min(index, 20) * 30}>
                    <Pressable style={styles.sessionRow} onPress={() => loadSession(item)}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.sessionDate}>{relativeDay(item.updatedAt)}</Text>
                    </Pressable>
                  </FadeIn>
                )}
              />
            )}
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  panelWrap: { flex: 1, marginHorizontal: 12 },
  panel: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  modalClose: { fontSize: 16, color: colors.ink40 },
  modalEmpty: { fontSize: 14, color: colors.ink45, textAlign: 'center', paddingVertical: 24 },
  sessionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink08,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  sessionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.ink },
  sessionDate: { fontSize: 12, color: colors.ink40 },
  list: { padding: 16, paddingBottom: 24, gap: 14 },
  userRow: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: colors.brand,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { color: colors.white, fontSize: 15, lineHeight: 20 },
  assistantBlock: { gap: 6 },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  assistantName: { fontSize: 13, fontWeight: '600', color: colors.ink },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantText: { fontSize: 15, lineHeight: 20, color: colors.ink },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { fontSize: 13, color: colors.ink45 },
  errorText: {
    fontSize: 13,
    color: '#be123c',
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    padding: 10,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
