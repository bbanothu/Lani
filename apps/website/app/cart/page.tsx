'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/dashboard/BottomNav';
import { useRequireUser } from '@/lib/auth';
import { clearCart, getCart, openProductTabs, removeFromCart, subscribeToCart } from '@/lib/cart';
import { popups } from '@/lib/popups';
import type { Product } from '@/lib/products';

function money(n: number | null): string {
  if (n == null) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function groupByStore(items: Product[]): { store: string; domain: string; items: Product[] }[] {
  const map = new Map<string, Product[]>();
  for (const item of items) {
    const key = item.domain || 'other';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()].map(([domain, groupItems]) => ({
    domain,
    store: storeLabel(domain),
    items: groupItems,
  }));
}

export default function CartPage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!ready) return;
    const sync = () =>
      getCart().then((c) => {
        setItems(c);
        setLoading(false);
      });
    sync();
    return subscribeToCart(sync);
  }, [ready]);

  const groups = useMemo(() => groupByStore(items), [items]);

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.price ?? 0), 0), [items]);
  const priced = items.filter((i) => i.price != null);
  const average = priced.length
    ? priced.reduce((sum, item) => sum + (item.price as number), 0) / priced.length
    : null;

  const topStore = useMemo(() => {
    if (!groups.length) return '—';
    return [...groups].sort(
      (a, b) =>
        b.items.reduce((s, i) => s + (i.price ?? 0), 0) -
        a.items.reduce((s, i) => s + (i.price ?? 0), 0),
    )[0].store;
  }, [groups]);

  const newest = items[0] ? relativeDay(items[0].addedAt) : '—';

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-cream pb-28">
      <main className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Universal Shopping Cart
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/35">
                CART OVERVIEW
              </p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-ink">{money(total)}</p>
              <p className="mt-1 text-sm text-ink/45">
                across {items.length} item{items.length === 1 ? '' : 's'} in {groups.length} store
                {groups.length === 1 ? '' : 's'}
              </p>

              <dl className="mt-6 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/45">Average item</dt>
                  <dd className="font-semibold text-ink">{money(average)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/45">Top store</dt>
                  <dd className="font-semibold text-ink">{topStore}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink/45">Newest item</dt>
                  <dd className="font-semibold text-ink">{newest}</dd>
                </div>
              </dl>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.03]"
                >
                  Help me decide
                </button>
                <button
                  type="button"
                  disabled={!items.length}
                  onClick={() => {
                    const result = openProductTabs(items.map((item) => item.url));
                    if (result.via !== 'extension') {
                      void popups.alert({
                        title: 'Open tabs',
                        message:
                          'Allow popups for this site, or keep the Lani extension enabled — it can open every cart tab.',
                      });
                    }
                  }}
                  className="w-full rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Open all product pages
                </button>
                <button
                  type="button"
                  disabled={!items.length}
                  onClick={() => clearCart()}
                  className="w-full py-2 text-sm font-medium text-ink/40 transition-colors hover:text-ink/70 disabled:opacity-40"
                >
                  Clear cart
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
              <p className="text-[15px] font-semibold text-ink">Need a second opinion?</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/45">
                Share your cart with a friend to get instant feedback.
              </p>
              <button
                type="button"
                onClick={() => {
                  const text = items
                    .map((i) => `${i.title} — ${money(i.price)} — ${i.url}`)
                    .join('\n');
                  void navigator.clipboard?.writeText(text || 'My Lani cart is empty');
                }}
                className="mt-5 w-full rounded-2xl bg-ink/[0.06] px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
              >
                Share
              </button>
            </section>
          </aside>

          <section className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand" />
                <p className="text-sm text-ink/45">Loading your cart…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[28px] border border-ink/8 bg-white px-6 py-16 text-center shadow-sm">
                <p className="text-lg font-semibold text-ink">Your cart is empty</p>
                <p className="mt-2 text-sm text-ink/45">
                  Tap the cart icon on any product card to add it here.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="mt-6 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Browse products
                </button>
              </div>
            ) : (
              groups.map((group, groupIndex) => {
                const subtotal = group.items.reduce((sum, item) => sum + (item.price ?? 0), 0);
                const isCollapsed = collapsed.has(group.domain);
                return (
                  <div
                    key={group.domain}
                    style={{ animationDelay: `${Math.min(groupIndex, 20) * 60}ms` }}
                    className="animate-fade-in overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.domain)) next.delete(group.domain);
                          else next.add(group.domain);
                          return next;
                        })
                      }
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="text-base font-bold lowercase text-ink">
                        {group.store}
                        <span className="ml-2 font-medium text-ink/35">· {group.items.length}</span>
                      </span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                        Subtotal {money(subtotal)}
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-ink/35 transition-transform ${
                            isCollapsed ? '-rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>

                    {!isCollapsed ? (
                      <div className="space-y-3 px-4 pb-4">
                        {group.items.map((item, itemIndex) => (
                          <article
                            key={item.id}
                            style={{ animationDelay: `${Math.min(itemIndex, 20) * 40}ms` }}
                            className="animate-fade-in flex items-center gap-4 rounded-2xl bg-[#F3F3F1] px-3 py-3"
                          >
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white"
                            >
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl opacity-40">
                                  🛍️
                                </div>
                              )}
                            </a>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-semibold text-ink">
                                {item.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-sm text-ink/40">
                                {storeLabel(item.domain)} · saved from your Lani list
                              </p>
                              <p className="mt-1 text-xs text-ink/35">
                                {relativeDay(item.addedAt)}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                              <p className="text-[15px] font-bold text-ink">{money(item.price)}</p>
                              <div className="flex items-center gap-3 text-sm font-semibold">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand hover:text-brand-dark"
                                >
                                  Visit
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-ink/35 hover:text-ink/60"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </section>
        </div>
      </main>

      <BottomNav
        active="cart"
        onSelect={(tab) => {
          if (tab === 'cart') return;
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') router.push('/chat');
          if (tab === 'lists') router.push('/lists');
          if (tab === 'profile') router.push('/profile');
        }}
      />
    </div>
  );
}
