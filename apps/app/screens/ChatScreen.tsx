import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { sendChat } from '../lib/chat';
import { getLLMSettings, type ChatMessage } from '../lib/llm';
import { getLists } from '../lib/lists';
import type { Tab } from '../lib/nav';
import { getProducts, type Product } from '../lib/products';
import { colors } from '../lib/theme';

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productIds?: string[];
};

const PRODUCTS_TAG = /\[\[products:\s*([^\]]+)\]\]/gi;

function formatProductLine(product: Product, index: number, favoriteIds: Set<string>): string {
  const price = product.price != null ? `${product.currency}${product.price}` : 'price unknown';
  const saved = favoriteIds.has(product.id) ? 'saved' : 'not saved';
  return `${index + 1}. id=${product.id} | ${product.title} | ${price} | ${product.domain} | ${saved} | ${product.url}`;
}

async function buildSystemMessage(): Promise<ChatMessage> {
  const products = await getProducts();
  const lists = await getLists();
  const favoriteIds = new Set(lists.find((l) => l.isFavorites)?.productIds ?? []);
  const catalog =
    products.length === 0
      ? 'The user has no products in their Lani list yet.'
      : `The user has ${products.length} product(s) in their Lani list:\n${products
          .map((p, i) => formatProductLine(p, i, favoriteIds))
          .join('\n')}`;

  return {
    role: 'system',
    content: [
      'You are Nora, a friendly shopping assistant for Lani.',
      'Keep replies concise and helpful. No markdown images. Plain text is fine.',
      'Use the product list below as your primary context when recommending, comparing, or answering.',
      'Prefer items from this list when relevant. If something is missing, say so.',
      'When you recommend or discuss specific products from the list, end your message with exactly one line:',
      '[[products:ID1,ID2]]',
      'Use the product id values from the list. Omit that line if no products apply.',
      '',
      catalog,
    ].join('\n'),
  };
}

function parseAssistantReply(
  raw: string,
  catalog: Product[],
): { content: string; productIds: string[] } {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const ids: string[] = [];

  const content = raw
    .replace(PRODUCTS_TAG, (_, list: string) => {
      for (const part of list.split(/[\s,]+/)) {
        const id = part.trim();
        if (id && byId.has(id) && !ids.includes(id)) ids.push(id);
      }
      return '';
    })
    .trim();

  if (ids.length === 0) {
    const lower = content.toLowerCase();
    for (const product of catalog) {
      const title = product.title.trim();
      if (title.length >= 8 && lower.includes(title.toLowerCase()) && !ids.includes(product.id)) {
        ids.push(product.id);
      }
    }
  }

  return { content: content || '…', productIds: ids };
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
      renderItem={({ item }) => {
        const price = item.price != null ? `$${Number(item.price).toLocaleString()}` : '—';
        return (
          <View style={railStyles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={railStyles.image} />
            ) : (
              <View style={[railStyles.image, railStyles.imagePlaceholder]}>
                <Text style={{ fontSize: 20, opacity: 0.4 }}>🛍️</Text>
              </View>
            )}
            <Text style={railStyles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={railStyles.price}>{price}</Text>
          </View>
        );
      }}
    />
  );
}

const railStyles = StyleSheet.create({
  card: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    padding: 8,
  },
  image: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: colors.ink05 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 6, fontSize: 12, fontWeight: '600', color: colors.ink },
  price: { marginTop: 2, fontSize: 13, fontWeight: '700', color: colors.ink },
});

export default function ChatScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi — I'm Nora. Ask me about products you've saved, deals, or what to buy next.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Map<string, Product>>(new Map());
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
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const history: ChatMessage[] = [
        await buildSystemMessage(),
        ...next.map((m) => ({ role: m.role, content: m.content })),
      ];
      const settings = await getLLMSettings();
      const reply = await sendChat(history, settings);
      const parsed = parseAssistantReply(reply.trim(), await getProducts());
      setMessages((current) => [
        ...current,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: parsed.content,
          productIds: parsed.productIds,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Chat with Nora</Text>

        <FlatList
          ref={listRef}
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
                    <Text style={styles.avatarText}>N</Text>
                  </View>
                  <Text style={styles.assistantName}>Nora</Text>
                </View>
                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantText}>{item.content}</Text>
                </View>
                <ProductRail products={cards} />
              </View>
            );
          }}
          ListFooterComponent={
            sending ? (
              <View style={styles.assistantBlock}>
                <View style={styles.assistantHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>N</Text>
                  </View>
                  <Text style={styles.assistantName}>Nora</Text>
                </View>
                <View style={styles.thinkingBubble}>
                  <ActivityIndicator size="small" color={colors.ink40} />
                  <Text style={styles.thinkingText}>Thinking…</Text>
                </View>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null
          }
        />

        <View style={styles.inputBar}>
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
      </KeyboardAvoidingView>

      <BottomNav active="chat" onSelect={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
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
    maxWidth: '92%',
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantText: { fontSize: 15, lineHeight: 20, color: colors.ink },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  thinkingText: { fontSize: 13, color: colors.ink45 },
  errorText: {
    fontSize: 13,
    color: '#be123c',
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    padding: 10,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
