'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/lib/auth';
import { Product, getProducts, subscribeToProducts } from '@/lib/products';
import { popups } from '@/lib/popups';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import QuickFilters, { type FilterChip } from '@/components/dashboard/QuickFilters';
import RetailerRail from '@/components/dashboard/RetailerRail';
import BottomNav from '@/components/dashboard/BottomNav';

const STOP = new Set([
  'with',
  'from',
  'that',
  'this',
  'your',
  'into',
  'over',
  'under',
  'and',
  'the',
  'for',
  'set',
]);

function buildFilterChips(products: Product[]): FilterChip[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const words = product.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w));
    for (const word of words.slice(0, 4)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([key, count]) => ({ key, label: key, count }));
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set());
  const [retailer, setRetailer] = useState<string | null>(null);
  const [customChips, setCustomChips] = useState<FilterChip[]>([]);

  useEffect(() => {
    if (!ready) return;
    getProducts().then(setProducts);
    const unsubscribe = subscribeToProducts(() => {
      getProducts().then(setProducts);
    });
    return unsubscribe;
  }, [ready]);

  const domains = useMemo(() => {
    const set = new Set(products.map((p) => p.domain).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const chips = useMemo(() => {
    const auto = buildFilterChips(products);
    const keys = new Set(auto.map((c) => c.key));
    return [...auto, ...customChips.filter((c) => !keys.has(c.key))];
  }, [products, customChips]);

  const visible = useMemo(() => {
    return products.filter((product) => {
      if (retailer && product.domain !== retailer) return false;
      if (activeFilters.size === 0) return true;
      const hay = product.title.toLowerCase();
      return [...activeFilters].every((key) => hay.includes(key));
    });
  }, [products, retailer, activeFilters]);

  if (!ready || !user) return null;

  const firstName = user.name.trim().split(/\s+/)[0] || 'there';

  function toggleFilter(key: string) {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleAddFilter() {
    const raw = await popups.prompt({
      title: 'Add filter',
      message: 'Add a quick filter keyword',
      placeholder: 'e.g. coat',
    });
    const key = raw?.trim().toLowerCase();
    if (!key) return;
    const count = products.filter((p) => p.title.toLowerCase().includes(key)).length;
    setCustomChips((current) =>
      current.some((c) => c.key === key) ? current : [...current, { key, label: key, count }],
    );
    setActiveFilters((current) => new Set(current).add(key));
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <RetailerRail domains={domains} selected={retailer} onSelect={setRetailer} />

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-8 md:pl-20">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Lani" className="h-12 w-12 rounded-md" />
          <span className="text-2xl font-bold tracking-tight text-ink">Lani</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Hey, {firstName}</h1>

        <div className="mt-5">
          <QuickFilters
            chips={chips}
            active={activeFilters}
            onToggle={toggleFilter}
            onAdd={handleAddFilter}
          />
        </div>

        {visible.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title={products.length === 0 ? 'No products yet' : 'No matches'}
              message={
                products.length === 0
                  ? 'Install the Lani extension and browse — product pages you visit show up here automatically.'
                  : 'Try clearing a filter or picking another retailer.'
              }
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onDeleted={() => setProducts((current) => current.filter((x) => x.id !== p.id))}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav
        active="home"
        onSelect={(tab) => {
          if (tab === 'home') return;
          if (tab === 'chat') router.push('/chat');
          if (tab === 'cart') router.push('/cart');
          if (tab === 'lists') router.push('/lists');
          if (tab === 'profile') router.push('/profile');
        }}
      />
    </div>
  );
}
