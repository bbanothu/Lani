'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/dashboard/BottomNav';
import { useRequireUser } from '@/lib/auth';
import { getLLMSettings, type ChatMessage } from '@/lib/llm';
import { addToCart, removeFromCart } from '@/lib/cart';
import { getProducts, subscribeToProducts, type Product } from '@/lib/products';
import { addProductToList, getLists, removeProductFromList, type ProductList } from '@/lib/lists';
import {
  addChatMessage,
  createChatSession,
  getChatMessages,
  getChatSessions,
  titleFromMessage,
  type ChatSession,
} from '@/lib/chat-history';

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

function ChatProductRail({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {products.map((product) => {
        const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
        return (
          <div
            key={product.id}
            className="relative w-[148px] shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm"
          >
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="block">
              <div className="aspect-square bg-ink/[0.03]">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl opacity-40">
                    🛍️
                  </div>
                )}
              </div>
              <div className="space-y-1 px-2.5 py-2">
                <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-ink">
                  {product.title}
                </p>
                <p className="text-sm font-bold text-ink">{price}</p>
              </div>
            </a>
            <button
              type="button"
              aria-label="Add to cart"
              onClick={() => addToCart(product)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-brand hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

const WELCOME_MESSAGE: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi — I'm Lani. Ask me about products you've saved, deals, or what to buy next.",
};

export default function ChatPage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME_MESSAGE]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Map<string, Product>>(new Map());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }

  useEffect(() => {
    if (!ready) return;
    const sync = () => getProducts().then((p) => setCatalog(new Map(p.map((x) => [x.id, x]))));
    sync();
    return subscribeToProducts(sync);
  }, [ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: UiMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, settings: getLLMSettings() }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Chat failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed2 = line.trim();
          if (!trimmed2.startsWith('data:')) continue;
          try {
            const { delta } = JSON.parse(trimmed2.slice(5).trim());
            if (delta) {
              full += delta;
              const display = stripActionTags(full);
              if (display) {
                setMessages((current) =>
                  current.map((m) => (m.id === assistantId ? { ...m, content: display } : m)),
                );
              }
            }
          } catch {}
        }
      }

      const parsed = parseAssistantReply(full.trim(), catalog, lists);
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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function startNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(null);
    setError(null);
  }

  async function openHistory() {
    setHistoryOpen(true);
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
    setHistoryOpen(false);
  }

  if (!ready || !user) return null;

  return (
    <div className="h-dvh overflow-hidden bg-cream">
      <main className="mx-auto my-auto grid h-full w-[90%] max-w-[90%] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] px-4 pt-28 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Chat with Lani</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openHistory}
              aria-label="Previous chats"
              title="Previous chats"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60 shadow-sm transition-colors hover:text-ink"
            >
              🕘
            </button>
            <button
              type="button"
              onClick={startNewChat}
              aria-label="New chat"
              title="New chat"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60 shadow-sm transition-colors hover:text-ink"
            >
              ✚
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-[#F3F3F1]">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.map((message) => {
              if (message.role === 'user') {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-[22px] bg-brand px-4 py-3 text-[15px] leading-relaxed text-white shadow-sm">
                      {message.content}
                    </div>
                  </div>
                );
              }

              const cards = (message.productIds || [])
                .map((id) => catalog.get(id))
                .filter((p): p is Product => Boolean(p));

              return (
                <div key={message.id} className="flex max-w-[92%] flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      L
                    </span>
                    <span className="text-sm font-semibold text-ink">Lani</span>
                  </div>
                  <div className="rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-sm whitespace-pre-wrap">
                    {message.content || <span className="text-ink/45">Thinking…</span>}
                  </div>
                  <ChatProductRail products={cards} />
                </div>
              );
            })}

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="border-t border-ink/5 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white py-1.5 pl-5 pr-1.5 shadow-sm">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? 'Listening…' : 'Type a message...'}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/35"
                disabled={sending}
              />
              <button
                type="button"
                onClick={toggleListening}
                disabled={sending}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  listening ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {listening ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>

      <BottomNav
        active="chat"
        onSelect={(tab) => {
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') return;
          if (tab === 'cart') router.push('/cart');
          if (tab === 'lists') router.push('/lists');
          if (tab === 'profile') router.push('/profile');
        }}
      />

      {historyOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold text-ink">Previous chats</p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close"
                className="text-ink/40 hover:text-ink/70"
              >
                ✕
              </button>
            </div>
            {historyLoading ? (
              <p className="py-6 text-center text-sm text-ink/45">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink/45">No previous chats yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => loadSession(session)}
                    className="flex w-full items-center justify-between gap-3 border-b border-ink/5 py-3 text-left last:border-b-0"
                  >
                    <span className="truncate text-sm font-semibold text-ink">{session.title}</span>
                    <span className="shrink-0 text-xs text-ink/40">
                      {relativeDay(session.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
