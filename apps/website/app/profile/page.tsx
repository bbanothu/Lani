'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser, signOut, updateName } from '@/lib/auth';
import { Product, getProducts, subscribeToProducts } from '@/lib/products';
import { getLists, subscribeToLists } from '@/lib/lists';
import BottomNav from '@/components/dashboard/BottomNav';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

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

function topTags(products: Product[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    for (const tag of p.tags || []) {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [favoritedCount, setFavoritedCount] = useState(0);

  useEffect(() => {
    if (!ready || !user) return;
    setName(user.name);
    getProducts().then(setProducts);
    const unsubscribe = subscribeToProducts(() => {
      getProducts().then(setProducts);
    });
    return unsubscribe;
  }, [ready, user]);

  useEffect(() => {
    if (!ready) return;
    const sync = () =>
      getLists().then((lists) =>
        setFavoritedCount(lists.find((l) => l.isFavorites)?.productIds.length ?? 0),
      );
    sync();
    return subscribeToLists(sync);
  }, [ready]);

  const stores = useMemo(() => topStores(products), [products]);
  const tags = useMemo(() => topTags(products), [products]);

  if (!ready || !user) return null;

  async function handleSave() {
    const trimmedName = name.trim() || user!.name;
    await updateName(trimmedName);
    setName(trimmedName);
    setEditing(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <main className="mx-auto max-w-2xl px-4 pb-8 pt-8 sm:px-6">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Profile</h1>

        <section className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
              {initials(user.name)}
            </div>
            {editing ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <p className="px-1 text-sm text-ink/40">{user.email}</p>
              </div>
            ) : (
              <div className="flex-1">
                <p className="text-lg font-semibold text-ink">{user.name}</p>
                <p className="text-sm text-ink/50">{user.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={editing ? handleSave : () => setEditing(true)}
              className="shrink-0 rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5"
            >
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Products', value: products.length },
            { label: 'Saved', value: favoritedCount },
            { label: 'Stores', value: stores.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[20px] border border-ink/8 bg-white p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold tracking-tight text-ink">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink/35">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-4 rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/35">TOP STORES</p>
          {stores.length === 0 ? (
            <p className="mt-3 text-sm text-ink/45">
              Install the Lani extension and browse — your most-visited stores show up here.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {stores.map((store) => (
                <div key={store.domain} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={faviconUrl(store.domain)}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{storeLabel(store.domain)}</span>
                      <span className="text-ink/40">{store.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-ink/[0.06]">
                      <div
                        className="h-1.5 rounded-full bg-brand transition-all"
                        style={{ width: `${store.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/35">STYLE SIGNALS</p>
          {tags.length === 0 ? (
            <p className="mt-3 text-sm text-ink/45">
              Not enough data yet — tags show up here once the extension captures a few more
              products.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t.tag}
                  className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-medium text-ink/60"
                >
                  {t.tag}
                </span>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 text-sm font-medium text-ink/45 transition-colors hover:text-red-500"
        >
          Sign out
        </button>
      </main>

      <BottomNav
        active="profile"
        onSelect={(tab) => {
          if (tab === 'profile') return;
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') router.push('/chat');
          if (tab === 'cart') router.push('/cart');
          if (tab === 'lists') router.push('/lists');
        }}
      />
    </div>
  );
}
