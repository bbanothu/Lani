'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/dashboard/BottomNav';
import { useRequireUser } from '@/lib/auth';
import {
  createList,
  deleteList,
  getLists,
  isFavoritesList,
  subscribeToLists,
  updateList,
  type ListVisibility,
  type ProductList,
} from '@/lib/lists';
import { popups } from '@/lib/popups';
import { getProducts, type Product } from '@/lib/products';

const FILTERS: { id: 'all' | ListVisibility; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'private', label: 'Private' },
  { id: 'shared', label: 'Shared' },
  { id: 'public', label: 'Public' },
];

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
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink/60"
    >
      {children}
    </button>
  );
}

function ListCard({
  list,
  products,
  index = 0,
  onEdit,
  onShare,
  onDelete,
}: {
  list: ProductList;
  products: Product[];
  index?: number;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const pinned = isFavoritesList(list);
  const filled = list.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);
  const thumbs: (Product | null)[] = [0, 1, 2, 3].map((i) => filled[i] ?? null);

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
      className="animate-fade-in flex flex-col rounded-[28px] border border-ink/8 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-ink">{list.title}</h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink/40">
            {list.description || 'No description'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn label="Edit" onClick={onEdit}>
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
          <IconBtn label="Share" onClick={onShare}>
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
            <IconBtn label="Delete" onClick={onDelete}>
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

      <span
        className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${VISIBILITY_STYLE[list.visibility]}`}
      >
        {list.visibility}
      </span>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {thumbs.map((product, i) => (
          <div
            key={`${list.id}_thumb_${i}`}
            className="aspect-square overflow-hidden rounded-2xl bg-[#F3F3F1]"
          >
            {product?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="h-full w-full object-cover" />
            ) : product ? (
              <div className="flex h-full items-center justify-center p-2 text-center text-[10px] font-medium text-ink/35">
                {product.title.slice(0, 40)}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-ink/15">+</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink/45">
          {list.productIds.length} item{list.productIds.length === 1 ? '' : 's'}
        </p>
        <Link
          href={`/lists/${list.id}`}
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          View all →
        </Link>
      </div>
    </article>
  );
}

export default function ListsPage() {
  const router = useRouter();
  const { user, ready } = useRequireUser();
  const [lists, setLists] = useState<ProductList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ListVisibility>('all');

  useEffect(() => {
    if (!ready) return;
    const sync = () => {
      getLists().then((l) => {
        setLists(l);
        setLoading(false);
      });
      getProducts().then(setProducts);
    };
    sync();
    return subscribeToLists(sync);
  }, [ready]);

  const visible = useMemo(
    () => (filter === 'all' ? lists : lists.filter((l) => l.visibility === filter)),
    [lists, filter],
  );

  async function handleNewList() {
    const title = await popups.prompt({
      title: 'New list',
      message: 'What should this list be called?',
      placeholder: 'List name',
    });
    if (!title?.trim()) return;
    const description =
      (await popups.prompt({
        title: 'Description',
        message: 'Optional description for this list',
        placeholder: 'Description (optional)',
      })) || '';
    await createList({ title, description, visibility: 'private' });
    setLists(await getLists());
  }

  async function handleEdit(list: ProductList) {
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
    setLists(await getLists());
  }

  async function handleShare(list: ProductList) {
    const next: ListVisibility =
      list.visibility === 'private'
        ? 'shared'
        : list.visibility === 'shared'
          ? 'public'
          : 'private';
    await updateList(list.id, { visibility: next });
    setLists(await getLists());
  }

  async function handleDelete(list: ProductList) {
    const ok = await popups.confirm({
      title: 'Delete list',
      message: `Delete “${list.title}”? This can’t be undone.`,
      okLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await deleteList(list.id);
    setLists(await getLists());
  }

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen bg-cream pb-28">
      <main className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your Lists</h1>
            <p className="mt-1 text-sm text-ink/45">Organize your products into collections</p>
          </div>
          <button
            type="button"
            onClick={handleNewList}
            className="rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
          >
            + New List
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((chip) => {
            const active = filter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand text-white'
                    : 'border border-ink/10 bg-white text-ink/50 hover:border-ink/20 hover:text-ink/70'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-brand" />
            <p className="text-sm text-ink/45">Loading your lists…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-ink/8 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-ink">No lists yet</p>
            <p className="mt-2 text-sm text-ink/45">
              Create a list, then tap the list icon on any product card to add it.
            </p>
            <button
              type="button"
              onClick={handleNewList}
              className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              + New List
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((list, i) => (
              <ListCard
                key={list.id}
                list={list}
                products={products}
                index={i}
                onEdit={() => handleEdit(list)}
                onShare={() => handleShare(list)}
                onDelete={() => handleDelete(list)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav
        active="lists"
        onSelect={(tab) => {
          if (tab === 'lists') return;
          if (tab === 'home') router.push('/dashboard');
          if (tab === 'chat') router.push('/chat');
          if (tab === 'cart') router.push('/cart');
          if (tab === 'profile') router.push('/profile');
        }}
      />
    </div>
  );
}
