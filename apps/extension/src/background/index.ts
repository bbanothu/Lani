import { chatCompletion, listOllamaModels } from '../lib/llm';
import { LLMSettings, CapturedProduct, getOutbox, clearOutbox, addLog } from '../lib/storage';
import { supabase, getAuthUser } from '../lib/supabase';

// Makes the toolbar icon open the side panel directly instead of a popup.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

function productRow(product: CapturedProduct) {
  return {
    title: product.title,
    price: product.price,
    currency: product.currency,
    image: product.image,
    url: product.url,
    domain: product.domain,
    source: 'extension' as const,
    tags: product.tags,
    added_at: product.capturedAt,
  };
}

// Syncs the local capture queue to Supabase. Capturing (content/detect.ts)
// and syncing are decoupled -- detect.ts just queues locally (cheap, works
// offline), and this drains that queue on an interval so a slow/failed
// network call never blocks page detection. Left alone on failure (network
// down, not signed in) to retry next tick.
async function syncOutbox() {
  const user = await getAuthUser();
  if (!user) return;
  const outbox = await getOutbox();
  if (outbox.length === 0) return;

  // A product page is never scraped into a second row. We split the queue
  // client-side rather than lean on a DB "ON CONFLICT (user_id, url)" clause
  // -- the unique index that backs that isn't guaranteed to exist on the
  // project yet, and a missing-constraint error would wedge every sync.
  // Already-synced URLs get their card reordered (added_at bumped); only
  // genuinely new ones are inserted.
  const urls = [...new Set(outbox.map((p) => p.url))];
  const { data: existing, error: lookupError } = await supabase
    .from('products')
    .select('url')
    .in('url', urls);
  if (lookupError) {
    addLog('lani', `Sync failed: ${lookupError.message}`, 'error');
    return;
  }
  const known = new Set((existing ?? []).map((r) => r.url as string));

  const fresh: CapturedProduct[] = [];
  const queued = new Set<string>();
  for (const product of outbox) {
    if (known.has(product.url) || queued.has(product.url)) continue;
    queued.add(product.url);
    fresh.push(product);
  }

  if (fresh.length > 0) {
    const { error } = await supabase
      .from('products')
      .insert(fresh.map((product) => ({ ...productRow(product), user_id: user.id })));
    if (error) {
      addLog('lani', `Sync failed: ${error.message}`, 'error');
      return;
    }
  }

  // Anything already in the account: float its card back to the top instead
  // of re-adding it.
  const bumps = urls.filter((u) => known.has(u));
  if (bumps.length > 0) {
    await supabase
      .from('products')
      .update({ added_at: new Date().toISOString() })
      .in('url', bumps);
  }

  await clearOutbox();
  if (fresh.length > 0) {
    addLog('lani', `Synced ${fresh.length} product(s) to your Lani account`, 'success');
  }
}

// Revisiting a product page we've already captured: never re-scrape it, just
// push its dashboard card back to the top by refreshing added_at (the
// dashboard sorts by it). RLS ("own products") scopes this to the caller's
// own rows; the url filter picks the one. No row matched -> nothing happens.
async function bumpProduct(url: string) {
  const user = await getAuthUser();
  if (!user) return;
  const { error } = await supabase
    .from('products')
    .update({ added_at: new Date().toISOString() })
    .eq('url', url);
  if (error) addLog('lani', `Reorder failed: ${error.message}`, 'error');
}

// setInterval only keeps firing while the worker happens to be alive (fast
// path during active browsing); MV3 suspends idle workers, which would
// silently stop it. chrome.alarms wakes a suspended worker back up, so it's
// the backstop that guarantees a queued capture eventually syncs even after
// a long idle gap (1 minute is the shortest period Chrome allows).
setInterval(syncOutbox, 5000);
chrome.alarms.create('lani-sync', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'lani-sync') syncOutbox();
});
syncOutbox();

// All LLM/Ollama network calls happen here, not in the content script or
// side panel directly: a content script's fetch runs inside the visited
// page's security context, so an https:// page can't reach a plain
// http://localhost Ollama endpoint (blocked as mixed content). The
// background worker isn't tied to any page's protocol, so it can. Auth and
// product-sync calls live here for the same reason -- one place owns the
// Supabase client and its session.
type Message =
  | { type: 'classify'; prompt: string; settings: LLMSettings }
  | { type: 'listOllamaModels'; baseUrl: string }
  | { type: 'openTabs'; urls: string[] }
  | { type: 'bumpProduct'; url: string }
  | { type: 'authGetUser' }
  | { type: 'authSignIn'; email: string; password: string }
  | { type: 'authSignUp'; email: string; password: string; name: string }
  | { type: 'authSignOut' }
  | { type: 'syncNow' };

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message?.type === 'syncNow') {
    syncOutbox().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'bumpProduct') {
    bumpProduct(message.url).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'authGetUser') {
    getAuthUser()
      .then((user) => sendResponse({ ok: true, user }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message?.type === 'authSignIn') {
    supabase.auth
      .signInWithPassword({ email: message.email, password: message.password })
      .then(({ error }) => {
        if (error) {
          sendResponse({ ok: false, error: error.message });
        } else {
          syncOutbox();
          sendResponse({ ok: true });
        }
      });
    return true;
  }

  if (message?.type === 'authSignUp') {
    supabase.auth
      .signUp({
        email: message.email,
        password: message.password,
        options: { data: { name: message.name || message.email.split('@')[0] } },
      })
      .then(({ error }) => sendResponse({ ok: !error, error: error?.message }));
    return true;
  }

  if (message?.type === 'authSignOut') {
    supabase.auth.signOut().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === 'classify') {
    chatCompletion(message.prompt, message.settings)
      .then((answer) => sendResponse({ ok: true, answer }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true; // keep the message channel open for the async response
  }

  if (message?.type === 'listOllamaModels') {
    listOllamaModels(message.baseUrl)
      .then((models) => sendResponse({ ok: true, models }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true;
  }

  if (message?.type === 'openTabs') {
    const urls = (message.urls || []).filter((u) => typeof u === 'string' && u.length > 0);
    Promise.all(urls.map((url, i) => chrome.tabs.create({ url, active: i === 0 })))
      .then(() => sendResponse({ ok: true, count: urls.length }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return true;
  }
});

// Dev-only auto-reload: `npm run dev` rewrites reload.json with a fresh
// timestamp after every rebuild. Chrome extensions can't hot-swap a running
// worker/content script, so this just detects a change and reloads the
// whole extension -- the closest thing to HMR available here.
let lastVersion: number | null = null;

async function checkForRebuild() {
  try {
    const res = await fetch(chrome.runtime.getURL('reload.json'), {
      cache: 'no-store',
    });
    const { v } = await res.json();
    if (lastVersion !== null && v !== lastVersion) {
      chrome.runtime.reload();
      return;
    }
    lastVersion = v;
  } catch {
    // reload.json not built yet -- ignore until the first build finishes.
  }
}

setInterval(checkForRebuild, 1000);
