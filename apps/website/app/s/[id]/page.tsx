'use client';

import { useEffect, useState } from 'react';
import { getList, type ProductList } from '@/lib/lists';
import { getProductsByIds, type Product } from '@/lib/products';

const VISIBILITY_STYLE: Record<string, string> = {
  shared: 'bg-violet-100 text-violet-700',
  public: 'bg-emerald-100 text-emerald-700',
};

function storeLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

function ReadOnlyProductCard({ product }: { product: Product }) {
  const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_1px_3px_rgba(28,27,26,0.04)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(28,27,26,0.08)]"
    >
      <div className="mx-3 mt-3 overflow-hidden rounded-xl bg-ink/[0.03]">
        <div className="flex aspect-[4/3] items-center justify-center">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl opacity-40">🛍️</span>
          )}
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="text-[11px] font-medium lowercase text-ink/40">
          {storeLabel(product.domain)}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
          {product.title}
        </p>
        <p className="mt-1 text-base font-bold text-ink">{price}</p>
      </div>
    </a>
  );
}

export default function SharedListPage({ params }: { params: { id: string } }) {
  const [list, setList] = useState<ProductList | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getList(params.id)
      .then((l) => {
        setList(l);
        if (l) return getProductsByIds(l.productIds).then(setProducts);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="min-h-screen bg-cream pb-16">
      <header className="border-b border-ink/8 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Lani" className="h-10 w-10 rounded-md" />
          <span className="text-xl font-bold tracking-tight text-ink">Lani</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand" />
            <p className="text-sm text-ink/45">Loading list…</p>
          </div>
        ) : !list ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-ink">List not found</p>
            <p className="mt-2 text-sm text-ink/45">
              It may be private, or the link is no longer valid.
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{list.title}</h1>
            <p className="mt-1 text-sm text-ink/45">{list.description || 'No description'}</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${VISIBILITY_STYLE[list.visibility] || 'bg-ink/[0.06] text-ink/50'}`}
              >
                {list.visibility}
              </span>
              <span className="text-sm text-ink/40">
                {products.length} item{products.length === 1 ? '' : 's'}
              </span>
            </div>

            {products.length === 0 ? (
              <p className="mt-10 text-center text-sm text-ink/45">This list is empty.</p>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((product, i) => (
                  <div
                    key={product.id}
                    style={{ animationDelay: `${Math.min(i, 20) * 40}ms` }}
                    className="animate-fade-in"
                  >
                    <ReadOnlyProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
