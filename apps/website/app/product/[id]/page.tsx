'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/lib/auth';
import { Product, getProduct, removeProduct } from '@/lib/products';
import { addToCart, isInCart, removeFromCart, subscribeToCart } from '@/lib/cart';
import { isProductFavorited, subscribeToLists, toggleFavorite } from '@/lib/lists';
import { popups } from '@/lib/popups';
import BottomNav from '@/components/dashboard/BottomNav';

// Deterministic 0..1 value from a string, so the mock price/history numbers
// below stay stable across renders instead of jumping around every reload.
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ((h >>> 0) % 10000) / 10000;
}

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

const OTHER_STORES = ['amazon.com', 'walmart.com', 'target.com', 'ebay.com', 'bestbuy.com'];

function mockStoreComparison(
  product: Product,
): { domain: string; price: number; isCurrent: boolean }[] {
  const base = product.price ?? 50;
  const current = { domain: product.domain, price: base, isCurrent: true };
  const currentLabel = storeLabel(product.domain);
  const others = OTHER_STORES.filter((d) => storeLabel(d) !== currentLabel)
    .slice(0, 2)
    .map((domain, i) => {
      const swing = 0.85 + seededRandom(product.id + domain + i) * 0.3; // 0.85x - 1.15x
      return { domain, price: Math.round(base * swing * 100) / 100, isCurrent: false };
    });
  return [current, ...others].sort((a, b) => a.price - b.price);
}

function mockPriceHistory(product: Product): { label: string; price: number }[] {
  const base = product.price ?? 50;
  const points = ['30d ago', '14d ago', '7d ago', 'Today'];
  return points.map((label, i) => {
    if (label === 'Today') return { label, price: base };
    const swing = 1 + (seededRandom(product.id + label) - 0.3) * 0.25;
    return { label, price: Math.round(base * swing * 100) / 100 };
  });
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        active ? 'bg-brand text-white' : 'text-ink/40 hover:bg-ink/5 hover:text-ink/70'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [product, setProduct] = useState<Product | null>(null);
  const [inCart, setInCart] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!ready) return;
    getProduct(params.id).then(setProduct);
  }, [ready, params.id]);

  useEffect(() => {
    if (!product) return;
    const sync = () => isInCart(product.id).then(setInCart);
    sync();
    return subscribeToCart(sync);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const sync = () => isProductFavorited(product.id).then(setFavorited);
    sync();
    return subscribeToLists(sync);
  }, [product]);

  if (!ready || !user) return null;

  if (!product) {
    return (
      <div className="min-h-screen bg-cream pb-28">
        <main className="mx-auto max-w-2xl px-4 pb-8 pt-8 text-center sm:px-6">
          <p className="text-lg font-semibold text-ink">Product not found</p>
          <p className="mt-2 text-sm text-ink/45">
            It may have been removed. Head back and pick another one.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-6 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to dashboard
          </button>
        </main>
        <BottomNav
          active="home"
          onSelect={(tab) => {
            if (tab === 'home') router.push('/dashboard');
            if (tab === 'chat') router.push('/chat');
            if (tab === 'cart') router.push('/cart');
            if (tab === 'lists') router.push('/lists');
            if (tab === 'profile') router.push('/profile');
          }}
        />
      </div>
    );
  }

  const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
  const stores = mockStoreComparison(product);
  const history = mockPriceHistory(product);
  const maxHistoryPrice = Math.max(...history.map((h) => h.price), 1);
  const tags = product.tags?.length ? product.tags : [storeLabel(product.domain)];

  return (
    <div className="min-h-screen bg-cream pb-28">
      <main className="mx-auto max-w-4xl px-4 pb-8 pt-8 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <div className="aspect-[4/3] overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-sm flex items-center justify-center">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl opacity-40">🛍️</span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-1 px-1">
              <IconButton
                label="Open"
                onClick={() => window.open(product.url, '_blank', 'noopener,noreferrer')}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M14 3h7v7M10 14L21 3M21 14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <IconButton
                label={favorited ? 'Unsave' : 'Save'}
                active={favorited}
                onClick={() => toggleFavorite(product.id)}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill={favorited ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 000-7.8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <IconButton
                label={inCart ? 'In cart' : 'Add to cart'}
                active={inCart}
                onClick={() => (inCart ? removeFromCart(product.id) : addToCart(product))}
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
              </IconButton>
              <IconButton
                label="Add to list"
                onClick={() => popups.listPicker({ productId: product.id })}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
              <IconButton
                label="Delete"
                onClick={() => {
                  removeProduct(product.id);
                  router.push('/dashboard');
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M3 6h18M8 6V4h8v2M9 10v8M15 10v8M6 6l1 14h10l1-14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </IconButton>
            </div>

            <div className="mt-4 px-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink/35">
                {storeLabel(product.domain)}
              </p>
              <h1 className="mt-1 text-xl font-bold text-ink">{product.title}</h1>
              <p className="mt-1 text-2xl font-bold text-ink">{price}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-medium text-ink/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/35">
                PRICE ACROSS STORES
              </p>
              <div className="mt-4 space-y-3">
                {stores.map((store) => (
                  <div key={store.domain} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(store.domain)}&sz=64`}
                        alt=""
                        className="h-4 w-4 rounded-sm"
                      />
                      <span
                        className={`font-medium ${store.isCurrent ? 'text-ink' : 'text-ink/60'}`}
                      >
                        {storeLabel(store.domain)}
                        {store.isCurrent && (
                          <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                            this page
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-semibold text-ink">${store.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink/35">
                Estimated for demo purposes — not live pricing.
              </p>
            </div>

            <div className="rounded-[28px] border border-ink/8 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/35">
                PRICE HISTORY
              </p>
              <div className="mt-5 flex items-end justify-between gap-3">
                {history.map((point, i) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end justify-center">
                      <div
                        className={`w-6 rounded-full transition-all ${
                          i === history.length - 1 ? 'bg-brand' : 'bg-ink/10'
                        }`}
                        style={{ height: `${Math.max(8, (point.price / maxHistoryPrice) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-ink">
                      ${point.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-ink/35">{point.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <BottomNav
        active="home"
        onSelect={(tab) => {
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') router.push('/chat');
          if (tab === 'cart') router.push('/cart');
          if (tab === 'lists') router.push('/lists');
          if (tab === 'profile') router.push('/profile');
        }}
      />
    </div>
  );
}
