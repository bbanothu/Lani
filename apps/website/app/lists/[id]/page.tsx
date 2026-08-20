'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/dashboard/BottomNav';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { useRequireUser } from '@/lib/auth';
import {
  deleteList,
  getList,
  isFavoritesList,
  subscribeToLists,
  updateList,
  type ListVisibility,
  type ProductList,
} from '@/lib/lists';
import { popups } from '@/lib/popups';
import { getProducts, type Product } from '@/lib/products';

const VISIBILITY_STYLE: Record<ListVisibility, string> = {
  private: 'bg-sky-100 text-sky-700',
  shared: 'bg-violet-100 text-violet-700',
  public: 'bg-emerald-100 text-emerald-700',
};

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink/60"
    >
      {children}
    </button>
  );
}

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [list, setList] = useState<ProductList | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const sync = () => {
      getList(params.id).then((l) => {
        setList(l);
        setLoading(false);
      });
      getProducts().then(setProducts);
    };
    sync();
    return subscribeToLists(sync);
  }, [ready, params.id]);

  const items = useMemo(() => {
    if (!list) return [];
    return list.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [list, products]);

  async function handleEdit() {
    if (!list) return;
    const title = await popups.prompt({
      title: 'Edit list',
      message: 'List name',
      defaultValue: list.title,
    });
    if (title == null) return;
    const description = await popups.prompt({
      title: 'Edit list',
      message: 'Description',
      defaultValue: list.description,
      placeholder: 'Description',
    });
    await updateList(list.id, {
      title: title.trim() || list.title,
      description: description ?? list.description,
    });
    setList(await getList(list.id));
  }

  async function handleShare() {
    if (!list) return;
    const next: ListVisibility =
      list.visibility === 'private'
        ? 'shared'
        : list.visibility === 'shared'
          ? 'public'
          : 'private';
    await updateList(list.id, { visibility: next });
    setList(await getList(list.id));
  }

  async function handleDelete() {
    if (!list) return;
    const ok = await popups.confirm({
      title: 'Delete list',
      message: `Delete "${list.title}"? This can't be undone.`,
      okLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await deleteList(list.id);
    router.push('/lists');
  }

  if (!ready || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream pb-28">
        <main className="mx-auto max-w-2xl px-4 pb-8 pt-8 text-center sm:px-6">
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand" />
            <p className="text-sm text-ink/45">Loading list…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-cream pb-28">
        <main className="mx-auto max-w-2xl px-4 pb-8 pt-8 text-center sm:px-6">
          <p className="text-lg font-semibold text-ink">List not found</p>
          <p className="mt-2 text-sm text-ink/45">It may have been deleted.</p>
          <button
            type="button"
            onClick={() => router.push('/lists')}
            className="mt-6 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to lists
          </button>
        </main>
        <BottomNav
          active="lists"
          onSelect={(tab) => {
            if (tab === 'lists') router.push('/lists');
            if (tab === 'home') router.push('/dashboard');
            if (tab === 'chat') router.push('/chat');
            if (tab === 'cart') router.push('/cart');
            if (tab === 'profile') router.push('/profile');
          }}
        />
      </div>
    );
  }

  const pinned = isFavoritesList(list);

  return (
    <div className="min-h-screen bg-cream pb-28">
      <main className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/lists')}
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
          All lists
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{list.title}</h1>
            <p className="mt-1 text-sm text-ink/45">{list.description || 'No description'}</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${VISIBILITY_STYLE[list.visibility]}`}
              >
                {list.visibility}
              </span>
              <span className="text-sm text-ink/40">
                {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <IconBtn label="Edit" onClick={handleEdit}>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconBtn>
            <IconBtn label="Share" onClick={handleShare}>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconBtn>
            {!pinned && (
              <IconBtn label="Delete" onClick={handleDelete}>
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
              </IconBtn>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Nothing here yet"
              message="Tap the list icon on any product card and add it to this list."
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onDeleted={() =>
                  setProducts((current) => current.filter((x) => x.id !== product.id))
                }
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav
        active="lists"
        onSelect={(tab) => {
          if (tab === 'lists') router.push('/lists');
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') router.push('/chat');
          if (tab === 'cart') router.push('/cart');
          if (tab === 'profile') router.push('/profile');
        }}
      />
    </div>
  );
}
