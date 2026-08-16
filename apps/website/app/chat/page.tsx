'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/dashboard/BottomNav';
import { useRequireUser } from '@/lib/auth';
import { getLLMSettings, type ChatMessage } from '@/lib/llm';
import { addToCart } from '@/lib/cart';
import { getProducts, subscribeToProducts, type Product } from '@/lib/products';
import { getLists } from '@/lib/lists';

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

export default function ChatPage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi — I'm Nora. Ask me about products you've saved, deals, or what to buy next.",
    },
  ]);
  const [catalog, setCatalog] = useState<Map<string, Product>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, settings: getLLMSettings() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');

      const parsed = parseAssistantReply(String(data.content || '').trim(), await getProducts());
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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  if (!ready || !user) return null;

  return (
    <div className="h-dvh overflow-hidden bg-cream">
      <main className="mx-auto my-auto grid h-full w-[90%] max-w-[90%] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] px-4 pt-28 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-ink">Chat with Nora</h1>

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
                      N
                    </span>
                    <span className="text-sm font-semibold text-ink">Nora</span>
                  </div>
                  <div className="rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink shadow-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <ChatProductRail products={cards} />
                </div>
              );
            })}

            {sending ? (
              <div className="flex max-w-[92%] flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    N
                  </span>
                  <span className="text-sm font-semibold text-ink">Nora</span>
                </div>
                <div className="rounded-[22px] border border-ink/10 bg-white px-4 py-3 text-sm text-ink/45">
                  Thinking…
                </div>
              </div>
            ) : null}

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
                placeholder="Type a message..."
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/35"
                disabled={sending}
              />
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
    </div>
  );
}
