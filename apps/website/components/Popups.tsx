'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import {
  registerPopupHandler,
  type PopupAlertOpts,
  type PopupConfirmOpts,
  type PopupPromptOpts,
  type PopupListPickerOpts,
  type PopupDeleteChoiceOpts,
  type DeleteChoice,
  type PopupShareOpts,
} from '@/lib/popups';
import {
  addProductToList,
  createList,
  getList,
  getLists,
  removeProductFromList,
  subscribeToLists,
  updateList,
  type ProductList,
} from '@/lib/lists';
import { addListShare, getListShares, removeListShare, type ListShare } from '@/lib/list-shares';

type Active =
  | { kind: 'alert'; opts: PopupAlertOpts; resolve: () => void }
  | { kind: 'confirm'; opts: PopupConfirmOpts; resolve: (value: boolean) => void }
  | { kind: 'prompt'; opts: PopupPromptOpts; resolve: (value: string | null) => void }
  | { kind: 'listPicker'; opts: PopupListPickerOpts; resolve: () => void }
  | { kind: 'deleteChoice'; opts: PopupDeleteChoiceOpts; resolve: (value: DeleteChoice) => void }
  | { kind: 'share'; opts: PopupShareOpts; resolve: () => void };

export default function Popups() {
  const [active, setActive] = useState<Active | null>(null);
  const [value, setValue] = useState('');
  const [pickerLists, setPickerLists] = useState<ProductList[]>([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [shares, setShares] = useState<ListShare[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const queueRef = useRef<Active[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    return registerPopupHandler((request) => {
      setActive((current) => {
        if (current) {
          queueRef.current.push(request);
          return current;
        }
        if (request.kind === 'prompt') setValue(request.opts.defaultValue ?? '');
        return request;
      });
    });
  }, []);

  useEffect(() => {
    if (!active || active.kind !== 'listPicker') {
      setPickerLists([]);
      return;
    }
    setNewListTitle('');
    const sync = () => getLists().then(setPickerLists);
    sync();
    return subscribeToLists(sync);
  }, [active]);

  useEffect(() => {
    if (!active || active.kind !== 'share') {
      setShares([]);
      return;
    }
    setShareEmail('');
    setCopied(false);
    const { listId } = active.opts;
    getList(listId).then((list) => {
      if (list && list.visibility === 'private') updateList(listId, { visibility: 'shared' });
    });
    getListShares(listId).then(setShares);
  }, [active]);

  function dismiss() {
    if (!active) return;
    if (active.kind === 'alert') finish();
    else if (active.kind === 'confirm') finish(false);
    else if (active.kind === 'listPicker') finish();
    else finish(null);
  }

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    if (active.kind === 'prompt') queueMicrotask(() => inputRef.current?.focus());
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function finish(result?: boolean | string | null) {
    if (!active) return;
    const current = active;
    const next = queueRef.current.shift() || null;
    setActive(next);
    setValue(next?.kind === 'prompt' ? (next.opts.defaultValue ?? '') : '');

    if (current.kind === 'alert') current.resolve();
    else if (current.kind === 'confirm') current.resolve(Boolean(result));
    else if (current.kind === 'listPicker') current.resolve();
    else if (current.kind === 'share') current.resolve();
    else if (current.kind === 'deleteChoice') {
      current.resolve(result === 'delete' || result === 'flag' ? result : null);
    } else current.resolve(typeof result === 'string' ? result : null);
  }

  function toggleListMembership(list: ProductList, productId: string) {
    if (list.productIds.includes(productId)) removeProductFromList(list.id, productId);
    else addProductToList(list.id, productId);
  }

  function handleAddShareEmail() {
    if (!active || active.kind !== 'share') return;
    const email = shareEmail.trim();
    if (!email) return;
    const { listId } = active.opts;
    addListShare(listId, email).then(() => getListShares(listId).then(setShares));
    setShareEmail('');
  }

  async function handleCreateListForPicker() {
    if (!active || active.kind !== 'listPicker') return;
    const title = newListTitle.trim();
    if (!title) return;
    const list = await createList({ title });
    await addProductToList(list.id, active.opts.productId);
    setNewListTitle('');
  }

  if (!active) return null;

  const title =
    active.kind === 'listPicker'
      ? active.opts.title || 'Add to list'
      : active.kind === 'deleteChoice'
        ? active.opts.title || 'Delete item?'
        : active.kind === 'share'
          ? `Share “${active.opts.listTitle}”`
          : active.opts.title ||
            (active.kind === 'alert' ? 'Notice' : active.kind === 'confirm' ? 'Confirm' : 'Input');
  const message =
    active.kind === 'listPicker' || active.kind === 'share' ? null : active.opts.message;
  const okLabel =
    ('okLabel' in active.opts && active.opts.okLabel) ||
    (active.kind === 'confirm' ? 'Confirm' : 'OK');
  const cancelLabel = ('cancelLabel' in active.opts && active.opts.cancelLabel) || 'Cancel';
  const danger = active.kind === 'confirm' && Boolean(active.opts.danger);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!active) return;
    if (active.kind === 'prompt') finish(value);
    else if (active.kind === 'confirm') finish(true);
    else if (active.kind === 'listPicker') handleCreateListForPicker();
    else if (active.kind === 'share') handleAddShareEmail();
    else finish();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={dismiss}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        className="animate-fade-in relative w-full max-w-md overflow-hidden rounded-[28px] border border-ink/8 bg-white p-6 shadow-[0_24px_80px_rgba(28,27,26,0.18)]"
      >
        <div className="mb-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" className="h-10 w-10 rounded-md" />
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-ink">
            {title}
          </h2>
        </div>

        {message ? <p className="text-[15px] leading-relaxed text-ink/60">{message}</p> : null}

        {active.kind === 'prompt' ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={active.opts.placeholder || 'Type here…'}
            className="mt-4 w-full rounded-2xl border border-ink/10 bg-[#F7F7F5] px-4 py-3 text-[15px] text-ink outline-none ring-brand/30 placeholder:text-ink/35 focus:ring-2"
          />
        ) : null}

        {active.kind === 'listPicker' ? (
          <div className="mt-4 space-y-2">
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {pickerLists.length === 0 ? (
                <p className="text-sm text-ink/40">No lists yet — create one below.</p>
              ) : (
                pickerLists.map((list) => {
                  const inList = list.productIds.includes(active.opts.productId);
                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => toggleListMembership(list, active.opts.productId)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                        inList ? 'border-brand bg-brand/5' : 'border-ink/10 hover:bg-ink/[0.03]'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-ink">{list.title}</span>
                        <span className="block text-xs text-ink/40">
                          {list.productIds.length} item{list.productIds.length === 1 ? '' : 's'}
                        </span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          inList
                            ? 'border-brand bg-brand text-white'
                            : 'border-ink/15 text-transparent'
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="New list name"
                className="flex-1 rounded-2xl border border-ink/10 bg-[#F7F7F5] px-4 py-2.5 text-sm text-ink outline-none ring-brand/30 placeholder:text-ink/35 focus:ring-2"
              />
              <button
                type="submit"
                className="rounded-full bg-ink/[0.06] px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
              >
                Add
              </button>
            </div>
          </div>
        ) : null}

        {active.kind === 'share' ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-ink/45">Anyone with this link can view it</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/s/${active.opts.listId}`}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-[#F7F7F5] px-4 py-2.5 text-sm text-ink/70 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(`${window.location.origin}/s/${active.opts.listId}`)
                      .then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      });
                  }}
                  className="shrink-0 rounded-full bg-ink/[0.06] px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink/45">Invite by email</p>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-[#F7F7F5] px-4 py-2.5 text-sm text-ink outline-none ring-brand/30 placeholder:text-ink/35 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={handleAddShareEmail}
                  className="shrink-0 rounded-full bg-ink/[0.06] px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
                >
                  Add
                </button>
              </div>

              {shares.length ? (
                <div className="mt-2 space-y-1.5">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="truncate text-ink/70">{share.email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          removeListShare(share.id).then(() =>
                            getListShares(active.opts.listId).then(setShares),
                          )
                        }
                        className="shrink-0 text-xs font-medium text-ink/35 hover:text-ink/60"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {active.kind === 'listPicker' || active.kind === 'share' ? (
            <button
              type="button"
              onClick={() => finish()}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Done
            </button>
          ) : active.kind === 'deleteChoice' ? (
            <>
              <button
                type="button"
                onClick={() => finish(null)}
                className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/[0.03]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => finish('delete')}
                className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => finish('flag')}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/80"
              >
                Delete & Flag
              </button>
            </>
          ) : (
            <>
              {active.kind !== 'alert' ? (
                <button
                  type="button"
                  onClick={() => finish(active.kind === 'confirm' ? false : null)}
                  className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/[0.03]"
                >
                  {cancelLabel}
                </button>
              ) : null}
              <button
                type="submit"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                  danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {okLabel}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
