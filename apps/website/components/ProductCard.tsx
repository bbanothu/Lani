'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addToCart, isInCart, removeFromCart, subscribeToCart } from '@/lib/cart';
import { isProductFavorited, subscribeToLists, toggleFavorite } from '@/lib/lists';
import { popups } from '@/lib/popups';
import { Product, removeProduct } from '@/lib/products';

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function retailerLabel(domain: string): string {
  return domain.replace(/^www\./, '').replace(/\.(com|net|org|co|io).*$/i, '');
}

function hintTags(product: Product): string[] {
  const words = product.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);
  return words.length ? words : [retailerLabel(product.domain)];
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
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        active ? 'bg-brand text-white' : 'text-ink/40 hover:bg-ink/5 hover:text-ink/70'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const tags = hintTags(product);
  const price = product.price != null ? `$${Number(product.price).toLocaleString()}` : '—';
  const [inCart, setInCart] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    const sync = () => isInCart(product.id).then(setInCart);
    sync();
    return subscribeToCart(sync);
  }, [product.id]);

  useEffect(() => {
    const sync = () => isProductFavorited(product.id).then(setFavorited);
    sync();
    return subscribeToLists(sync);
  }, [product.id]);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_1px_3px_rgba(28,27,26,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(28,27,26,0.08)]">
      <div className="flex items-center justify-between px-3.5 pt-3 text-[11px] text-ink/40">
        <span className="truncate font-medium lowercase">{retailerLabel(product.domain)}</span>
        <span className="shrink-0">{relativeTime(product.addedAt)}</span>
      </div>

      <Link
        href={`/product/${product.id}`}
        className="mx-3 mt-2 block overflow-hidden rounded-xl bg-ink/[0.03]"
      >
        <div className="aspect-[4/3] flex items-center justify-center">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl opacity-40">🛍️</span>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between gap-1 px-2.5 py-2">
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
        <IconButton label="Price trend" onClick={() => router.push(`/product/${product.id}`)}>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M4 19V5M4 19h16M8 15l3-4 3 2 5-7"
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
        <IconButton label="Delete" onClick={() => removeProduct(product.id)}>
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

      <div className="px-3.5 pb-3.5">
        <Link href={`/product/${product.id}`}>
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink hover:underline">
            {product.title}
          </p>
        </Link>
        <p className="mt-1 text-base font-bold text-ink">{price}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-medium text-ink/45"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
